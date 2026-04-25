import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "gestor" | "corretor";

/**
 * Compat wrapper para componentes da Brazil Lands que esperam useRole().
 * Encaminha pra AuthContext já presente no HR Imóveis.
 */
export function useRole() {
  const { roles, isAdmin, isGestor, loading } = useAuth();
  return { roles, isAdmin, isGestor, loading };
}
