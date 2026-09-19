import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LeadsRoute({ children }: { children: ReactNode }) {
  const { roles, loading } = useAuth();

  if (loading) return null;

  const permitido = roles.some((role) => role === "admin" || role === "gestor" || role === "marketing");
  if (!permitido) return <Navigate to="/crm/contas" replace />;

  return <>{children}</>;
}