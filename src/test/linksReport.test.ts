import { describe, expect, it } from "vitest";
import { pct, taxa, tempoMedioLabel } from "@/lib/linksReport";

describe("cálculos do relatório de links", () => {
  it("taxa com base controlada", () => {
    expect(taxa(3, 10)).toBe(30);
    expect(taxa(1, 3)).toBe(33.3);
    expect(taxa(10, 10)).toBe(100);
  });

  it("não divide por zero", () => {
    expect(taxa(5, 0)).toBe(0);
    expect(taxa(0, 0)).toBe(0);
    expect(pct(undefined)).toBe("0.0%");
  });

  it("formata o tempo médio até o primeiro acesso", () => {
    expect(tempoMedioLabel(0)).toBe("—");
    expect(tempoMedioLabel(45)).toBe("45min");
    expect(tempoMedioLabel(90)).toBe("1h 30min");
    expect(tempoMedioLabel(1500)).toBe("1d 1h");
  });
});
