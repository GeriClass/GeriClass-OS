import { describe, expect, it } from "vitest";
import { calcularSituacaoBussola } from "../src/worker/services/bussola";

const HOJE = new Date("2026-07-05T12:00:00Z");

describe("calcularSituacaoBussola", () => {
  it("marca como realizada quando a bússola foi realizada", () => {
    const r = calcularSituacaoBussola("2026-06-01", { status: "realizada" }, HOJE);
    expect(r.situacao).toBe("realizada");
  });

  it("marca sem_data_entrada quando não há data de entrada", () => {
    const r = calcularSituacaoBussola(null, null, HOJE);
    expect(r.situacao).toBe("sem_data_entrada");
    expect(r.diasRestantes).toBeNull();
  });

  it("calcula o limite como entrada + 15 dias", () => {
    const r = calcularSituacaoBussola("2026-07-01", null, HOJE);
    expect(r.dataLimite).toBe("2026-07-16");
    expect(r.diasRestantes).toBe(11);
    expect(r.situacao).toBe("no_prazo");
  });

  it("marca vencendo quando faltam 5 dias ou menos", () => {
    const r = calcularSituacaoBussola("2026-06-25", null, HOJE); // limite 10/07 → 5 dias
    expect(r.diasRestantes).toBe(5);
    expect(r.situacao).toBe("vencendo");
  });

  it("marca vencida quando o limite passou", () => {
    const r = calcularSituacaoBussola("2026-06-01", null, HOJE); // limite 16/06
    expect(r.diasRestantes).toBeLessThan(0);
    expect(r.situacao).toBe("vencida");
  });

  it("bússola agendada mantém situação agendada mesmo dentro do prazo", () => {
    const r = calcularSituacaoBussola("2026-07-01", { status: "agendada" }, HOJE);
    expect(r.situacao).toBe("agendada");
    expect(r.dataLimite).toBe("2026-07-16");
  });

  it("no dia do limite ainda está no prazo (vencendo)", () => {
    const r = calcularSituacaoBussola("2026-06-20", null, HOJE); // limite 05/07 = hoje
    expect(r.diasRestantes).toBe(0);
    expect(r.situacao).toBe("vencendo");
  });
});
