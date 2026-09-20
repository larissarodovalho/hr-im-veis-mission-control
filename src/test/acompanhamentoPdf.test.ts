import { describe, expect, it } from "vitest";
import { calcularStatusCrm } from "@/lib/acompanhamentoPdf";

describe("status de atualização do CRM", () => {
  it("fecha a carteira em 100%", () => {
    const status = calcularStatusCrm(10, 3);
    expect(status.atualizado).toBe(7);
    expect(status.desatualizado).toBe(3);
    expect(status.percentualAtualizado + status.percentualDesatualizado).toBe(100);
  });

  it("trata carteira vazia sem divisão inválida", () => {
    expect(calcularStatusCrm(0, 0)).toEqual({
      atualizado: 0,
      desatualizado: 0,
      percentualAtualizado: 0,
      percentualDesatualizado: 0,
    });
  });

  it("limita valores inconsistentes ao total da carteira", () => {
    expect(calcularStatusCrm(2, 5)).toMatchObject({ atualizado: 0, desatualizado: 2 });
  });
});
