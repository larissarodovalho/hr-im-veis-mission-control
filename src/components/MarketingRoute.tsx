import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuAccess, MenuKey } from "@/hooks/useMenuAccess";

/**
 * Wraps routes that marketing or secretaria users should NOT see by default.
 * If a `menuKey` is provided and the user has an explicit override allowing it,
 * the route is rendered even for marketing-only / secretaria-only users.
 */
export default function MarketingRoute({
  children,
  menuKey,
}: {
  children: ReactNode;
  menuKey?: MenuKey;
}) {
  const { isMarketingOnly, isSecretariaOnly, loading } = useAuth();
  const { canAccess, loading: menuLoading } = useMenuAccess();
  if (loading || menuLoading) return null;
  if (isSecretariaOnly) {
    if (menuKey && canAccess(menuKey)) return <>{children}</>;
    return <Navigate to="/crm/agenda" replace />;
  }
  if (isMarketingOnly) {
    if (menuKey && canAccess(menuKey)) return <>{children}</>;
    return <Navigate to="/crm/imoveis" replace />;
  }
  return <>{children}</>;
}
