import { describe, expect, it, vi } from "vitest";
import { authBanDuration, changeUserStatus, validateUserStatusChange } from "../../supabase/functions/_shared/user-status";
import { hasActiveProfile, isInactiveUserError } from "@/lib/userStatus";

const adminId = "11111111-1111-4111-8111-111111111111";
const corretorId = "22222222-2222-4222-8222-222222222222";

describe("desativação reversível de usuários", () => {
  it("impede desativar o próprio administrador", () => {
    expect(validateUserStatusChange(adminId, adminId, "deactivate")).toBe("Você não pode desativar a si mesmo");
    expect(validateUserStatusChange(adminId, corretorId, "deactivate")).toBeNull();
  });

  it("rejeita identificadores e ações inválidos", () => {
    expect(validateUserStatusChange(adminId, "", "deactivate")).toBe("Usuário inválido");
    expect(validateUserStatusChange(adminId, corretorId, "delete")).toBe("Ação inválida");
  });

  it("bloqueia uma sessão anterior com perfil desativado", () => {
    expect(hasActiveProfile({ ativo: false })).toBe(false);
    expect(hasActiveProfile({ ativo: true })).toBe(true);
    expect(hasActiveProfile(null)).toBe(false);
  });

  it("distingue a desativação de uma falha temporária de consulta", () => {
    expect(isInactiveUserError({ code: "PT403", details: "USER_INACTIVE" })).toBe(true);
    expect(isInactiveUserError({ code: "503", details: "unavailable" })).toBe(false);
  });

  it("desativa sem apagar cadastro, permissões, clientes ou histórico", async () => {
    const data = {
      profile: { user_id: corretorId, ativo: true, nome: "Corretor" },
      roles: ["corretor"], contas: [{ id: "cliente", responsavel_id: corretorId }],
      vendas: [{ id: "venda", corretor_id: corretorId, valor: 1800000 }],
      tarefas: [{ id: "tarefa", created_by: corretorId }],
    };
    const before = structuredClone(data);
    const sequence: string[] = [];
    await changeUserStatus({
      setActive: async (id, active) => {
        expect(id).toBe(corretorId);
        data.profile.ativo = active;
        sequence.push("profile");
      },
      setAuthBan: async (id, duration) => {
        expect(id).toBe(corretorId);
        expect(duration).toBe("876000h");
        sequence.push("auth");
      },
    }, corretorId, true, false);
    expect(data).toEqual({ ...before, profile: { ...before.profile, ativo: false } });
    expect(sequence).toEqual(["profile", "auth"]);
  });

  it("reativa somente depois de remover o bloqueio do login", async () => {
    const sequence: string[] = [];
    await changeUserStatus({
      setAuthBan: async (_id, duration) => { expect(duration).toBe("none"); sequence.push("auth"); },
      setActive: async (_id, active) => { expect(active).toBe(true); sequence.push("profile"); },
    }, corretorId, false, true);
    expect(sequence).toEqual(["auth", "profile"]);
    expect(authBanDuration(true)).toBe("none");
  });

  it("restaura o status anterior se o bloqueio do login falhar", async () => {
    const setActive = vi.fn().mockResolvedValue(undefined);
    await expect(changeUserStatus({ setActive, setAuthBan: async () => { throw new Error("Falha Auth"); } }, corretorId, true, false)).rejects.toThrow("Falha Auth");
    expect(setActive.mock.calls).toEqual([[corretorId, false], [corretorId, true]]);
  });

  it("mantém o bloqueio se a remoção do bloqueio do login falhar", async () => {
    const setActive = vi.fn();
    await expect(changeUserStatus({ setActive, setAuthBan: async () => { throw new Error("Falha Auth"); } }, corretorId, false, true)).rejects.toThrow("Falha Auth");
    expect(setActive).not.toHaveBeenCalled();
  });

  it("restaura o bloqueio do login se a reativação do cadastro falhar", async () => {
    const setAuthBan = vi.fn().mockResolvedValue(undefined);
    await expect(changeUserStatus({ setAuthBan, setActive: async () => { throw new Error("Falha perfil"); } }, corretorId, false, true)).rejects.toThrow("Falha perfil");
    expect(setAuthBan.mock.calls).toEqual([[corretorId, "none"], [corretorId, "876000h"]]);
  });
});