import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/datetime";
import { BarChart3, CalendarCheck, Eye, Images, Loader2, MessageCircle, Monitor, PlayCircle, Smartphone, Users } from "lucide-react";
import type { LinkCompartilhado } from "@/lib/imovelLinks";

interface Evento {
  id: string;
  item_id: string | null;
  tipo_evento: string;
  visitor_id_hash: string;
  dispositivo: string | null;
  navegador: string | null;
  sistema_operacional: string | null;
  created_at: string;
}

const LABEL: Record<string, string> = {
  abertura: "Abertura do link",
  visualizacao_imovel: "Visualizou o imóvel",
  galeria: "Abriu a galeria",
  video: "Assistiu ao vídeo",
  clique_whatsapp: "Clicou em falar no WhatsApp",
  pedido_visita: "Pediu agendamento de visita",
  compartilhamento_tentativa: "Tentou compartilhar",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  link: LinkCompartilhado | null;
}

export default function LinkMetricasDialog({ open, onOpenChange, link }: Props) {
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [imoveisPorItem, setImoveisPorItem] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !link) return;
    setLoading(true);
    (async () => {
      const [{ data: evs }, { data: its }] = await Promise.all([
        supabase
          .from("imovel_link_eventos")
          .select("id, item_id, tipo_evento, visitor_id_hash, dispositivo, navegador, sistema_operacional, created_at")
          .eq("link_id", link.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("imovel_link_itens").select("id, imovel_id").eq("link_id", link.id),
      ]);
      const imIds = Array.from(new Set((its ?? []).map((i: any) => i.imovel_id)));
      const { data: ims } = imIds.length
        ? await supabase.from("imoveis").select("id, titulo, codigo").in("id", imIds)
        : { data: [] as any[] };
      const titulo: Record<string, string> = {};
      (ims ?? []).forEach((i: any) => { titulo[i.id] = i.codigo ? `${i.titulo} (${i.codigo})` : i.titulo; });
      const map: Record<string, string> = {};
      (its ?? []).forEach((i: any) => { map[i.id] = titulo[i.imovel_id] || "Imóvel"; });
      setImoveisPorItem(map);
      setEventos((evs ?? []) as Evento[]);
      setLoading(false);
    })();
  }, [open, link?.id]);

  const resumo = useMemo(() => {
    const conta = (t: string) => eventos.filter((e) => e.tipo_evento === t).length;
    const unicos = new Set(eventos.map((e) => e.visitor_id_hash)).size;
    const dispositivos: Record<string, number> = {};
    const navegadores: Record<string, number> = {};
    const porImovel: Record<string, { views: number; galeria: number; whats: number; visita: number }> = {};
    eventos.forEach((e) => {
      if (e.dispositivo) dispositivos[e.dispositivo] = (dispositivos[e.dispositivo] || 0) + 1;
      if (e.navegador) navegadores[e.navegador] = (navegadores[e.navegador] || 0) + 1;
      if (e.item_id) {
        const nome = imoveisPorItem[e.item_id] || "Imóvel";
        const r = (porImovel[nome] ||= { views: 0, galeria: 0, whats: 0, visita: 0 });
        if (e.tipo_evento === "visualizacao_imovel") r.views++;
        if (e.tipo_evento === "galeria") r.galeria++;
        if (e.tipo_evento === "clique_whatsapp") r.whats++;
        if (e.tipo_evento === "pedido_visita") r.visita++;
      }
    });
    return {
      aberturas: conta("abertura"),
      unicos,
      galeria: conta("galeria"),
      video: conta("video"),
      whats: conta("clique_whatsapp"),
      visita: conta("pedido_visita"),
      dispositivos,
      navegadores,
      porImovel: Object.entries(porImovel).sort((a, b) => b[1].views - a[1].views),
    };
  }, [eventos, imoveisPorItem]);

  const kpis = [
    { label: "Aberturas", value: resumo.aberturas, icon: Eye },
    { label: "Visitantes únicos", value: resumo.unicos, icon: Users },
    { label: "Galerias abertas", value: resumo.galeria, icon: Images },
    { label: "Vídeos", value: resumo.video, icon: PlayCircle },
    { label: "WhatsApp", value: resumo.whats, icon: MessageCircle },
    { label: "Pedidos de visita", value: resumo.visita, icon: CalendarCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Métricas do link {link?.codigo_referencia}
          </DialogTitle>
          <DialogDescription>
            Acompanhamento do interesse do cliente. Os visitantes são identificados apenas por código anônimo.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kpis.map((k) => (
                <Card key={k.label} className="p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <k.icon className="h-3.5 w-3.5" /> {k.label}
                  </div>
                  <div className="text-xl font-semibold mt-0.5">{k.value}</div>
                </Card>
              ))}
            </div>

            {resumo.porImovel.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Interesse por imóvel</h4>
                <div className="rounded-md border divide-y">
                  {resumo.porImovel.map(([nome, r]) => (
                    <div key={nome} className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs">
                      <span className="font-medium">{nome}</span>
                      <span className="flex gap-3 text-muted-foreground">
                        <span>{r.views} visualizações</span>
                        <span>{r.galeria} galeria</span>
                        <span>{r.whats} WhatsApp</span>
                        <span>{r.visita} visita</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <h4 className="text-sm font-medium flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Dispositivos</h4>
                {Object.keys(resumo.dispositivos).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem acessos registrados.</p>
                ) : (
                  Object.entries(resumo.dispositivos).map(([d, n]) => (
                    <div key={d} className="flex justify-between text-xs"><span className="capitalize">{d}</span><span>{n}</span></div>
                  ))
                )}
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-medium flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> Navegadores</h4>
                {Object.keys(resumo.navegadores).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem acessos registrados.</p>
                ) : (
                  Object.entries(resumo.navegadores).map(([b, n]) => (
                    <div key={b} className="flex justify-between text-xs"><span>{b}</span><span>{n}</span></div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Linha do tempo</h4>
              {eventos.length === 0 ? (
                <p className="text-xs text-muted-foreground">O cliente ainda não abriu este link.</p>
              ) : (
                <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
                  {eventos.map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{e.visitor_id_hash.slice(0, 6)}</Badge>
                        <span>{LABEL[e.tipo_evento] || e.tipo_evento}</span>
                        {e.item_id && imoveisPorItem[e.item_id] && (
                          <span className="text-muted-foreground">· {imoveisPorItem[e.item_id]}</span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {fmtDateTime(e.created_at)} · {e.dispositivo || "—"} {e.navegador ? `· ${e.navegador}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
