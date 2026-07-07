// Cliente HTTP do app do assinante (GeriUpdates) — sessão própria em /api/gu.
import type { TipoConteudoGu } from "@shared/constantes";

export interface ConteudoFeed {
  id: string;
  titulo: string;
  resumo: string | null;
  tipo: TipoConteudoGu;
  tema: string | null;
  publicadoEm: string;
  lido: boolean;
  salvo: boolean;
}

export interface ConteudoDetalhe extends ConteudoFeed {
  corpo: string;
  linkReferencia: string | null;
  linkVideo: string | null;
  linkAudio: string | null;
}

export interface AssinanteMe {
  assinante: { id: string; nome: string; email: string } | null;
}

export class GuApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function requisicao<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/gu${caminho}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...init,
  });
  if (resp.status === 401 && !caminho.startsWith("/auth")) {
    window.location.href = "/updates/login";
    throw new GuApiError(401, "Não autenticado");
  }
  const corpo = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  if (!resp.ok) {
    throw new GuApiError(resp.status, (corpo.erro as string) ?? `Erro ${resp.status}`);
  }
  return corpo as T;
}

export const guApi = {
  get: <T>(caminho: string) => requisicao<T>(caminho),
  post: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "POST", body: JSON.stringify(dados) }),
  patch: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "PATCH", body: JSON.stringify(dados) }),
  put: <T>(caminho: string, dados: unknown) =>
    requisicao<T>(caminho, { method: "PUT", body: JSON.stringify(dados) }),
};
