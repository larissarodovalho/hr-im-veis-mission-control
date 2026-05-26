import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps routes that marketing or secretaria users should NOT see.
 * Marketing-only users are redirected to /crm/imoveis (their only allowed area).
 * Secretaria-only users are redirected to /crm/agenda.
 */
export default function MarketingRoute({ children }: { children: ReactNode }) {
  const { isMarketingOnly, isSecretariaOnly, loading } = useAuth();
  if (loading) return null;
  if (isSecretariaOnly) return <Navigate to="/crm/agenda" replace />;
  if (isMarketingOnly) return <Navigate to="/crm/imoveis" replace />;
  return <>{children}</>;
}
