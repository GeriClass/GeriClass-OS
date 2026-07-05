import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Db } from "../db";
import { schema } from "../db";

export const COOKIE_SESSAO = "gc_sessao";
const DURACAO_SESSAO_DIAS = 30;

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "mentor" | "cs" | "equipe";
}

export async function criarSessao(db: Db, usuarioId: string): Promise<{ id: string; expiresAt: string }> {
  const id = nanoid(32);
  const expiresAt = new Date(Date.now() + DURACAO_SESSAO_DIAS * 24 * 60 * 60 * 1000).toISOString();
  await db.insert(schema.authSessoes).values({ id, usuarioId, expiresAt });
  return { id, expiresAt };
}

export async function validarSessao(db: Db, sessaoId: string): Promise<UsuarioSessao | null> {
  const linhas = await db
    .select({
      sessaoId: schema.authSessoes.id,
      expiresAt: schema.authSessoes.expiresAt,
      id: schema.usuarios.id,
      nome: schema.usuarios.nome,
      email: schema.usuarios.email,
      papel: schema.usuarios.papel,
      ativo: schema.usuarios.ativo,
    })
    .from(schema.authSessoes)
    .innerJoin(schema.usuarios, eq(schema.authSessoes.usuarioId, schema.usuarios.id))
    .where(eq(schema.authSessoes.id, sessaoId))
    .limit(1);

  const linha = linhas[0];
  if (!linha || !linha.ativo) return null;
  if (new Date(linha.expiresAt).getTime() < Date.now()) {
    await db.delete(schema.authSessoes).where(eq(schema.authSessoes.id, sessaoId));
    return null;
  }
  return { id: linha.id, nome: linha.nome, email: linha.email, papel: linha.papel };
}

export async function destruirSessao(db: Db, sessaoId: string): Promise<void> {
  await db.delete(schema.authSessoes).where(eq(schema.authSessoes.id, sessaoId));
}
