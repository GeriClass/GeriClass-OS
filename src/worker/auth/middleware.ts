import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { criarDb } from "../db";
import { COOKIE_SESSAO, validarSessao, type UsuarioSessao } from "./session";

export interface Env {
  DB: D1Database;
}

export interface Variaveis {
  usuario: UsuarioSessao;
}

/** Exige sessão válida; injeta c.var.usuario. */
export const exigirLogin = createMiddleware<{ Bindings: Env; Variables: Variaveis }>(async (c, next) => {
  const sessaoId = getCookie(c, COOKIE_SESSAO);
  if (!sessaoId) return c.json({ erro: "Não autenticado" }, 401);
  const usuario = await validarSessao(criarDb(c.env.DB), sessaoId);
  if (!usuario) return c.json({ erro: "Sessão inválida ou expirada" }, 401);
  c.set("usuario", usuario);
  await next();
});

/** Exige papel admin (usar depois de exigirLogin). */
export const exigirAdmin = createMiddleware<{ Bindings: Env; Variables: Variaveis }>(async (c, next) => {
  if (c.var.usuario.papel !== "admin") return c.json({ erro: "Apenas administradores" }, 403);
  await next();
});
