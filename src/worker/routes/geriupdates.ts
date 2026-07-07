// Administração do GeriUpdates pela equipe (conteúdos + assinantes).
// Protegida pela sessão da equipe (exigirLogin em index.ts).
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { hashSenha } from "../auth/password";
import {
  guAssinanteCreateSchema,
  guAssinanteUpdateSchema,
  guConteudoCreateSchema,
  guConteudoUpdateSchema,
} from "../../shared/schemas";
import { statusConteudo } from "../services/geriupdates";
import { exigirAdmin, type Env, type Variaveis } from "../auth/middleware";

export const geriupdatesRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  // ── Conteúdos ──────────────────────────────────────────────────────────────
  .get("/conteudos", async (c) => {
    const db = criarDb(c.env.DB);
    const agora = new Date();
    const [lista, leituras] = await Promise.all([
      db
        .select()
        .from(schema.guConteudos)
        .orderBy(sql`${schema.guConteudos.publicadoEm} is null desc`, desc(schema.guConteudos.publicadoEm)),
      db
        .select({ conteudoId: schema.guLeituras.conteudoId, total: sql<number>`count(*)` })
        .from(schema.guLeituras)
        .groupBy(schema.guLeituras.conteudoId),
    ]);
    const porConteudo = new Map(leituras.map((l) => [l.conteudoId, l.total]));
    return c.json({
      conteudos: lista.map((ct) => ({
        ...ct,
        status: statusConteudo(ct.publicadoEm, agora),
        numLeituras: porConteudo.get(ct.id) ?? 0,
      })),
    });
  })
  .post("/conteudos", zValidator("json", guConteudoCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    const agora = new Date().toISOString();
    await db.insert(schema.guConteudos).values({
      id,
      titulo: dados.titulo,
      resumo: dados.resumo || null,
      corpo: dados.corpo,
      tipo: dados.tipo,
      tema: dados.tema || null,
      linkReferencia: dados.linkReferencia || null,
      linkVideo: dados.linkVideo || null,
      linkAudio: dados.linkAudio || null,
      publicadoEm: dados.publicadoEm ?? null,
      autorUsuarioId: c.var.usuario.id,
      createdAt: agora,
      updatedAt: agora,
    });
    return c.json({ id }, 201);
  })
  .patch("/conteudos/:id", zValidator("json", guConteudoUpdateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    await db
      .update(schema.guConteudos)
      .set({ ...dados, updatedAt: new Date().toISOString() })
      .where(eq(schema.guConteudos.id, c.req.param("id")));
    return c.json({ ok: true });
  })
  .delete("/conteudos/:id", exigirAdmin, async (c) => {
    const db = criarDb(c.env.DB);
    await db.delete(schema.guConteudos).where(eq(schema.guConteudos.id, c.req.param("id")));
    return c.json({ ok: true });
  })

  // ── Assinantes ─────────────────────────────────────────────────────────────
  .get("/assinantes", async (c) => {
    const db = criarDb(c.env.DB);
    const [lista, leituras] = await Promise.all([
      db
        .select({
          id: schema.guAssinantes.id,
          nome: schema.guAssinantes.nome,
          email: schema.guAssinantes.email,
          whatsapp: schema.guAssinantes.whatsapp,
          status: schema.guAssinantes.status,
          curseducaId: schema.guAssinantes.curseducaId,
          ultimoAcessoEm: schema.guAssinantes.ultimoAcessoEm,
          createdAt: schema.guAssinantes.createdAt,
        })
        .from(schema.guAssinantes)
        .orderBy(schema.guAssinantes.nome),
      db
        .select({ assinanteId: schema.guLeituras.assinanteId, total: sql<number>`count(*)` })
        .from(schema.guLeituras)
        .groupBy(schema.guLeituras.assinanteId),
    ]);
    const porAssinante = new Map(leituras.map((l) => [l.assinanteId, l.total]));
    return c.json({
      assinantes: lista.map((a) => ({ ...a, numLeituras: porAssinante.get(a.id) ?? 0 })),
    });
  })
  .post("/assinantes", zValidator("json", guAssinanteCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.guAssinantes).values({
      id,
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      senhaHash: await hashSenha(dados.senha),
      whatsapp: dados.whatsapp || null,
      status: dados.status,
      curseducaId: dados.curseducaId || null,
      createdAt: new Date().toISOString(),
    });
    return c.json({ id }, 201);
  })
  .patch("/assinantes/:id", zValidator("json", guAssinanteUpdateSchema), async (c) => {
    const { senha, ...resto } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const valores: Record<string, unknown> = { ...resto };
    if (senha) valores.senhaHash = await hashSenha(senha);
    if (Object.keys(valores).length === 0) return c.json({ ok: true });
    await db.update(schema.guAssinantes).set(valores).where(eq(schema.guAssinantes.id, c.req.param("id")));
    return c.json({ ok: true });
  });
