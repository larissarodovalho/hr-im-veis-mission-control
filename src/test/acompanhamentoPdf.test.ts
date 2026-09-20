import { describe, expect, it } from "vitest";
import { agruparSeriePorSemana, calcularStatusCrm, contarSemanasUteis, rotuloSemana } from "@/lib/acompanhamentoPdf";

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

describe("agrupamento semanal do acompanhamento", () => {
  const serie = [
    dia("2026-09-02", 4, 1), // quarta (semana parcial)
    dia("2026-09-04", 4, 3), // sexta
    dia("2026-09-07", 5, 2), // segunda da semana seguinte
  ];

  it("agrupa de segunda a sexta somando os dias", () => {
    const semanas = agruparSeriePorSemana(serie);
    expect(semanas).toHaveLength(2);
    expect(semanas[0].semana_inicio).toBe("2026-08-31");
    expect(semanas[0].conta_dias_exigiveis).toBe(8);
    expect(semanas[0].crm_desatualizado).toBe(4);
    expect(semanas[0].dias).toBe(2);
    expect(semanas[1].semana_inicio).toBe("2026-09-07");
    expect(semanas[1].conta_dias_exigiveis).toBe(5);
  });

  it("fecha atualizado e desatualizado em 100% na semana", () => {
    const [primeira] = agruparSeriePorSemana(serie);
    expect(primeira.crm_atualizado + primeira.crm_desatualizado).toBe(primeira.conta_dias_exigiveis);
  });

  it("conta semanas úteis distintas e gera rótulo legível", () => {
    expect(contarSemanasUteis(serie)).toBe(2);
    expect(rotuloSemana(agruparSeriePorSemana(serie)[0])).toBe("31/08 a 04/09");
  });
});
