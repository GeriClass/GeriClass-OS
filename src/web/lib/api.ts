import type { Subgrupo, StatusMentorado, TipoSessao, StatusSessao, StatusTarefa, Papel, CorHealthScore } from "@shared/constantes";

// ─── Tipos das entidades (espelham a API) ────────────────────────────────────

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  cargo: string | null;
  dataInicio: string | null;
  ativo: boolean;
}

export interface Mentor {
  id: string;
  usuarioId: string | null;
  nome: string;
  email: string | null;
  ativo: boolean;
}

export interface Mentorado {
  id: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  cidade: string | null;
  uf: string | null;
  subgrupo: Subgrupo;
  status: StatusMentorado;
  turma: string | null;
  mentorRecrutadorId: string | null;
  dataEntrada: string | null;
  curseducaId: string | null;
  notionUrl: string | null;
  createdAt: string;
}

export interface Sessao {
  id: string;
  mentoradoId: string;
  mentorId: string | null;
  tipo: TipoSessao;
  dataHora: string;
  status: StatusSessao;
  resumo: string | null;
  linkNotas: string | null;
  createdAt: string;
}

export interface TarefaPlano {
  id: string;
  sessaoId: string | null;
  mentoradoId: string;
  descricao: string;
  prazoTipo: number;
  dataLimite: string | null;
  status: StatusTarefa;
  concluidaEm: string | null;
  createdAt: string;
}

export interface SituacaoBussola {
  dataLimite: string | null;
  diasRestantes: number | null;
  situacao: "realizada" | "agendada" | "no_prazo" | "vencendo" | "vencida" | "sem_data_entrada";
}

export interface HealthScore {
  id: string;
  mentoradoId: string;
  anoMes: string;
  scoreFinal: number;
  cor: CorHealthScore;
}

// ─── Cliente HTTP ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api${caminho}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...init,
  });
  if (resp.status === 401 && !caminho.startsWith("/auth")) {
    window.location.href = "/login";
    throw new ApiError(401, "Não autenticado");
  }
  const corpo = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  if (!resp.ok) {
    throw new ApiError(resp.status, (corpo.erro as string) ?? `Erro ${resp.status}`);
  }
  return corpo as T;
}

export const api = {
  get: <T>(caminho: string) => requisicao<T>(caminho),
  post: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "POST", body: JSON.stringify(dados) }),
  patch: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "PATCH", body: JSON.stringify(dados) }),
  put: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "PUT", body: JSON.stringify(dados) }),
};
