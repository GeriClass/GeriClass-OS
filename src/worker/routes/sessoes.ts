import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { sessaoCreateSchema, sessaoUpdateSchema } from "../../shared/schemas";
import type { Env, Variaveis } from "../auth/middleware";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export const sessoesRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const lista = await db
      .select({
        sessao: schema.sessoes,
        mentoradoNome: schema.mentorados.nome,
        mentorNome: schema.mentores.nome,
      })
      .from(schema.sessoes)
      .innerJoin(schema.mentorados, eq(schema.sessoes.mentoradoId, schema.mentorados.id))
      .leftJoin(schema.mentores, eq(schema.sessoes.mentorId, schema.mentores.id))
      .orderBy(desc(schema.sessoes.dataHora));
    return c.json({ sessoes: lista });
  })
  .post("/", zValidator("json", sessaoCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.sessoes).values({
      id,
      mentoradoId: dados.mentoradoId,
      mentorId: dados.mentorId ?? null,
      tipo: dados.tipo,
      dataHora: dados.dataHora,
      status: dados.status,
      resumo: dados.resumo ?? null,
      linkNotas: dados.linkNotas ?? null,
      createdAt: new Date().toISOString(),
    });
    return c.json({ id }, 201);
  })
  // Atualiza a sessão; ao marcar como realizada, aceita to-dos de 30/60 dias em lote.
  .patch("/:id", zValidator("json", sessaoUpdateSchema), async (c) => {
    const { novasTarefas, ...dados } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = c.req.param("id");

    const sessao = (await db.select().from(schema.sessoes).where(eq(schema.sessoes.id, id)).limit(1))[0];
    if (!sessao) return c.json({ erro: "Sessão não encontrada" }, 404);

    if (Object.keys(dados).length > 0) {
      await db.update(schema.sessoes).set(dados).where(eq(schema.sessoes.id, id));
    }

    if (novasTarefas && novasTarefas.length > 0) {
      const agora = new Date();
      const base = dados.dataHora ?? sessao.dataHora;
      const dataBase = new Date(base);
      await db.insert(schema.tarefasPlano).values(
        novasTarefas.map((t) => ({
          id: nanoid(),
          sessaoId: id,
          mentoradoId: sessao.mentoradoId,
          descricao: t.descricao,
          prazoTipo: t.prazoTipo,
          dataLimite: new Date(dataBase.getTime() + t.prazoTipo * MS_POR_DIA).toISOString().slice(0, 10),
          createdAt: agora.toISOString(),
        })),
      );
    }

    return c.json({ ok: true });
  });
