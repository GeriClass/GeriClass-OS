import { describe, expect, it } from "vitest";
import { calcularHealthScore, estaSumido, DIAS_PARA_SUMIDO } from "../src/worker/services/healthscore";

describe("calcularHealthScore", () => {
  it("mentorado engajado fica verde", () => {
    const r = calcularHealthScore({
      encontrosNoPeriodo: 4,
      presencasNoPeriodo: 4,
      diasDesdeUltimaSessao: 10,
      tarefasVencidas: 2,
      tarefasVencidasConcluidas: 2,
      indicadoresDoMesEnviados: true,
      diasSemContato: 3,
    });
    expect(r.score).toBe(100);
    expect(r.cor).toBe("verde");
  });

  it("mentorado sem nenhum contato fica vermelho", () => {
    const r = calcularHealthScore({
      encontrosNoPeriodo: 4,
      presencasNoPeriodo: 0,
      diasDesdeUltimaSessao: null,
      tarefasVencidas: 3,
      tarefasVencidasConcluidas: 0,
      indicadoresDoMesEnviados: false,
      diasSemContato: null,
    });
    expect(r.score).toBe(0);
    expect(r.cor).toBe("vermelho");
  });

  it("meio-termo fica amarelo", () => {
    const r = calcularHealthScore({
      encontrosNoPeriodo: 4,
      presencasNoPeriodo: 2, // 15
      diasDesdeUltimaSessao: 45, // 20
      tarefasVencidas: 4,
      tarefasVencidasConcluidas: 2, // 13
      indicadoresDoMesEnviados: true, // 15
      diasSemContato: 35, // -15
    }); // 15+20+13+15-15 = 48
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.score).toBeLessThan(70);
    expect(r.cor).toBe("amarelo");
  });

  it("sem encontros no período dá pontuação neutra de presença", () => {
    const r = calcularHealthScore({
      encontrosNoPeriodo: 0,
      presencasNoPeriodo: 0,
      diasDesdeUltimaSessao: 10,
      tarefasVencidas: 0,
      tarefasVencidasConcluidas: 0,
      indicadoresDoMesEnviados: true,
      diasSemContato: 5,
    });
    expect(r.componentes.presenca).toBe(15);
    expect(r.componentes.tarefas).toBe(15);
  });

  it("score nunca sai de 0–100", () => {
    const r = calcularHealthScore({
      encontrosNoPeriodo: 1,
      presencasNoPeriodo: 0,
      diasDesdeUltimaSessao: null,
      tarefasVencidas: 1,
      tarefasVencidasConcluidas: 0,
      indicadoresDoMesEnviados: false,
      diasSemContato: 90,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("estaSumido", () => {
  it("sem contato registrado = sumido", () => {
    expect(estaSumido(null)).toBe(true);
  });
  it("contato recente não é sumido", () => {
    expect(estaSumido(DIAS_PARA_SUMIDO)).toBe(false);
  });
  it("acima do limiar é sumido", () => {
    expect(estaSumido(DIAS_PARA_SUMIDO + 1)).toBe(true);
  });
});
