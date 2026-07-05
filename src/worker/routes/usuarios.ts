import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { hashSenha } from "../auth/password";
import { usuarioCreateSchema, usuarioUpdateSchema } from "../../shared/schemas";
import { exigirAdmin, type Env, type Variaveis } from "../auth/middleware";

export const usuariosRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const lista = await db
      .select({
        id: schema.usuarios.id,
        nome: schema.usuarios.nome,
        email: schema.usuarios.email,
        papel: schema.usuarios.papel,
        cargo: schema.usuarios.cargo,
        dataInicio: schema.usuarios.dataInicio,
        ativo: schema.usuarios.ativo,
      })
      .from(schema.usuarios)
      .orderBy(schema.usuarios.nome);
    return c.json({ usuarios: lista });
  })
  .post("/", exigirAdmin, zValidator("json", usuarioCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.usuarios).values({
      id,
      nome: dados.nome,
      email: dados.email.toLowerCase(),
      senhaHash: await hashSenha(dados.senha),
      papel: dados.papel,
      cargo: dados.cargo ?? null,
      dataInicio: dados.dataInicio ?? null,
      createdAt: new Date().toISOString(),
    });
    return c.json({ id }, 201);
  })
  .patch("/:id", exigirAdmin, zValidator("json", usuarioUpdateSchema), async (c) => {
    const { senha, ...resto } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const valores: Record<string, unknown> = { ...resto };
    if (senha) valores.senhaHash = await hashSenha(senha);
    if (Object.keys(valores).length === 0) return c.json({ ok: true });
    await db.update(schema.usuarios).set(valores).where(eq(schema.usuarios.id, c.req.param("id")));
    return c.json({ ok: true });
  });
