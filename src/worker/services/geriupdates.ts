import type { StatusConteudoGu } from "../../shared/constantes";

/**
 * Status do conteúdo derivado de publicadoEm (nunca gravado):
 * NULL = rascunho, datetime futuro = agendado, datetime passado = publicado.
 */
export function statusConteudo(publicadoEm: string | null, agora: Date): StatusConteudoGu {
  if (!publicadoEm) return "rascunho";
  return new Date(publicadoEm).getTime() > agora.getTime() ? "agendado" : "publicado";
}

/** Assinante só vê conteúdo publicado (nunca rascunho ou agendado). */
export function visivelParaAssinante(publicadoEm: string | null, agora: Date): boolean {
  return statusConteudo(publicadoEm, agora) === "publicado";
}
