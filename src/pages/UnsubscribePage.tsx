import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "ready" | "already" | "invalid" | "submitting" | "done" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await r.json();
        if (!r.ok) { setState("invalid"); setErrorMsg(data?.error || ""); return; }
        if (data?.valid === false && data?.reason === "already_unsubscribed") setState("already");
        else if (data?.valid === true) setState("ready");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (!r.ok) { setState("error"); setErrorMsg(data?.error || ""); return; }
      if (data?.success || data?.reason === "already_unsubscribed") setState("done");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">HR Imóveis — E-mails</h1>
        {state === "loading" && <p className="text-muted-foreground">Validando…</p>}
        {state === "invalid" && <p className="text-destructive">Link inválido ou expirado.{errorMsg ? ` (${errorMsg})` : ""}</p>}
        {state === "already" && <p className="text-muted-foreground">Você já tinha cancelado os e-mails. Tudo certo!</p>}
        {state === "ready" && (
          <>
            <p className="text-muted-foreground">Confirme que deseja deixar de receber e-mails da HR Imóveis.</p>
            <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
          </>
        )}
        {state === "submitting" && <p className="text-muted-foreground">Cancelando…</p>}
        {state === "done" && <p className="text-success">Pronto! Você não receberá mais e-mails.</p>}
        {state === "error" && <p className="text-destructive">Não foi possível processar agora. Tente de novo em alguns minutos.</p>}
      </Card>
    </div>
  );
}
