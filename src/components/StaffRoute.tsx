import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps a route that should only be visible to admin/gestor.
 * Corretores get redirected to /crm (their workspace).
 */
export default function StaffRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isGestor, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin && !isGestor) return <Navigate to="/crm?tab=leads" replace />;
  return <>{children}</>;
}
