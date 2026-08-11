import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";

/** Selo "Carteira HR · <lote>" quando a conta pertence a um lote de carteira ativo. */
export default function CarteiraLoteBadge({ contaId, className }: { contaId: string; className?: string }) {
  const [lote, setLote] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase.rpc("carteira_lote_da_conta" as any, { _conta_id: contaId }).then(({ data }) => {
      if (!vivo) return;
      const row = (data as any[])?.[0];
      setLote(row?.lote_nome ?? null);
    });
    return () => { vivo = false; };
  }, [contaId]);

  if (!lote) return null;
  return (
    <Badge variant="outline" className={`bg-blue-500/10 text-blue-700 border-blue-500/30 ${className ?? ""}`}>
      <Briefcase className="h-3 w-3 mr-1" /> Carteira HR · {lote}
    </Badge>
  );
}
