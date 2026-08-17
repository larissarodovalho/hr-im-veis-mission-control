import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Ban, Share2, Eye, Users, MessageCircle, CalendarCheck, Link2, Timer, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/datetime";
import LinkMetricasDialog from "@/components/imoveis/LinkMetricasDialog";
import CompartilharAcoes from "@/components/imoveis/CompartilharAcoes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { copiarTexto, registrarEventoInterno } from "@/lib/imovelLinkShare";
import { estadoAtual, tempoRestante, urlDoLink, revogarLink, type LinkCompartilhado } from "@/lib/imovelLinks";

type Metricas = { whatsapp: number; visita: number };

export default function LinksCompartilhadosTab() {
  const [links, setLinks] = useState<LinkCompartilhado[]>([]);
  const [itens, setItens] = useState<Record<string, string[]>>({});
  const [metricas, setMetricas] = useState<Record<string, Metricas>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [compartilhar, setCompartilhar] = useState<LinkCompartilhado | null>(null);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("all");
  const [loading, setLoading] = useState(true);
  const [metricasDe, setMetricasDe] = useState<LinkCompartilhado | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ls } = await supabase
      .from("imovel_links_compartilhados")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    const lista = (ls ?? []) as unknown as LinkCompartilhado[];
    setLinks(lista);

    const ids = lista.map((l) => l.id);
    if (ids.length) {
      const [{ data: its }, { data: evs }, { data: profs }] = await Promise.all([
        supabase.from("imovel_link_itens").select("link_id, imovel_id, ordem").in("link_id", ids),
        supabase.from("imovel_link_eventos").select("link_id, tipo_evento").in("link_id", ids),
        supabase.from("profiles").select("user_id,nome"),
      ]);
      const imIds = Array.from(new Set((its ?? []).map((i: any) => i.imovel_id)));
      const { data: ims } = imIds.length
        ? await supabase.from("imoveis").select("id,titulo,codigo").in("id", imIds)
        : { data: [] as any[] };
      const titulos: Record<string, string> = {};
      (ims ?? []).forEach((i: any) => { titulos[i.id] = i.codigo ? `${i.titulo} (${i.codigo})` : i.titulo; });

      const mapItens: Record<string, string[]> = {};
      (its ?? []).forEach((i: any) => { (mapItens[i.link_id] ||= []).push(titulos[i.imovel_id] || "Imóvel"); });
      setItens(mapItens);

      const mapMet: Record<string, Metricas> = {};
      (evs ?? []).forEach((e: any) => {
        const m = (mapMet[e.link_id] ||= { whatsapp: 0, visita: 0 });
        if (e.tipo_evento === "clique_whatsapp") m.whatsapp++;
        if (e.tipo_evento === "pedido_visita") m.visita++;
      });
      setMetricas(mapMet);

      const pm: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { if (p.user_id) pm[p.user_id] = p.nome || "—"; });
      setProfiles(pm);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return links.filter((l) => {
      if (estado !== "all" && estadoAtual(l) !== estado) return false;
      if (!q) return true;
      const alvo = [
        l.codigo_referencia, l.titulo_selecao || "", profiles[l.corretor_id] || "",
        ...(itens[l.id] || []),
      ].join(" ").toLowerCase();
      return alvo.includes(q);
    });
  }, [links, busca, estado, itens, profiles]);

  const kpis = useMemo(() => {
    const ativos = links.filter((l) => estadoAtual(l) === "ativo").length;
    const acessos = links.reduce((s, l) => s + (l.total_acessos || 0), 0);
    const unicos = links.reduce((s, l) => s + (l.visitantes_unicos || 0), 0);
    const visitas = Object.values(metricas).reduce((s, m) => s + m.visita, 0);
    return { ativos, acessos, unicos, visitas };
  }, [links, metricas]);

  const copiar = async (l: LinkCompartilhado) => {
    const ok = await copiarTexto(urlDoLink(l.token));
    if (!ok) return toast.error("Não foi possível copiar o link");
    registrarEventoInterno(l.id, "copia_link_interno");
    toast.success("Link copiado");
  };

  const revogar = async (l: LinkCompartilhado) => {
    if (!confirm(`Revogar o link ${l.codigo_referencia}? O cliente perde o acesso imediatamente.`)) return;
    try {
      await revogarLink(l.id, "Revogado pelo CRM");
      toast.success("Link revogado");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao revogar");
    }
  };

  const badgeEstado = (l: LinkCompartilhado) => {
    const e = estadoAtual(l);
    const map: Record<string, string> = {
      ativo: "bg-emerald-500/90 text-white border-0",
      expirado: "bg-zinc-500/90 text-white border-0",
      revogado: "bg-destructive text-destructive-foreground border-0",
      substituido: "bg-amber-500/90 text-white border-0",
    };
    return <Badge className={`text-[10px] ${map[e]}`}>{e}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Links ativos", value: kpis.ativos, icon: Link2 },
          { label: "Aberturas", value: kpis.acessos, icon: Eye },
          { label: "Visitantes únicos", value: kpis.unicos, icon: Users },
          { label: "Pedidos de visita", value: kpis.visitas, icon: CalendarCheck },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input className="w-full sm:w-72" placeholder="Buscar por código, imóvel ou corretor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="expirado">Expirados</SelectItem>
            <SelectItem value="revogado">Revogados</SelectItem>
            <SelectItem value="substituido">Substituídos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum link encontrado. Gere um link pelo botão de compartilhar no card do imóvel.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => {
            const m = metricas[l.id] || { whatsapp: 0, visita: 0 };
            const ativo = estadoAtual(l) === "ativo";
            return (
              <Card key={l.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{l.titulo_selecao || itens[l.id]?.[0] || "Imóvel"}</span>
                      {badgeEstado(l)}
                      <Badge variant="outline" className="text-[10px]">{l.codigo_referencia}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {(itens[l.id] || []).length > 1 ? `${itens[l.id].length} imóveis · ` : ""}
                      Corretor: {profiles[l.corretor_id] || "—"} · Criado em {fmtDateTime(l.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setMetricasDe(l)}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Métricas
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCompartilhar(l)}>
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copiar(l)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </Button>
                    {ativo && (
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => revogar(l)}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Revogar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {ativo ? tempoRestante(l) : "—"}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {l.total_acessos} aberturas</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {l.visitantes_unicos} únicos</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {m.whatsapp} WhatsApp</span>
                  <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" /> {m.visita} visitas pedidas</span>
                  {l.ultimo_acesso_em && <span>Último acesso: {fmtDateTime(l.ultimo_acesso_em)}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LinkMetricasDialog
        open={!!metricasDe}
        onOpenChange={(v) => { if (!v) setMetricasDe(null); }}
        link={metricasDe}
      />
    </div>
  );
}
