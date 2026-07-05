import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { criarDb, schema, type Db } from "../db";
import { montarPainel, type LinhaPainel } from "../services/painel";
import type { Env, Variaveis } from "../auth/middleware";

async function calcularPainel(db: Db, hoje: Date) {
  const [mentorados, encontros, presencas, sessoesRealizadas, tarefas, indicadores] = await Promise.all([
    db.select().from(schema.mentorados).where(eq(schema.mentorados.status, "ativo")),
    db.select().from(schema.encontros),
    db.select().from(schema.encontrosPresencas),
    db
      .select({ mentoradoId: schema.sessoes.mentoradoId, dataHora: schema.sessoes.dataHora })
      .from(schema.sessoes)
      .where(eq(schema.sessoes.status, "realizada")),
    db
      .select({
        mentoradoId: schema.tarefasPlano.mentoradoId,
        dataLimite: schema.tarefasPlano.dataLimite,
        status: schema.tarefasPlano.status,
        concluidaEm: schema.tarefasPlano.concluidaEm,
      })
      .from(schema.tarefasPlano),
    db
      .select({ mentoradoId: schema.indicadoresMensais.mentoradoId, anoMes: schema.indicadoresMensais.anoMes })
      .from(schema.indicadoresMensais),
  ]);

  const anoMes = hoje.toISOString().slice(0, 7);
  const indicadoresDoMes = new Set(indicadores.filter((i) => i.anoMes === anoMes).map((i) => i.mentoradoId));

  const linhas = montarPainel(
    { mentorados, encontros, presencas, sessoesRealizadas, tarefas, indicadoresDoMes },
    hoje,
  );
  return { mentorados, linhas };
}

/** Materializa o healthscore do mês corrente (usado pelo cron mensal e pelo POST /recalcular). */
export async function materializarHealthscores(db: Db, hoje: Date): Promise<number> {
  const { linhas } = await calcularPainel(db, hoje);
  const anoMes = hoje.toISOString().slice(0, 7);
  for (const l of linhas) {
    await db
      .insert(schema.healthscores)
      .values({
        id: nanoid(),
        mentoradoId: l.mentoradoId,
        anoMes,
        scoreCalculado: l.resultado.score,
        componentes: JSON.stringify(l.resultado.componentes),
        scoreFinal: l.resultado.score,
        cor: l.resultado.cor,
        calculadoEm: hoje.toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.healthscores.mentoradoId, schema.healthscores.anoMes],
        set: {
          scoreCalculado: l.resultado.score,
          componentes: JSON.stringify(l.resultado.componentes),
          scoreFinal: l.resultado.score,
          cor: l.resultado.cor,
          calculadoEm: hoje.toISOString(),
        },
      });
  }
  return linhas.length;
}

export const healthscoresRoutes = new Hono<{ Bindings: Env; Variables: Variaveis }>()
  // Painel CS calculado ao vivo: cada mentorado ativo com score, cor e componentes.
  .get("/painel", async (c) => {
    const db = criarDb(c.env.DB);
    const { mentorados, linhas } = await calcularPainel(db, new Date());
    const porId = new Map<string, LinhaPainel>(linhas.map((l) => [l.mentoradoId, l]));
    return c.json({
      painel: mentorados.map((m) => {
        const l = porId.get(m.id)!;
        return {
          mentorado: m,
          score: l.resultado.score,
          cor: l.resultado.cor,
          componentes: l.resultado.componentes,
          diasSemContato: l.diasSemContato,
          sumido: l.sumido,
          semDados: l.semDados,
        };
      }),
    });
  })
  // Lista de sumidos (segunda-feira): mentorados sem contato há mais de 21 dias + responsável.
  .get("/sumidos", async (c) => {
    const db = criarDb(c.env.DB);
    const { mentorados, linhas } = await calcularPainel(db, new Date());
    const mentoresLista = await db.select().from(schema.mentores);
    const nomeMentor = new Map(mentoresLista.map((m) => [m.id, m.nome]));
    const sumidos = linhas
      .filter((l) => l.sumido)
      .map((l) => {
        const m = mentorados.find((x) => x.id === l.mentoradoId)!;
        return {
          mentorado: m,
          diasSemContato: l.diasSemContato,
          responsavel: m.mentorRecrutadorId ? (nomeMentor.get(m.mentorRecrutadorId) ?? null) : null,
        };
      })
      .sort((a, b) => (b.diasSemContato ?? 9999) - (a.diasSemContato ?? 9999));
    return c.json({ sumidos });
  })
  // Recalcula e grava o histórico do mês corrente.
  .post("/recalcular", async (c) => {
    const db = criarDb(c.env.DB);
    const total = await materializarHealthscores(db, new Date());
    return c.json({ ok: true, mentorados: total });
  });
