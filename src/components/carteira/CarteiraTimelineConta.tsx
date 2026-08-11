import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { fmtDateTime } from "@/lib/datetime";

interface EventoCarteira {
  id: string; tipo: string; motivo: string | null; observacao: string | null;
  status_anterior: string | null; status_novo: string | null; lote_nome: string | null;
  responsavel_anterior: string | null; responsavel_novo: string | null;
  autor: string | null; created_at: string;
}

const TIPO_LABEL: Record<string, string> = {
  atribuicao: "Conta atribuída",
  tentativa: "Tentativa de contato",
  contato_estabelecido: "Contato estabelecido",
  agendamento: "Próxima ação agendada",
  solicitacao_devolucao: "Devolução solicitada",
  solicitacao_transferencia: "Transferência solicitada",
  solicitacao_recusada: "Solicitação recusada",
  devolucao: "Conta devolvida à carteira HR",
  transferencia: "Conta transferida",
};

export default function CarteiraTimelineConta({ contaId }: { contaId: string }) {
  const [eventos, setEventos] = useState<EventoCarteira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    supabase.rpc("carteira_eventos_conta" as any, { _conta_id: contaId }).then(({ data }) => {
      if (!vivo) return;
      setEventos(((data ?? []) as unknown) as EventoCarteira[]);
      setLoading(false);
    });
    return () => { vivo = false; };
  }, [contaId]);

  if (loading) return <Card className="p-4 text-sm text-muted-foreground">Carregando histórico da carteira…</Card>;
  if (!eventos.length) return null;

  return (
    <Card className="p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Histórico da carteira
      </h3>
      <div className="space-y-3">
        {eventos.map((e) => (
          <div key={e.id} className="border-l-2 border-muted pl-3 relative">
            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{TIPO_LABEL[e.tipo] ?? e.tipo}</span>
              {e.lote_nome && <Badge variant="outline" className="text-[10px]">{e.lote_nome}</Badge>}
              {e.status_novo && <Badge variant="secondary" className="text-[10px]">{e.status_novo}</Badge>}
            </div>
            {(e.observacao || e.motivo) && (
              <p className="text-sm text-muted-foreground mt-0.5">{e.observacao || e.motivo}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDateTime(e.created_at)} · por {e.autor ?? "Sistema"}
              {e.responsavel_anterior && e.responsavel_novo && e.responsavel_anterior !== e.responsavel_novo &&
                ` · ${e.responsavel_anterior} → ${e.responsavel_novo}`}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
