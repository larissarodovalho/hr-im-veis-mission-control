import { describe, it, expect } from "vitest";
import { statusGeralComissao, dividirValor, gerarVencimentos, isAtrasada } from "@/lib/vendaParcelas";
const p = (status: string) => ({ status, valor: 1, vencimento: "2026-01-01" });
describe("vendaParcelas", () => {
  it("todas pagas = Finalizada", () => expect(statusGeralComissao([p("paga"), p("paga")])).toBe("Finalizada"));
  it("algumas pagas = parcial", () => expect(statusGeralComissao([p("paga"), p("pendente")])).toBe("Pagamento parcial"));
  it("nenhuma paga = pendente", () => expect(statusGeralComissao([p("pendente")])).toBe("Pagamento pendente"));
  it("sem parcelas mantém status", () => expect(statusGeralComissao([])).toBeNull());
  it("divisão soma exatamente o total", () => {
    const v = dividirValor(100000, 3);
    expect(v).toEqual([33333.33, 33333.33, 33333.34]);
  });
  it("vencimentos anuais", () => expect(gerarVencimentos("2026-01-31", 3, 12)).toEqual(["2026-01-31", "2027-01-31", "2028-01-31"]));
  it("vencimentos mensais ajustam fim do mês", () => expect(gerarVencimentos("2026-01-31", 2, 1)).toEqual(["2026-01-31", "2026-02-28"]));
  it("atrasada só se vencida e não paga", () => {
    expect(isAtrasada({ status: "pendente", valor: 1, vencimento: "2026-01-01" }, "2026-02-01")).toBe(true);
    expect(isAtrasada({ status: "paga", valor: 1, vencimento: "2026-01-01" }, "2026-02-01")).toBe(false);
  });
});
