import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Plus, Search, Trash2 } from "lucide-react";
import SendDocumentDialog from "@/components/SendDocumentDialog";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Doc = {
  id: string; name: string; status: string; created_at: string; sent_at: string | null;
  lead_id: string | null; conta_id: string | null;
  document_signers: { id: string; status: string }[];
};

export default function Documents() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openSend, setOpenSend] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("signed_documents" as any) as any)
      .select("id,name,status,created_at,sent_at,lead_id,conta_id, document_signers(id,status)")
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("docs-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "signed_documents" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = docs.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            Documentos
          </h1>
          <p className="text-sm text-muted-foreground">Contratos enviados para assinatura eletrônica</p>
        </div>
        <Button onClick={() => setOpenSend(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1" /> Enviar documento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="sent">Aguardando</SelectItem>
            <SelectItem value="partially_signed">Parcialmente assinado</SelectItem>
            <SelectItem value="signed">Assinado</SelectItem>
            <SelectItem value="refused">Recusado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
          <FileSignature className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento encontrado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => {
            const total = d.document_signers?.length || 0;
            const signed = d.document_signers?.filter((s) => s.status === "signed").length || 0;
            return (
              <Card
                key={d.id}
                className="p-4 hover:shadow-md cursor-pointer transition"
                onClick={() => navigate(`/crm/documentos/${d.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium line-clamp-2">{d.name}</h3>
                  <DocumentStatusBadge status={d.status} />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{signed} de {total} assinaram</p>
                  <p className="text-xs">
                    {d.sent_at
                      ? `Enviado ${format(new Date(d.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                      : `Criado ${format(new Date(d.created_at), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SendDocumentDialog open={openSend} onOpenChange={setOpenSend} onCreated={load} />
    </div>
  );
}
