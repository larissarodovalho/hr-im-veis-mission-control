import { describe, expect, it } from "vitest";
import { chaveEvento, destinoNotificacao, PREFS_PADRAO, type Notificacao } from "@/lib/notificacoes";

const base: Notificacao = {
  id: "n1", user_id: "u1", tipo: "link_primeiro_acesso", titulo: "t", descricao: null,
  link_id: "l1", imovel_id: null, conta_id: null, oportunidade_id: null,
  lida_em: null, created_at: new Date().toISOString(),
};

describe("notificações dos links", () => {
  it("usa a mesma chave para qualquer abertura do mesmo link (sem spam por reload)", () => {
    expect(chaveEvento("abertura", "l1", "e1")).toBe(chaveEvento("abertura", "l1", "e2"));
  });

  it("gera chave distinta por evento de feedback", () => {
    expect(chaveEvento("gostei", "l1", "e1")).not.toBe(chaveEvento("gostei", "l1", "e2"));
  });

  it("prioriza oportunidade, depois conta, depois o link", () => {
    expect(destinoNotificacao({ ...base, oportunidade_id: "o1", conta_id: "c1" })).toContain("oportunidade=o1");
    expect(destinoNotificacao({ ...base, conta_id: "c1" })).toBe("/crm/contas/c1");
    expect(destinoNotificacao(base)).toBe("/crm/imoveis?tab=links&link=l1");
  });

  it("usuário sem preferências salvas recebe todos os avisos", () => {
    expect(Object.values(PREFS_PADRAO).every(Boolean)).toBe(true);
  });
});
