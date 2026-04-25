import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logoMark from "@/assets/brand/logo-mark.png";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("E-mail de recuperação enviado!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-muted p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3 text-foreground">
          <img src={logoMark} alt="HR Imóveis" className="h-12 w-12 object-contain" />
          <span className="font-display text-2xl font-semibold tracking-wide">HR IMÓVEIS</span>
        </Link>
        <Card className="p-6 shadow-card">
          <h1 className="font-display text-xl font-semibold text-center mb-1">Recuperar senha</h1>
          <p className="text-xs text-muted-foreground text-center mb-4">
            Informe seu e-mail cadastrado para receber o link de redefinição
          </p>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-foreground">
                Enviamos um link de redefinição para <strong>{email}</strong>.
              </p>
              <Link to="/auth" className="text-sm text-primary hover:underline inline-block">
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando…" : "Enviar link de recuperação"}
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-sm text-muted-foreground hover:underline">
                  ← Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
