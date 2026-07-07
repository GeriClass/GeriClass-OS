// API do app do assinante (GeriUpdates). Autenticação própria — ver auth/assinante.ts.
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { and, desc, eq, isNotNull, like, lte, or } from "drizzle-orm";
import { criarDb, schema } from "../db";
import { verificarSenha, hashSenha } from "../auth/password";
import {
  COOKIE_SESSAO_GU,
  criarSessaoAssinante,
  destruirSessaoAssinante,
  validarSessaoAssinante,
  exigirAssinante,
  type VariaveisGu,
} from "../auth/assinante";
import { guAlterarSenhaSchema, guMarcarSchema, loginSchema } from "../../shared/schemas";
import type { Env } from "../auth/middleware";

const agoraIso = () => new Date().toISOString();

/** Filtro de conteúdo visível ao assinante: publicado_em não-nulo e no passado. */
const publicado = () =>
  and(isNotNull(schema.guConteudos.publicadoEm), lte(schema.guConteudos.publicadoEm, agoraIso()));

export const guAppRoutes = new Hono<{ Bindings: Env; Variables: VariaveisGu }>()
  // ── Auth do assinante ──────────────────────────────────────────────────────
  .post("/auth/login", zValidator("json", loginSchema), async (c) => {
    const { email, senha } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const assinante = (
      await db.select().from(schema.guAssinantes).where(eq(schema.guAssinantes.email, email.toLowerCase())).limit(1)
    )[0];
    if (!assinante || assinante.status !== "ativo" || !(await verificarSenha(senha, assinante.senhaHash))) {
      return c.json({ erro: "Email ou senha inválidos" }, 401);
    }
    const sessao = await criarSessaoAssinante(db, assinante.id);
    await db
      .update(schema.guAssinantes)
      .set({ ultimoAcessoEm: agoraIso() })
      .where(eq(schema.guAssinantes.id, assinante.id));
    setCookie(c, COOKIE_SESSAO_GU, sessao.id, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      expires: new Date(sessao.expiresAt),
    });
    return c.json({ assinante: { id: assinante.id, nome: assinante.nome, email: assinante.email } });
  })
  .post("/auth/logout", async (c) => {
    const sessaoId = getCookie(c, COOKIE_SESSAO_GU);
    if (sessaoId) await destruirSessaoAssinante(criarDb(c.env.DB), sessaoId);
    deleteCookie(c, COOKIE_SESSAO_GU, { path: "/" });
    return c.json({ ok: true });
  })
  .get("/auth/me", async (c) => {
    const sessaoId = getCookie(c, COOKIE_SESSAO_GU);
    if (!sessaoId) return c.json({ assinante: null });
    const assinante = await validarSessaoAssinante(criarDb(c.env.DB), sessaoId);
    return c.json({ assinante });
  })

  // ── Daqui pra baixo, só assinante logado ───────────────────────────────────
  .use("/*", exigirAssinante)

  // Feed de conteúdos publicados, com flags lido/salvo do assinante.
  // Filtros: ?tema= ?tipo= ?q= (busca em título/resumo/tema) ?salvos=1
  .get("/feed", async (c) => {
    const db = criarDb(c.env.DB);
    const assinanteId = c.var.assinante.id;
    const { tema, tipo, q, salvos } = c.req.query();

    const condicoes = [publicado()];
    if (tema) condicoes.push(eq(schema.guConteudos.tema, tema));
    if (tipo === "artigo" || tipo === "video" || tipo === "audio" || tipo === "material")
      condicoes.push(eq(schema.guConteudos.tipo, tipo));
    if (q) {
      const padrao = `%${q}%`;
      condicoes.push(
        or(
          like(schema.guConteudos.titulo, padrao),
          like(schema.guConteudos.resumo, padrao),
          like(schema.guConteudos.tema, padrao),
        ),
      );
    }

    const [conteudos, leituras, marcados, temas] = await Promise.all([
      db
        .select({
          id: schema.guConteudos.id,
          titulo: schema.guConteudos.titulo,
          resumo: schema.guConteudos.resumo,
          tipo: schema.guConteudos.tipo,
          tema: schema.guConteudos.tema,
          publicadoEm: schema.guConteudos.publicadoEm,
        })
        .from(schema.guConteudos)
        .where(and(...condicoes))
        .orderBy(desc(schema.guConteudos.publicadoEm))
        .limit(200),
      db
        .select({ conteudoId: schema.guLeituras.conteudoId })
        .from(schema.guLeituras)
        .where(eq(schema.guLeituras.assinanteId, assinanteId)),
      db
        .select({ conteudoId: schema.guSalvos.conteudoId })
        .from(schema.guSalvos)
        .where(eq(schema.guSalvos.assinanteId, assinanteId)),
      db
        .selectDistinct({ tema: schema.guConteudos.tema })
        .from(schema.guConteudos)
        .where(and(publicado(), isNotNull(schema.guConteudos.tema)))
        .orderBy(schema.guConteudos.tema),
    ]);

    const lidos = new Set(leituras.map((l) => l.conteudoId));
    const salvosSet = new Set(marcados.map((s) => s.conteudoId));
    let lista = conteudos.map((ct) => ({ ...ct, lido: lidos.has(ct.id), salvo: salvosSet.has(ct.id) }));
    if (salvos === "1") lista = lista.filter((ct) => ct.salvo);

    return c.json({ conteudos: lista, temas: temas.map((t) => t.tema).filter(Boolean) });
  })

  .get("/conteudos/:id", async (c) => {
    const db = criarDb(c.env.DB);
    const assinanteId = c.var.assinante.id;
    const id = c.req.param("id");
    const conteudo = (
      await db
        .select()
        .from(schema.guConteudos)
        .where(and(eq(schema.guConteudos.id, id), publicado()))
        .limit(1)
    )[0];
    if (!conteudo) return c.json({ erro: "Conteúdo não encontrado" }, 404);

    const [lido, salvo] = await Promise.all([
      db
        .select()
        .from(schema.guLeituras)
        .where(and(eq(schema.guLeituras.conteudoId, id), eq(schema.guLeituras.assinanteId, assinanteId)))
        .limit(1),
      db
        .select()
        .from(schema.guSalvos)
        .where(and(eq(schema.guSalvos.conteudoId, id), eq(schema.guSalvos.assinanteId, assinanteId)))
        .limit(1),
    ]);
    const { autorUsuarioId: _autor, ...publico } = conteudo;
    return c.json({ conteudo: { ...publico, lido: lido.length > 0, salvo: salvo.length > 0 } });
  })

  .put("/conteudos/:id/lido", zValidator("json", guMarcarSchema), async (c) => {
    const { valor } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const chave = { conteudoId: c.req.param("id"), assinanteId: c.var.assinante.id };
    if (valor) {
      await db
        .insert(schema.guLeituras)
        .values({ ...chave, lidoEm: agoraIso() })
        .onConflictDoNothing();
    } else {
      await db
        .delete(schema.guLeituras)
        .where(and(eq(schema.guLeituras.conteudoId, chave.conteudoId), eq(schema.guLeituras.assinanteId, chave.assinanteId)));
    }
    return c.json({ ok: true });
  })

  .put("/conteudos/:id/salvo", zValidator("json", guMarcarSchema), async (c) => {
    const { valor } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const chave = { conteudoId: c.req.param("id"), assinanteId: c.var.assinante.id };
    if (valor) {
      await db
        .insert(schema.guSalvos)
        .values({ ...chave, salvoEm: agoraIso() })
        .onConflictDoNothing();
    } else {
      await db
        .delete(schema.guSalvos)
        .where(and(eq(schema.guSalvos.conteudoId, chave.conteudoId), eq(schema.guSalvos.assinanteId, chave.assinanteId)));
    }
    return c.json({ ok: true });
  })

  .patch("/perfil/senha", zValidator("json", guAlterarSenhaSchema), async (c) => {
    const { senhaAtual, novaSenha } = c.req.valid("json");
    const db = criarDb(c.env.DB);
    const assinante = (
      await db.select().from(schema.guAssinantes).where(eq(schema.guAssinantes.id, c.var.assinante.id)).limit(1)
    )[0];
    if (!assinante || !(await verificarSenha(senhaAtual, assinante.senhaHash))) {
      return c.json({ erro: "Senha atual incorreta" }, 400);
    }
    await db
      .update(schema.guAssinantes)
      .set({ senhaHash: await hashSenha(novaSenha) })
      .where(eq(schema.guAssinantes.id, assinante.id));
    return c.json({ ok: true });
  });
