import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logoMark from "@/assets/brand/logo-mark.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha redefinida com sucesso!");
    navigate("/app");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-muted p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 text-foreground">
          <img src={logoMark} alt="HR Imóveis" className="h-12 w-12 object-contain" />
          <span className="font-display text-2xl font-semibold tracking-wide">HR IMÓVEIS</span>
        </Link>
        <Card className="p-6 shadow-card">
          <h1 className="font-display text-xl font-semibold text-center mb-1">Definir nova senha</h1>
          {!ready ? (
            <p className="text-sm text-center text-muted-foreground py-6">Validando link de recuperação…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nova senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div>
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
