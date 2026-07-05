import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { criarDb, schema } from "../db";
import { mentorCreateSchema } from "../../shared/schemas";
import type { Env, Variaveis } from "../auth/middleware";

export const mentoresRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .get("/", async (c) => {
    const db = criarDb(c.env.DB);
    const lista = await db.select().from(schema.mentores).orderBy(schema.mentores.nome);
    return c.json({ mentores: lista });
  })
  .post("/", zValidator("json", mentorCreateSchema), async (c) => {
    const dados = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const id = nanoid();
    await db.insert(schema.mentores).values({
      id,
      nome: dados.nome,
      email: dados.email || null,
      usuarioId: dados.usuarioId ?? null,
    });
    return c.json({ id }, 201);
  });
