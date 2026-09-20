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

  it("fecha 100% também quando o total representa conta-dias exigíveis", () => {
    const status = calcularStatusCrm(25, 17);
    expect(status.atualizado).toBe(8);
    expect(status.percentualAtualizado).toBe(32);
    expect(status.percentualDesatualizado).toBe(68);
  });
});

const dia = (data: string, exigiveis: number, desatualizado: number) => ({
  dia: data,
  responsavel_id: "u1",
  corretor_nome: "Hans",
  conta_dias_exigiveis: exigiveis,
  crm_atualizado: exigiveis - desatualizado,
  crm_desatualizado: desatualizado,
  falta_followup: 0,
  sem_retorno: 0,
  sem_interesse: 0,
  desqualificado: 0,
  encerrado: 0,
  virando_oportunidade: 0,
  oportunidade_futura: 0,
  etapa_antiga: 0,
  ciclo_andamento: 0,
});

describe("leitura geral do período", () => {
  const serie = [
    dia("2026-09-02", 4, 1),
    dia("2026-09-04", 4, 3),
    dia("2026-09-07", 5, 2),
  ];

  const somar = (campo: "conta_dias_exigiveis" | "crm_desatualizado" | "falta_followup") =>
    serie.reduce((total, item) => total + item[campo], 0);

  it("fecha 100% nos percentuais gerais de CRM e follow-up", () => {
    const total = somar("conta_dias_exigiveis");
    const crm = calcularStatusCrm(total, somar("crm_desatualizado"));
    expect(crm.atualizado + crm.desatualizado).toBe(total);
    expect(crm.percentualAtualizado + crm.percentualDesatualizado).toBeCloseTo(100, 5);

    const followup = calcularStatusCrm(total, somar("falta_followup"));
    expect(followup.atualizado + followup.desatualizado).toBe(total);
    expect(followup.percentualAtualizado + followup.percentualDesatualizado).toBeCloseTo(100, 5);
  });

  it("usa o total do período como base das barras", () => {
    expect(somar("conta_dias_exigiveis")).toBe(13);
    expect(calcularStatusCrm(13, somar("crm_desatualizado")).desatualizado).toBe(6);
  });
});

