export const SUBGRUPOS = ["semente", "broto", "arvore", "frutos"] as const;
export type Subgrupo = (typeof SUBGRUPOS)[number];

export const SUBGRUPO_LABEL: Record<Subgrupo, string> = {
  semente: "Semente",
  broto: "Broto",
  arvore: "Árvore",
  frutos: "Frutos",
};

export const STATUS_MENTORADO = ["ativo", "pausado", "encerrado"] as const;
export type StatusMentorado = (typeof STATUS_MENTORADO)[number];

export const TIPOS_SESSAO = ["onboarding", "bussola", "acompanhamento"] as const;
export type TipoSessao = (typeof TIPOS_SESSAO)[number];

export const TIPO_SESSAO_LABEL: Record<TipoSessao, string> = {
  onboarding: "Onboarding",
  bussola: "Bússola",
  acompanhamento: "Acompanhamento",
};

export const STATUS_SESSAO = ["agendada", "realizada", "cancelada", "no_show"] as const;
export type StatusSessao = (typeof STATUS_SESSAO)[number];

export const STATUS_TAREFA = ["pendente", "em_andamento", "concluida", "abandonada"] as const;
export type StatusTarefa = (typeof STATUS_TAREFA)[number];

export const PAPEIS = ["admin", "mentor", "cs", "equipe"] as const;
export type Papel = (typeof PAPEIS)[number];

/** A 1ª Bússola deve acontecer em até 15 dias da entrada do mentorado. */
export const PRAZO_BUSSOLA_DIAS = 15;

/** Faixas de cor do HealthScore. */
export const HEALTHSCORE_VERDE_MIN = 70;
export const HEALTHSCORE_AMARELO_MIN = 40;

export type CorHealthScore = "verde" | "amarelo" | "vermelho";

export function corDoScore(score: number): CorHealthScore {
  if (score >= HEALTHSCORE_VERDE_MIN) return "verde";
  if (score >= HEALTHSCORE_AMARELO_MIN) return "amarelo";
  return "vermelho";
}
