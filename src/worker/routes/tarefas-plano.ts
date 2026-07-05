import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, ne } from "drizzle-orm";
import { criarDb, schema } from "../db";
import { tarefaPlanoUpdateSchema } from "../../shared/schemas";
import type { Env, Variaveis } from "../auth/middleware";

export const tarefasPlanoRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  // Visão de cobrança do CS: tarefas abertas de todos os mentorados, por vencimento.
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const lista = await db
      .select({
        tarefa: schema.tarefasPlano,
        mentoradoNome: schema.mentorados.nome,
        subgrupo: schema.mentorados.subgrupo,
      })
      .from(schema.tarefasPlano)
      .innerJoin(schema.mentorados, eq(schema.tarefasPlano.mentoradoId, schema.mentorados.id))
      .where(ne(schema.tarefasPlano.status, "abandonada"))
      .orderBy(schema.tarefasPlano.dataLimite);
    return c.json({ tarefas: lista });
  })
  .patch("/:id", zValidator("json", tarefaPlanoUpdateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const valores: Record<string, unknown> = { ...dados };
    if (dados.status === "concluida") valores.concluidaEm = new Date().toISOString();
    if (dados.status && dados.status !== "concluida") valores.concluidaEm = null;
    if (Object.keys(valores).length === 0) return c.json({ ok: true });
    await db.update(schema.tarefasPlano).set(valores).where(eq(schema.tarefasPlano.id, c.req.param("id")));
    return c.json({ ok: true });
  });
