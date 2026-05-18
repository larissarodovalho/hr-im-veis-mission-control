import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Plus, Search, Download, Send, Trash2, Pencil } from "lucide-react";
import NovoContratoDialog from "@/components/contratos/NovoContratoDialog";
import SendDocumentDialog from "@/components/SendDocumentDialog";
import { CONTRATO_STATUS, formatCurrency, generatePdfBlob } from "@/lib/contratos";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Contrato = {
  id: string;
  cliente_nome: string | null;
  imovel_id: string | null;
  valor: number | null;
  status: string;
  created_at: string;
  pdf_url: string | null;
  conteudo_renderizado: string | null;
  lead_id: string | null;
  conta_id: string | null;
  cliente_email: string | null;
  cliente_documento: string | null;
};

export default function ContratosTab() {
  const { isAdmin } = useRole();
  const [items, setItems] = useState<Contrato[]>([]);
  const [imoveisMap, setImoveisMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openNew, setOpenNew] = useState(false);
  const [sendCtx, setSendCtx] = useState<Contrato | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("contratos" as any) as any)
      .select("id,cliente_nome,imovel_id,valor,status,created_at,pdf_url,conteudo_renderizado,lead_id,conta_id,cliente_email,cliente_documento")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setItems((data as any) || []);
    const ids = Array.from(new Set((data || []).map((c: any) => c.imovel_id).filter(Boolean)));
    if (ids.length) {
      const { data: ims } = await supabase.from("imoveis").select("id,codigo,titulo").in("id", ids as string[]);
      const m: Record<string, string> = {};
      (ims || []).forEach((i: any) => { m[i.id] = `${i.codigo ? i.codigo + " — " : ""}${i.titulo}`; });
      setImoveisMap(m);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const im = c.imovel_id ? (imoveisMap[c.imovel_id] || "").toLowerCase() : "";
      if (!(c.cliente_nome || "").toLowerCase().includes(q) && !im.includes(q)) return false;
    }
    return true;
  });

  const handleDownload = async (c: Contrato) => {
    try {
      let blob: Blob;
      if (c.pdf_url) {
        const { data, error } = await supabase.storage
          .from("signed-documents")
          .createSignedUrl(c.pdf_url, 3600);
        if (error) throw error;
        const res = await fetch(data.signedUrl);
        if (!res.ok) throw new Error("Não foi possível baixar o PDF do servidor");
        blob = await res.blob();
      } else {
        if (!c.conteudo_renderizado) return toast.error("Sem conteúdo para gerar PDF");
        blob = generatePdfBlob("CONTRATO DE AUTORIZAÇÃO DE VENDA COM EXCLUSIVIDADE", c.conteudo_renderizado);
      }
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.download = `contrato-${(c.cliente_nome || "sem-nome").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${c.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
    } catch (e: any) {
      toast.error(e.message || "Erro ao abrir o PDF");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("contratos" as any) as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Contrato excluído");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="h-6 w-6" /> Contratos
          </h1>
          <p className="text-sm text-muted-foreground">Autorização de venda com exclusividade</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="h-4 w-4 mr-1" /> Novo contrato</Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente ou imóvel" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(CONTRATO_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Nenhum contrato encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Imóvel</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Criado</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const st = CONTRATO_STATUS[c.status] || { label: c.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{c.cliente_nome || "—"}</td>
                      <td className="py-2 pr-3">{c.imovel_id ? imoveisMap[c.imovel_id] || "—" : "—"}</td>
                      <td className="py-2 pr-3">{formatCurrency(c.valor) || "—"}</td>
                      <td className="py-2 pr-3"><Badge variant="secondary" className={st.color}>{st.label}</Badge></td>
                      <td className="py-2 pr-3">{format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                      <td className="py-2 pr-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(c)} title="Baixar/Ver PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSendCtx(c)} title="Enviar para assinatura">
                            <Send className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(c.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NovoContratoDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />

      {sendCtx && (
        <SendDocumentDialog
          open={!!sendCtx}
          onOpenChange={(v) => !v && setSendCtx(null)}
          leadId={sendCtx.lead_id}
          contaId={sendCtx.conta_id}
          defaultSigner={{
            name: sendCtx.cliente_nome || "",
            email: sendCtx.cliente_email || "",
            cpf: sendCtx.cliente_documento || "",
          }}
          onCreated={() => { setSendCtx(null); load(); }}
        />
      )}
    </div>
  );
}
