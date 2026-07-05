import { calcularHealthScore, estaSumido, type EntradasHealthScore, type ResultadoHealthScore } from "./healthscore";

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const JANELA_ENCONTROS_DIAS = 60;

export interface MentoradoBase {
  id: string;
  subgrupo: "semente" | "broto" | "arvore" | "frutos";
  dataEntrada: string | null;
}

export interface DadosPainel {
  mentorados: MentoradoBase[];
  encontros: { id: string; subgrupo: string | null; dataHora: string }[];
  presencas: { encontroId: string; mentoradoId: string; presente: boolean }[];
  sessoesRealizadas: { mentoradoId: string; dataHora: string }[];
  tarefas: { mentoradoId: string; dataLimite: string | null; status: string; concluidaEm: string | null }[];
  /** IDs de mentorados com indicadores lançados no mês corrente. */
  indicadoresDoMes: Set<string>;
  /** Contatos manuais registrados pelo CS (anotações tipo 'contato'). */
  contatos?: { mentoradoId: string; data: string }[];
}

export interface LinhaPainel {
  mentoradoId: string;
  resultado: ResultadoHealthScore;
  entradas: EntradasHealthScore;
  diasSemContato: number | null;
  sumido: boolean;
  /** Sem nenhum evento registrado (grupo ⚪ do painel). */
  semDados: boolean;
}

function dias(de: string, ate: Date): number {
  return Math.floor((ate.getTime() - new Date(de).getTime()) / MS_POR_DIA);
}

/** Monta o painel inteiro a partir de dados crus — função pura, testável. */
export function montarPainel(dados: DadosPainel, hoje: Date): LinhaPainel[] {
  const hojeIso = hoje.toISOString().slice(0, 10);
  const inicioJanela = new Date(hoje.getTime() - JANELA_ENCONTROS_DIAS * MS_POR_DIA).toISOString();

  const encontrosRecentes = dados.encontros.filter((e) => e.dataHora >= inicioJanela && e.dataHora <= hoje.toISOString());
  const presencasPorMentorado = new Map<string, { encontroId: string; presente: boolean }[]>();
  for (const p of dados.presencas) {
    if (!presencasPorMentorado.has(p.mentoradoId)) presencasPorMentorado.set(p.mentoradoId, []);
    presencasPorMentorado.get(p.mentoradoId)!.push(p);
  }

  return dados.mentorados.map((m) => {
    const encontrosDoSubgrupo = encontrosRecentes.filter((e) => e.subgrupo === null || e.subgrupo === m.subgrupo);
    const idsEncontros = new Set(encontrosDoSubgrupo.map((e) => e.id));
    const presencasDele = (presencasPorMentorado.get(m.id) ?? []).filter((p) => p.presente);
    const presencasNaJanela = presencasDele.filter((p) => idsEncontros.has(p.encontroId)).length;

    const sessoesDele = dados.sessoesRealizadas.filter((s) => s.mentoradoId === m.id);
    const ultimaSessao = sessoesDele.map((s) => s.dataHora).sort().pop() ?? null;

    const tarefasDele = dados.tarefas.filter((t) => t.mentoradoId === m.id);
    const vencidas = tarefasDele.filter((t) => t.dataLimite && t.dataLimite < hojeIso);
    const vencidasConcluidas = vencidas.filter((t) => t.status === "concluida").length;
    const ultimaConclusao = tarefasDele.map((t) => t.concluidaEm).filter(Boolean).sort().pop() ?? null;

    // Último contato: presença em encontro, sessão realizada ou tarefa concluída.
    // Datas dos encontros com presença dele (qualquer época, não só a janela):
    const datasEncontrosComPresenca = dados.encontros
      .filter((e) => presencasDele.some((p) => p.encontroId === e.id))
      .map((e) => e.dataHora);
    const contatosManuais = (dados.contatos ?? []).filter((c) => c.mentoradoId === m.id).map((c) => c.data);
    const contatos = [
      ...datasEncontrosComPresenca,
      ...(ultimaSessao ? [ultimaSessao] : []),
      ...(ultimaConclusao ? [ultimaConclusao as string] : []),
      ...contatosManuais,
    ];
    const semDados = contatos.length === 0 && tarefasDele.length === 0;
    // Entrada recente conta como contato para não marcar recém-chegado como sumido.
    if (m.dataEntrada) contatos.push(m.dataEntrada);
    const ultimoContato = contatos.sort().pop() ?? null;
    const diasSemContato = ultimoContato ? Math.max(0, dias(ultimoContato, hoje)) : null;

    const entradas: EntradasHealthScore = {
      encontrosNoPeriodo: encontrosDoSubgrupo.length,
      presencasNoPeriodo: presencasNaJanela,
      diasDesdeUltimaSessao: ultimaSessao ? dias(ultimaSessao, hoje) : null,
      tarefasVencidas: vencidas.length,
      tarefasVencidasConcluidas: vencidasConcluidas,
      indicadoresDoMesEnviados: dados.indicadoresDoMes.has(m.id),
      diasSemContato,
    };

    return {
      mentoradoId: m.id,
      entradas,
      resultado: calcularHealthScore(entradas),
      diasSemContato,
      sumido: estaSumido(diasSemContato),
      semDados,
    };
  });
}
