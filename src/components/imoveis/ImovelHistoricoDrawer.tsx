import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Trophy, FileDown, Handshake, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: any | null;
};

type Item = {
  id: string;
  date: string;
  kind: "proposta" | "visita" | "venda";
  title: string;
  subtitle?: string;
  status?: string;
  valor?: number | null;
  documento_url?: string | null;
};

import { formatBRL } from "@/lib/format";
const fmtBRL = (n?: number | null) => formatBRL(n);

export default function ImovelHistoricoDrawer({ open, onOpenChange, imovel }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !imovel) return;
    setLoading(true);
    (async () => {
      const [propRes, reuRes, visRes, actRes] = await Promise.all([
        supabase.from("propostas").select("*").eq("imovel_id", imovel.id),
        supabase.from("reunioes").select("*").eq("imovel_id", imovel.id),
        (supabase.from("visitas" as any).select("*").eq("imovel_id", imovel.id) as any),
        supabase.from("activity_log").select("*").eq("tipo", "venda").contains("metadata", { imovel_id: imovel.id }),
      ]);
      const leadIds = new Set<string>();
      (propRes.data ?? []).forEach((p: any) => p.lead_id && leadIds.add(p.lead_id));
      (reuRes.data ?? []).forEach((r: any) => r.lead_id && leadIds.add(r.lead_id));
      (visRes.data ?? []).forEach((v: any) => v.lead_id && leadIds.add(v.lead_id));
      const { data: leadsData } = leadIds.size
        ? await supabase.from("leads").select("id,nome,telefone").in("id", Array.from(leadIds))
        : { data: [] };
      const leadsMap = new Map((leadsData ?? []).map((l: any) => [l.id, l]));

      const merged: Item[] = [];
      (propRes.data ?? []).forEach((p: any) => {
        const lead = leadsMap.get(p.lead_id);
        merged.push({
          id: `p-${p.id}`,
          date: p.created_at,
          kind: "proposta",
          title: `Proposta · ${lead?.nome || "Lead —"}`,
          subtitle: p.condicoes || undefined,
          status: p.status,
          valor: p.valor,
          documento_url: p.documento_url,
        });
      });
      (reuRes.data ?? []).forEach((r: any) => {
        const lead = leadsMap.get(r.lead_id);
        merged.push({
          id: `v-${r.id}`,
          date: r.agendada_para,
          kind: "visita",
          title: `Visita · ${lead?.nome || "—"}`,
          subtitle: r.local || r.link || undefined,
          status: r.status,
        });
      });
      (visRes.data ?? []).forEach((v: any) => {
        const lead = leadsMap.get(v.lead_id);
        merged.push({
          id: `vt-${v.id}`,
          date: v.data_visita,
          kind: "visita",
          title: `Visita · ${lead?.nome || "—"}`,
          subtitle: v.observacoes || undefined,
          status: v.status,
        });
      });
      (actRes.data ?? []).forEach((a: any) => {
        merged.push({
          id: `a-${a.id}`,
          date: a.created_at,
          kind: "venda",
          title: "Venda confirmada",
          subtitle: a.descricao,
        });
      });
      merged.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setItems(merged);
      setLoading(false);
    })();
  }, [open, imovel]);

  const verDocumento = async (path: string) => {
    const { data, error } = await supabase.storage.from("propostas").createSignedUrl(path, 60 * 60);
    if (error || !data?.signedUrl) return toast.error("Erro ao abrir o documento");
    window.open(data.signedUrl, "_blank");
  };

  const icon = (k: Item["kind"]) =>
    k === "proposta" ? <Handshake className="h-4 w-4 text-amber-600" /> :
    k === "visita"   ? <Calendar className="h-4 w-4 text-blue-600" /> :
                       <Trophy className="h-4 w-4 text-emerald-600" />;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico do imóvel</SheetTitle>
          <SheetDescription>
            {imovel?.titulo} {imovel?.codigo && <span className="font-mono text-xs">· {imovel.codigo}</span>}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}
          {!loading && items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">
              Sem movimentações ainda. Visitas, propostas e a venda aparecerão aqui.
            </div>
          )}
          {items.map(it => (
            <div key={it.id} className="rounded-md border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {icon(it.kind)}
                  <span className="font-medium text-sm truncate">{it.title}</span>
                </div>
                {it.status && <Badge variant="outline" className="text-[10px] shrink-0">{it.status}</Badge>}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {format(new Date(it.date), "dd 'de' MMMM yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              {it.subtitle && <div className="text-xs text-muted-foreground">{it.subtitle}</div>}
              {it.valor != null && <div className="text-sm font-semibold text-primary">{fmtBRL(it.valor)}</div>}
              {it.documento_url && (
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => verDocumento(it.documento_url!)}>
                  <FileDown className="h-3 w-3 mr-1" /> Ver PDF
                </Button>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
