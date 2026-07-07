import { describe, expect, it } from "vitest";
import { statusConteudo, visivelParaAssinante } from "../src/worker/services/geriupdates";

const agora = new Date("2026-07-07T12:00:00Z");

describe("statusConteudo (derivado de publicadoEm)", () => {
  it("sem publicadoEm é rascunho", () => {
    expect(statusConteudo(null, agora)).toBe("rascunho");
  });

  it("publicadoEm no futuro é agendado", () => {
    expect(statusConteudo("2026-07-08T08:00:00Z", agora)).toBe("agendado");
  });

  it("publicadoEm no passado é publicado", () => {
    expect(statusConteudo("2026-07-07T08:00:00Z", agora)).toBe("publicado");
  });

  it("publicadoEm exatamente agora é publicado", () => {
    expect(statusConteudo("2026-07-07T12:00:00Z", agora)).toBe("publicado");
  });
});

describe("visivelParaAssinante", () => {
  it("assinante só vê conteúdo publicado", () => {
    expect(visivelParaAssinante(null, agora)).toBe(false);
    expect(visivelParaAssinante("2026-07-08T08:00:00Z", agora)).toBe(false);
    expect(visivelParaAssinante("2026-07-01T08:00:00Z", agora)).toBe(true);
  });
});
