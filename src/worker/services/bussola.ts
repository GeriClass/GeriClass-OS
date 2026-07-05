import { PRAZO_BUSSOLA_DIAS } from "../../shared/constantes";

export interface SituacaoBussola {
  /** Data-limite (ISO date) para a 1ª Bússola: data_entrada + 15 dias. */
  dataLimite: string | null;
  /** Dias restantes (negativo = vencido). Null se não houver data de entrada. */
  diasRestantes: number | null;
  situacao: "realizada" | "agendada" | "no_prazo" | "vencendo" | "vencida" | "sem_data_entrada";
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Dias corridos entre hoje e a data-limite da Bússola (UTC, datas ISO). */
export function calcularSituacaoBussola(
  dataEntrada: string | null,
  bussola: { status: string } | null,
  hoje: Date,
): SituacaoBussola {
  if (bussola?.status === "realizada") {
    return { dataLimite: null, diasRestantes: null, situacao: "realizada" };
  }
  if (!dataEntrada) {
    return { dataLimite: null, diasRestantes: null, situacao: "sem_data_entrada" };
  }
  const entrada = new Date(dataEntrada + (dataEntrada.length === 10 ? "T00:00:00Z" : ""));
  const limite = new Date(entrada.getTime() + PRAZO_BUSSOLA_DIAS * MS_POR_DIA);
  const hojeUtc = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  const limiteUtc = Date.UTC(limite.getUTCFullYear(), limite.getUTCMonth(), limite.getUTCDate());
  const diasRestantes = Math.round((limiteUtc - hojeUtc) / MS_POR_DIA);

  let situacao: SituacaoBussola["situacao"];
  if (bussola?.status === "agendada") situacao = "agendada";
  else if (diasRestantes < 0) situacao = "vencida";
  else if (diasRestantes <= 5) situacao = "vencendo";
  else situacao = "no_prazo";

  return { dataLimite: limite.toISOString().slice(0, 10), diasRestantes, situacao };
}
