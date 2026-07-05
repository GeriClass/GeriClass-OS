import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, or, isNull, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { encontroCreateSchema, presencasSchema } from "../../shared/schemas";
import type { Env, Variaveis } from "../auth/middleware";

export const encontrosRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const [lista, presencas] = await Promise.all([
      db.select().from(schema.encontros).orderBy(desc(schema.encontros.dataHora)),
      db.select().from(schema.encontrosPresencas).where(eq(schema.encontrosPresencas.presente, true)),
    ]);
    const porEncontro = new Map<string, number>();
    for (const p of presencas) porEncontro.set(p.encontroId, (porEncontro.get(p.encontroId) ?? 0) + 1);
    return c.json({
      encontros: lista.map((e) => ({ ...e, numPresentes: porEncontro.get(e.id) ?? 0 })),
    });
  })
  .post("/", zValidator("json", encontroCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.encontros).values({
      id,
      titulo: dados.titulo,
      subgrupo: dados.subgrupo ?? null,
      dataHora: dados.dataHora,
      mentorId: dados.mentorId ?? null,
      tema: dados.tema ?? null,
      linkGravacao: dados.linkGravacao ?? null,
      notionUrl: dados.notionUrl ?? null,
    });
    return c.json({ id }, 201);
  })
  // Encontro + checklist: mentorados ativos elegíveis (do subgrupo, ou todos) com presença atual.
  .get("/:id", async (c) => {
    const db = criarDb(c.env.DB);
    const id = c.req.param("id");
    const encontro = (await db.select().from(schema.encontros).where(eq(schema.encontros.id, id)).limit(1))[0];
    if (!encontro) return c.json({ erro: "Encontro não encontrado" }, 404);

    const [elegiveis, presencas] = await Promise.all([
      db
        .select({ id: schema.mentorados.id, nome: schema.mentorados.nome, subgrupo: schema.mentorados.subgrupo })
        .from(schema.mentorados)
        .where(
          encontro.subgrupo
            ? and(eq(schema.mentorados.status, "ativo"), or(eq(schema.mentorados.subgrupo, encontro.subgrupo), isNull(schema.mentorados.subgrupo)))
            : eq(schema.mentorados.status, "ativo"),
        )
        .orderBy(schema.mentorados.nome),
      db.select().from(schema.encontrosPresencas).where(eq(schema.encontrosPresencas.encontroId, id)),
    ]);

    const presentes = new Set(presencas.filter((p) => p.presente).map((p) => p.mentoradoId));
    return c.json({
      encontro,
      participantes: elegiveis.map((m) => ({ ...m, presente: presentes.has(m.id) })),
    });
  })
  // Grava o checklist de presença em lote (substitui o estado dos enviados).
  .put("/:id/presencas", zValidator("json", presencasSchema), async (c) => {
    const { presencas } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = c.req.param("id");
    for (const p of presencas) {
      await db
        .insert(schema.encontrosPresencas)
        .values({ encontroId: id, mentoradoId: p.mentoradoId, presente: p.presente })
        .onConflictDoUpdate({
          target: [schema.encontrosPresencas.encontroId, schema.encontrosPresencas.mentoradoId],
          set: { presente: p.presente },
        });
    }
    return c.json({ ok: true });
  });
