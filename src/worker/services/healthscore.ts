import { corDoScore, type CorHealthScore } from "../../shared/constantes";

export interface EntradasHealthScore {
  /** Encontros do subgrupo nos últimos 60 dias e quantos o mentorado compareceu. */
  encontrosNoPeriodo: number;
  presencasNoPeriodo: number;
  /** Dias desde a última sessão realizada (null = nunca teve sessão). */
  diasDesdeUltimaSessao: number | null;
  /** Tarefas de plano com data-limite já passada e quantas dessas foram concluídas. */
  tarefasVencidas: number;
  tarefasVencidasConcluidas: number;
  /** Indicadores do mês corrente enviados? */
  indicadoresDoMesEnviados: boolean;
  /** Dias desde o último contato registrado (presença, sessão ou tarefa concluída). */
  diasSemContato: number | null;
}

export interface ResultadoHealthScore {
  score: number;
  cor: CorHealthScore;
  componentes: {
    presenca: number;
    sessoes: number;
    tarefas: number;
    indicadores: number;
    penalidadeContato: number;
  };
}

/**
 * Fórmula v1 (0–100):
 *  - presença em encontros (últimos 60d): até 30 pts
 *  - recência de sessão individual: até 30 pts
 *  - execução de tarefas do plano no prazo: até 25 pts
 *  - indicadores do mês enviados: 15 pts
 *  - penalidade por dias sem contato: até -30 pts
 */
export function calcularHealthScore(e: EntradasHealthScore): ResultadoHealthScore {
  const presenca =
    e.encontrosNoPeriodo === 0 ? 15 : Math.round(30 * (e.presencasNoPeriodo / e.encontrosNoPeriodo));

  let sessoesPts: number;
  if (e.diasDesdeUltimaSessao === null) sessoesPts = 0;
  else if (e.diasDesdeUltimaSessao <= 30) sessoesPts = 30;
  else if (e.diasDesdeUltimaSessao <= 60) sessoesPts = 20;
  else if (e.diasDesdeUltimaSessao <= 90) sessoesPts = 10;
  else sessoesPts = 0;

  const tarefas =
    e.tarefasVencidas === 0 ? 15 : Math.round(25 * (e.tarefasVencidasConcluidas / e.tarefasVencidas));

  const indicadores = e.indicadoresDoMesEnviados ? 15 : 0;

  let penalidade = 0;
  if (e.diasSemContato !== null) {
    if (e.diasSemContato > 60) penalidade = -30;
    else if (e.diasSemContato > 30) penalidade = -15;
  } else {
    penalidade = -30; // nunca teve contato registrado
  }

  const score = Math.max(0, Math.min(100, presenca + sessoesPts + tarefas + indicadores + penalidade));
  return {
    score,
    cor: corDoScore(score),
    componentes: { presenca, sessoes: sessoesPts, tarefas, indicadores, penalidadeContato: penalidade },
  };
}

/** "Sumido" = sem qualquer contato registrado há mais de N dias (derivado, nunca gravado). */
export const DIAS_PARA_SUMIDO = 21;

export function estaSumido(diasSemContato: number | null): boolean {
  return diasSemContato === null || diasSemContato > DIAS_PARA_SUMIDO;
}
