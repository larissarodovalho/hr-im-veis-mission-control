export type UserStatusAction = "deactivate" | "reactivate";

export function validateUserStatusChange(callerId: string, targetId: unknown, action: unknown) {
  if (action !== "deactivate" && action !== "reactivate") {
    return "Ação inválida";
  }
  if (typeof targetId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
    return "Usuário inválido";
  }
  if (action === "deactivate" && callerId === targetId) {
    return "Você não pode desativar a si mesmo";
  }
  return null;
}

// Auth bans are reversible; no profile, role or business record is deleted.
export function authBanDuration(active: boolean) {
  return active ? "none" : "876000h";
}

export interface UserStatusStore {
  setActive: (userId: string, active: boolean) => Promise<void>;
  setAuthBan: (userId: string, duration: string) => Promise<void>;
}

/** Fail closed: access is restored only after Auth accepts unbanning the account. */
export async function changeUserStatus(
  store: UserStatusStore,
  userId: string,
  wasActive: boolean,
  active: boolean,
) {
  if (!active) {
    await store.setActive(userId, false);
    try {
      await store.setAuthBan(userId, authBanDuration(false));
    } catch (error) {
      try {
        await store.setActive(userId, wasActive);
      } catch {
        throw new Error("Acesso ao CRM bloqueado, mas o bloqueio do login não foi confirmado. Tente desativar novamente.");
      }
      throw error;
    }
    return;
  }

  await store.setAuthBan(userId, authBanDuration(true));
  try {
    await store.setActive(userId, true);
  } catch (error) {
    try {
      await store.setAuthBan(userId, authBanDuration(!wasActive ? false : true));
    } catch {
      throw new Error("Não foi possível concluir a reativação. O acesso ao CRM continua bloqueado; tente novamente.");
    }
    throw error;
  }
}