import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSignature } from "lucide-react";
import SendDocumentDialog from "@/components/SendDocumentDialog";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  leadId?: string | null;
  contaId?: string | null;
  defaultSigner?: { name?: string; email?: string; cpf?: string };
}

export default function EntityDocumentsTab({ leadId, contaId, defaultSigner }: Props) {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSend, setOpenSend] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = (supabase.from("signed_documents" as any) as any)
      .select("id,name,status,sent_at,created_at, document_signers(id,status)")
      .order("created_at", { ascending: false });
    if (leadId) q = q.eq("lead_id", leadId);
    else if (contaId) q = q.eq("conta_id", contaId);
    const { data } = await q;
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [leadId, contaId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <FileSignature className="h-4 w-4" /> Documentos
        </h3>
        <Button size="sm" onClick={() => setOpenSend(true)}>
          <Plus className="h-4 w-4 mr-1" /> Enviar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : docs.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum documento enviado ainda.
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const total = d.document_signers?.length || 0;
            const signed = d.document_signers?.filter((s: any) => s.status === "signed").length || 0;
            return (
              <Card key={d.id} className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/crm/documentos/${d.id}`)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{d.name}</span>
                    <DocumentStatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {signed}/{total} assinaram · {format(new Date(d.sent_at || d.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SendDocumentDialog
        open={openSend}
        onOpenChange={setOpenSend}
        leadId={leadId || null}
        contaId={contaId || null}
        defaultSigner={defaultSigner}
        onCreated={load}
      />
    </div>
  );
}
