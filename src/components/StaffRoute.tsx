import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps a route that should only be visible to admin/gestor (and optionally marketing).
 * Other roles get redirected to /crm/contas (corretor workspace).
 */
export default function StaffRoute({
  children,
  allowMarketing = false,
}: {
  children: ReactNode;
  allowMarketing?: boolean;
}) {
  const { isAdmin, isGestor, isMarketing, isSecretariaOnly, loading } = useAuth();
  if (loading) return null;
  if (isSecretariaOnly) return <Navigate to="/crm/agenda" replace />;
  if (!isAdmin && !isGestor && !(allowMarketing && isMarketing))
    return <Navigate to="/crm/contas" replace />;
  return <>{children}</>;
}
