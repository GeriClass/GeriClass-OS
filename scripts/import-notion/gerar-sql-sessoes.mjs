// Gera SQL de import das 🧭 Sessões Individuais do Notion.
//
// Formato de data/sessoes.json (compacto, uma linha por sessão):
//   id: sufixo da URL da página no Notion
//   t:  tipo — B=Bússola, O=Onboarding, A=Acompanhamento, AN=Âncora, F=Flecha, null=desconhecido
//   d:  data (ISO)
//   s:  status — R=Realizada, AG=Agendada, RE=Reagendada, C=Cancelada
//   m:  sufixo da URL do mentorado no Notion
//   mt: mentor — D=Daniel, R=Rafael, L=Louise, I=Isabel, null=sem registro
//
// Uso: node scripts/import-notion/gerar-sql-sessoes.mjs
//   depois: wrangler d1 execute gericlass_os --local --file=scripts/import-notion/data/import-sessoes.sql

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const sessoes = JSON.parse(readFileSync(join(dir, "data/sessoes.json"), "utf8"));
const mentorados = JSON.parse(readFileSync(join(dir, "data/mentorados.json"), "utf8"));

const idsMentorados = new Set(mentorados.map((m) => `mto_${m.url.split("/").pop().slice(-12)}`));

const TIPO = { B: "bussola", O: "onboarding", A: "acompanhamento", AN: "acompanhamento", F: "acompanhamento" };
const NOTA_TIPO = { AN: "⚓ Âncora", F: "🏹 Flecha", null: "tipo não informado no Notion" };
const STATUS = { R: "realizada", AG: "agendada", RE: "agendada", C: "cancelada" };
const MENTOR = { D: "mtr_daniel", R: "mtr_rafael", L: "mtr_louise", I: "mtr_isabel" };

const esc = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replaceAll("'", "''")}'`);

let pulados = 0;
const stmts = [];
for (const s of sessoes) {
  const mentoradoId = `mto_${s.m.slice(-12)}`;
  if (!idsMentorados.has(mentoradoId)) {
    console.warn(`pulando sessão ${s.id}: mentorado ${s.m} não importado`);
    pulados++;
    continue;
  }
  const nota = NOTA_TIPO[s.t ?? "null"] ?? null;
  stmts.push(
    `INSERT INTO sessoes (id, mentorado_id, mentor_id, tipo, data_hora, status, resumo, link_notas, created_at)\n` +
      `VALUES (${esc(`ses_${s.id.slice(-12)}`)}, ${esc(mentoradoId)}, ${esc(s.mt ? MENTOR[s.mt] : null)}, ` +
      `${esc(TIPO[s.t] ?? "acompanhamento")}, ${esc(s.d ? `${s.d}T12:00:00Z` : null)}, ${esc(STATUS[s.s] ?? "realizada")}, ` +
      `${esc(nota ? `Importado do Notion (${nota})` : null)}, ${esc(`https://www.notion.so/${s.id}`)}, datetime('now'))\n` +
      `ON CONFLICT(id) DO UPDATE SET mentor_id=excluded.mentor_id, tipo=excluded.tipo, data_hora=excluded.data_hora, ` +
      `status=excluded.status, link_notas=excluded.link_notas;`,
  );
}

writeFileSync(join(dir, "data/import-sessoes.sql"), stmts.join("\n") + "\n");
console.log(`Gerado data/import-sessoes.sql com ${stmts.length} sessões (${pulados} puladas).`);
