import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasActiveProfile } from "@/lib/userStatus";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, profile, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasActiveProfile(profile)) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Verificando acesso…</div>;
  }
  return children;
}
