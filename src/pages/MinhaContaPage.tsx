import GoogleCalendarConnect from "@/components/configuracoes/GoogleCalendarConnect";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MinhaContaPage() {
  const { profile, user } = useAuth();
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <UserCircle className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Minha conta</h1>
          <p className="text-sm text-muted-foreground">Preferências pessoais e integrações individuais</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Nome:</strong> {profile?.nome || "—"}</p>
          <p><strong>E-mail:</strong> {user?.email}</p>
        </CardContent>
      </Card>

      <GoogleCalendarConnect />
    </div>
  );
}
