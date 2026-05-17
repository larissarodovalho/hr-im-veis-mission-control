import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Send, Ban, FileText, Clock, Trash2 } from "lucide-react";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRole } from "@/hooks/useRole";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [signers, setSigners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const sb = supabase as any;
    const [{ data: d }, { data: s }, { data: e }] = await Promise.all([
      sb.from("signed_documents").select("*").eq("id", id).maybeSingle(),
      sb.from("document_signers").select("*").eq("document_id", id).order("created_at"),
      sb.from("document_events").select("*").eq("document_id", id).order("created_at", { ascending: false }),
    ]);
    setDoc(d); setSigners(s || []); setEvents(e || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`doc-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "signed_documents", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "document_signers", filter: `document_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "document_events", filter: `document_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const downloadAsBlob = async (url: string | null, filename: string) => {
    if (!url) return toast.error("Arquivo não disponível");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao baixar PDF");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    } catch (e: any) {
      toast.error(e.message || "Não foi possível baixar o documento");
    }
  };

  const resend = async (signerId: string) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("clicksign-resend-notification", { body: { signer_id: signerId } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Notificação reenviada");
  };

  const cancelDoc = async () => {
    if (!confirm("Cancelar este documento? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("clicksign-cancel-document", { body: { document_id: id } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Documento cancelado");
    load();
  };

  const downloadSigned = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("clicksign-download-signed", { body: { document_id: id } });
    setBusy(false);
    if (error) return toast.error(error.message);
    const url = (data as any)?.url;
    await downloadAsBlob(url, `${doc?.name || "documento"}-assinado.pdf`);
  };

  const downloadOriginal = async () => {
    if (!doc?.file_url) return;
    const { data, error } = await supabase.storage.from("signed-documents").createSignedUrl(doc.file_url, 3600);
    if (error) return toast.error(error.message);
    const raw = (data as any)?.signedUrl ?? (data as any)?.signedURL;
    const full = raw ? (raw.startsWith("http") ? raw : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${raw}`) : null;
    await downloadAsBlob(full, `${doc?.name || "documento"}.pdf`);
  };

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Carregando...</div>;
  if (!doc) return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Documento não encontrado.</div>;

  const isFinal = ["signed", "refused", "expired", "canceled"].includes(doc.status);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl md:text-2xl font-semibold">{doc.name}</h1>
              <DocumentStatusBadge status={doc.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Criado em {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {doc.deadline_at && ` · Prazo: ${format(new Date(doc.deadline_at), "dd/MM/yyyy", { locale: ptBR })}`}
            </p>
            {doc.lead_id && <Link to={`/crm/leads/${doc.lead_id}`} className="text-xs text-primary hover:underline">→ Ver lead vinculado</Link>}
            {doc.conta_id && <Link to={`/crm/contas/${doc.conta_id}`} className="text-xs text-primary hover:underline ml-2">→ Ver conta vinculada</Link>}
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.file_url && (
              <Button variant="outline" size="sm" onClick={downloadOriginal}>
                <FileText className="h-4 w-4 mr-1" /> Original
              </Button>
            )}
            {doc.status === "signed" && (
              <Button size="sm" onClick={downloadSigned} disabled={busy}>
                <Download className="h-4 w-4 mr-1" /> PDF assinado
              </Button>
            )}
            {!isFinal && (
              <Button variant="destructive" size="sm" onClick={cancelDoc} disabled={busy}>
                <Ban className="h-4 w-4 mr-1" /> Cancelar
              </Button>
            )}
          </div>
        </div>
        {doc.message && (
          <div className="mt-4 rounded-md bg-muted p-3 text-sm">
            <span className="font-medium">Mensagem enviada:</span> {doc.message}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-display text-lg font-semibold mb-3">Signatários</h2>
        <div className="space-y-2">
          {signers.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.name}</span>
                  <DocumentStatusBadge status={s.status} />
                  <span className="text-xs text-muted-foreground capitalize">({s.role})</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.email}{s.cpf && ` · CPF ${s.cpf}`}</p>
                {s.signed_at && (
                  <p className="text-xs text-muted-foreground">
                    Assinou em {format(new Date(s.signed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    {s.ip_address && ` · IP ${s.ip_address}`}
                  </p>
                )}
              </div>
              {s.status === "pending" && !isFinal && (
                <Button variant="outline" size="sm" onClick={() => resend(s.id)} disabled={busy}>
                  <Send className="h-4 w-4 mr-1" /> Reenviar
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Trilha de auditoria
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {events.map((ev) => (
              <li key={ev.id} className="flex gap-3 border-l-2 border-primary/30 pl-3 py-1">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(ev.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                </span>
                <span className="capitalize">{ev.event_type.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
