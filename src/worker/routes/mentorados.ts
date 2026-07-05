import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { mentoradoCreateSchema, mentoradoUpdateSchema } from "../../shared/schemas";
import { calcularSituacaoBussola } from "../services/bussola";
import type { Env, Variaveis } from "../auth/middleware";

export const mentoradosRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const lista = await db.select().from(schema.mentorados).orderBy(schema.mentorados.nome);
    return c.json({ mentorados: lista });
  })
  // Tracker da Bússola: mentorados ativos e a situação da 1ª Bússola de cada um.
  .get("/bussolas", async (c) => {
    const db = criarDb(c.env.DB);
    const ativos = await db
      .select()
      .from(schema.mentorados)
      .where(eq(schema.mentorados.status, "ativo"));

    const ids = ativos.map((m) => m.id);
    const bussolas = ids.length
      ? await db
          .select()
          .from(schema.sessoes)
          .where(and(inArray(schema.sessoes.mentoradoId, ids), eq(schema.sessoes.tipo, "bussola")))
      : [];

    const hoje = new Date();
    const resultado = ativos.map((m) => {
      const doMentorado = bussolas.filter((s) => s.mentoradoId === m.id);
      // "realizada" domina; senão a mais recente agendada; senão nenhuma
      const realizada = doMentorado.find((s) => s.status === "realizada");
      const agendada = doMentorado
        .filter((s) => s.status === "agendada")
        .sort((a, b) => a.dataHora.localeCompare(b.dataHora))[0];
      const referencia = realizada ?? agendada ?? null;
      return {
        mentorado: m,
        bussola: referencia,
        situacao: calcularSituacaoBussola(m.dataEntrada, referencia, hoje),
      };
    });

    // Vencidas primeiro, depois por dias restantes
    const ordem = { vencida: 0, vencendo: 1, sem_data_entrada: 2, no_prazo: 3, agendada: 4, realizada: 5 };
    resultado.sort((a, b) => ordem[a.situacao.situacao] - ordem[b.situacao.situacao]);
    return c.json({ bussolas: resultado });
  })
  .get("/:id", async (c) => {
    const db = criarDb(c.env.DB);
    const id = c.req.param("id");
    const mentorado = (
      await db.select().from(schema.mentorados).where(eq(schema.mentorados.id, id)).limit(1)
    )[0];
    if (!mentorado) return c.json({ erro: "Mentorado não encontrado" }, 404);

    const [sessoesDoMentorado, tarefas, diagnostico, scores] = await Promise.all([
      db
        .select()
        .from(schema.sessoes)
        .where(eq(schema.sessoes.mentoradoId, id))
        .orderBy(desc(schema.sessoes.dataHora)),
      db
        .select()
        .from(schema.tarefasPlano)
        .where(eq(schema.tarefasPlano.mentoradoId, id))
        .orderBy(schema.tarefasPlano.dataLimite),
      db
        .select()
        .from(schema.diagnosticosEntrada)
        .where(eq(schema.diagnosticosEntrada.mentoradoId, id))
        .limit(1),
      db
        .select()
        .from(schema.healthscores)
        .where(eq(schema.healthscores.mentoradoId, id))
        .orderBy(schema.healthscores.anoMes),
    ]);

    return c.json({
      mentorado,
      sessoes: sessoesDoMentorado,
      tarefas,
      diagnostico: diagnostico[0] ?? null,
      healthscores: scores,
      bussola: calcularSituacaoBussola(
        mentorado.dataEntrada,
        sessoesDoMentorado.find((s) => s.tipo === "bussola" && s.status === "realizada") ??
          sessoesDoMentorado.find((s) => s.tipo === "bussola" && s.status === "agendada") ??
          null,
        new Date(),
      ),
    });
  })
  .post("/", zValidator("json", mentoradoCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.mentorados).values({
      id,
      nome: dados.nome,
      email: dados.email || null,
      whatsapp: dados.whatsapp ?? null,
      cidade: dados.cidade ?? null,
      uf: dados.uf ?? null,
      subgrupo: dados.subgrupo,
      status: dados.status,
      turma: dados.turma ?? null,
      mentorRecrutadorId: dados.mentorRecrutadorId ?? null,
      dataEntrada: dados.dataEntrada ?? null,
      curseducaId: dados.curseducaId ?? null,
      notionUrl: dados.notionUrl ?? null,
      createdAt: new Date().toISOString(),
    });
    return c.json({ id }, 201);
  })
  .patch("/:id", zValidator("json", mentoradoUpdateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    if (Object.keys(dados).length === 0) return c.json({ ok: true });
    await db
      .update(schema.mentorados)
      .set({ ...dados, email: dados.email === "" ? null : dados.email })
      .where(eq(schema.mentorados.id, c.req.param("id")));
    return c.json({ ok: true });
  });
