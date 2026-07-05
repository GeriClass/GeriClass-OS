import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { criarDb, schema } from "../db";
import { verificarSenha } from "../auth/password";
import { COOKIE_SESSAO, criarSessao, destruirSessao, validarSessao } from "../auth/session";
import { loginSchema } from "../../shared/schemas";
import type { Env, Variaveis } from "../auth/middleware";

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, senha } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const usuario = (
      await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email.toLowerCase())).limit(1)
    )[0];
    if (!usuario || !usuario.ativo || !(await verificarSenha(senha, usuario.senhaHash))) {
      return c.json({ erro: "Email ou senha inválidos" }, 401);
    }
    const sessao = await criarSessao(db, usuario.id);
    setCookie(c, COOKIE_SESSAO, sessao.id, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      expires: new Date(sessao.expiresAt),
    });
    return c.json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    });
  })
  .post("/logout", async (c) => {
    const sessaoId = getCookie(c, COOKIE_SESSAO);
    if (sessaoId) await destruirSessao(criarDb(c.env.DB), sessaoId);
    deleteCookie(c, COOKIE_SESSAO, { path: "/" });
    return c.json({ ok: true });
  })
  .get("/me", async (c) => {
    const sessaoId = getCookie(c, COOKIE_SESSAO);
    if (!sessaoId) return c.json({ usuario: null });
    const usuario = await validarSessao(criarDb(c.env.DB), sessaoId);
    return c.json({ usuario });
  });
