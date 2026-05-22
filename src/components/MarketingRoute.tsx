import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps routes that marketing users should NOT see.
 * Marketing-only users are redirected to /crm/imoveis (their only allowed area).
 */
export default function MarketingRoute({ children }: { children: ReactNode }) {
  const { isMarketingOnly, loading } = useAuth();
  if (loading) return null;
  if (isMarketingOnly) return <Navigate to="/crm/imoveis" replace />;
  return <>{children}</>;
}
