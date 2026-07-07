// Sessão do assinante do GeriUpdates — paralela e independente da sessão da
// equipe (cookie e tabela próprios), para o app poder viver no mesmo Worker.
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { criarDb, type Db } from "../db";
import { schema } from "../db";
import type { Env } from "./middleware";

export const COOKIE_SESSAO_GU = "gu_sessao";
const DURACAO_SESSAO_DIAS = 90;

export interface AssinanteSessao {
  id: string;
  nome: string;
  email: string;
}

export interface VariaveisGu {
  assinante: AssinanteSessao;
}

export async function criarSessaoAssinante(db: Db, assinanteId: string): Promise<{ id: string; expiresAt: string }> {
  const id = nanoid(32);
  const expiresAt = new Date(Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000).toISOString();
  await db.insert(schema.guAssinanteSessoes).values({ id, assinanteId, expiresAt });
  return { id, expiresAt };
}

export async function validarSessaoAssinante(db: Db, sessaoId: string): Promise<AssinanteSessao | null> {
  const linhas = await db
    .select({
      expiresAt: schema.guAssinanteSessoes.expiresAt,
      id: schema.guAssinantes.id,
      nome: schema.guAssinantes.nome,
      email: schema.guAssinantes.email,
      status: schema.guAssinantes.status,
    })
    .from(schema.guAssinanteSessoes)
    .innerJoin(schema.guAssinantes, eq(schema.guAssinanteSessoes.assinanteId, schema.guAssinantes.id))
    .where(eq(schema.guAssinanteSessoes.id, sessaoId))
    .limit(1);

  const linha = linhas[0];
  if (!linha || linha.status !== "ativo") return null;
  if (new Date(linha.expiresAt).getTime() < Date.now()) {
    await db.delete(schema.guAssinanteSessoes).where(eq(schema.guAssinanteSessoes.id, sessaoId));
    return null;
  }
  return { id: linha.id, nome: linha.nome, email: linha.email };
}

export async function destruirSessaoAssinante(db: Db, sessaoId: string): Promise<void> {
  await db.delete(schema.guAssinanteSessoes).where(eq(schema.guAssinanteSessoes.id, sessaoId));
}

/** Exige sessão de assinante válida; injeta c.var.assinante. */
export const exigirAssinante = createMiddleware<{ Bindings: Env; Variables: VariaveisGu }>(async (c, next) => {
  const sessaoId = getCookie(c, COOKIE_SESSAO_GU);
  if (!sessaoId) return c.json({ erro: "Não autenticado" }, 401);
  const assinante = await validarSessaoAssinante(criarDb(c.env.DB), sessaoId);
  if (!assinante) return c.json({ erro: "Sessão inválida ou expirada" }, 401);
  c.set("assinante", assinante);
  await next();
});
