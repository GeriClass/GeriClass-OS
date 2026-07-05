import { describe, expect, it } from "vitest";
import { montarPainel, type DadosPainel } from "../src/worker/services/painel";

const HOJE = new Date("2026-07-05T12:00:00Z");

function base(): DadosPainel {
  return {
    mentorados: [{ id: "m1", subgrupo: "semente", dataEntrada: "2026-05-01" }],
    encontros: [],
    presencas: [],
    sessoesRealizadas: [],
    tarefas: [],
    indicadoresDoMes: new Set(),
  };
}

describe("montarPainel", () => {
  it("mentorado engajado sai verde e não sumido", () => {
    const dados = base();
    dados.encontros = [
      { id: "e1", subgrupo: "semente", dataHora: "2026-06-20T20:00:00Z" },
      { id: "e2", subgrupo: null, dataHora: "2026-06-28T20:00:00Z" },
    ];
    dados.presencas = [
      { encontroId: "e1", mentoradoId: "m1", presente: true },
      { encontroId: "e2", mentoradoId: "m1", presente: true },
    ];
    dados.sessoesRealizadas = [{ mentoradoId: "m1", dataHora: "2026-06-25T14:00:00Z" }];
    dados.indicadoresDoMes = new Set(["m1"]);
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.resultado.cor).toBe("verde");
    expect(linha.sumido).toBe(false);
    expect(linha.semDados).toBe(false);
  });

  it("encontro de outro subgrupo não conta para o mentorado", () => {
    const dados = base();
    dados.encontros = [{ id: "e1", subgrupo: "frutos", dataHora: "2026-06-20T20:00:00Z" }];
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.entradas.encontrosNoPeriodo).toBe(0);
  });

  it("recém-chegado sem eventos não é sumido (entrada conta como contato)", () => {
    const dados = base();
    dados.mentorados = [{ id: "m1", subgrupo: "semente", dataEntrada: "2026-07-01" }];
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.sumido).toBe(false);
    expect(linha.semDados).toBe(true);
    expect(linha.diasSemContato).toBe(4);
  });

  it("mentorado antigo sem nenhum contato é sumido", () => {
    const dados = base(); // entrada 2026-05-01, 65 dias atrás
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.sumido).toBe(true);
  });

  it("contato manual (anotação) tira o mentorado dos sumidos", () => {
    const dados = base();
    dados.contatos = [{ mentoradoId: "m1", data: "2026-07-01T10:00:00Z" }];
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.sumido).toBe(false);
    expect(linha.diasSemContato).toBe(4);
  });

  it("tarefa vencida não concluída derruba o componente de tarefas", () => {
    const dados = base();
    dados.tarefas = [
      { mentoradoId: "m1", dataLimite: "2026-06-20", status: "pendente", concluidaEm: null },
      { mentoradoId: "m1", dataLimite: "2026-06-22", status: "concluida", concluidaEm: "2026-06-21T10:00:00Z" },
    ];
    const [linha] = montarPainel(dados, HOJE);
    expect(linha.entradas.tarefasVencidas).toBe(2);
    expect(linha.entradas.tarefasVencidasConcluidas).toBe(1);
    expect(linha.diasSemContato).toBe(14); // última conclusão 21/06
  });
});
