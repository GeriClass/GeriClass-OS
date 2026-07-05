// Gera SQL de import dos mentorados a partir do export da base 🧑 Mentorados do Notion.
//
// Uso:
//   1. Consultar a base no Notion (via MCP/API) selecionando:
//      url, Nome, "E-mail", Celular, Cidade, Estado, Subgrupo, Status, Turma,
//      "date:Matrícula:start" AS matricula, Mentor
//   2. Salvar o array de resultados em scripts/import-notion/data/mentorados.json
//   3. node scripts/import-notion/gerar-sql.mjs
//   4. wrangler d1 execute gericlass_os --local --file=scripts/import-notion/data/import.sql
//
// Os dados ficam em data/ (gitignored) — nunca commitar dados reais.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const linhas = JSON.parse(readFileSync(join(dir, "data/mentorados.json"), "utf8"));

// Mentores do Notion → IDs do seed (usuários "Sem Mentor Flecha"/"Convidado" viram sem mentor).
const MAPA_MENTOR = {
  "35b86d56658f80059e51f1c1ec12f642": "mtr_daniel",
  "35b86d56658f80c0b23ffe182023b954": "mtr_rafael",
  "35b86d56658f80c48420f4d45c487b8a": "mtr_louise",
};

const MAPA_SUBGRUPO = {
  "🌱 Semente": "semente",
  "🌿 Broto": "broto",
  "🌳 Árvore": "arvore",
  "🍎 Frutos": "frutos",
};

// Status do Notion → status do app.
const MAPA_STATUS = {
  Ativo: "ativo",
  "Renovou 1": "ativo",
  "Renovou 2": "ativo",
  "Meses Extras": "ativo",
  "Aguardando Renovação": "pausado",
  Finalizou: "encerrado",
  Cancelou: "encerrado",
};

const esc = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replaceAll("'", "''")}'`);

const stmts = linhas.map((l) => {
  const notionId = l.url.split("/").pop();
  const id = `mto_${notionId.slice(-12)}`;
  const mentorUrls = l.Mentor ? JSON.parse(l.Mentor) : [];
  const mentorId = mentorUrls.map((u) => MAPA_MENTOR[u.split("/").pop()]).find(Boolean) ?? null;
  const estado = l.Estado ? (JSON.parse(l.Estado)[0] ?? null) : null;
  const notionUrl = `https://www.notion.so/${notionId}`;
  return (
    `INSERT INTO mentorados (id, nome, email, whatsapp, cidade, uf, subgrupo, status, turma, mentor_recrutador_id, data_entrada, notion_url, created_at)\n` +
    `VALUES (${esc(id)}, ${esc(l.Nome?.trim())}, ${esc(l["E-mail"]?.trim().toLowerCase())}, ${esc(l.Celular)}, ${esc(l.Cidade)}, ${esc(estado)}, ` +
    `${esc(MAPA_SUBGRUPO[l.Subgrupo] ?? "semente")}, ${esc(MAPA_STATUS[l.Status] ?? "ativo")}, ${esc(l.Turma)}, ${esc(mentorId)}, ` +
    `${esc(l.matricula)}, ${esc(notionUrl)}, datetime('now'))\n` +
    `ON CONFLICT(id) DO UPDATE SET nome=excluded.nome, email=excluded.email, whatsapp=excluded.whatsapp, cidade=excluded.cidade, uf=excluded.uf, ` +
    `subgrupo=excluded.subgrupo, status=excluded.status, turma=excluded.turma, mentor_recrutador_id=excluded.mentor_recrutador_id, ` +
    `data_entrada=excluded.data_entrada, notion_url=excluded.notion_url;`
  );
});

mkdirSync(join(dir, "data"), { recursive: true });
writeFileSync(join(dir, "data/import.sql"), stmts.join("\n") + "\n");

const ativos = linhas.filter((l) => ["Ativo", "Renovou 1", "Renovou 2", "Meses Extras"].includes(l.Status)).length;
console.log(`Gerado data/import.sql com ${stmts.length} mentorados (${ativos} ativos).`);
