export function hasActiveProfile(profile: { ativo?: boolean } | null | undefined) {
  return profile?.ativo === true;
}

export function isInactiveUserError(error: { code?: string; details?: string } | null | undefined) {
  return error?.code === "PT403" && error.details === "USER_INACTIVE";
}