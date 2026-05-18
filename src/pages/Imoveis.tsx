import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Home as HomeIcon, Plus, Pencil, CheckCircle2, Trophy, FileText } from "lucide-react";
import { toast } from "sonner";
import NovoImovelDialog from "@/components/imoveis/NovoImovelDialog";
import EditarImovelDialog from "@/components/imoveis/EditarImovelDialog";

type Imovel = any;
type Proposta = any;
type Lead = any;

export default function Imoveis() {
  const [items, setItems] = useState<Imovel[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Imovel | null>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [contas, setContas] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("disponiveis");

  const load = async () => {
    const [imRes, prRes, ldRes] = await Promise.all([
      supabase.from("imoveis").select("*").order("created_at", { ascending: false }),
      supabase.from("propostas").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id,nome,telefone,email"),
    ]);
    setItems(imRes.data ?? []);
    setPropostas(prRes.data ?? []);
    const lm: Record<string, Lead> = {};
    (ldRes.data ?? []).forEach((l: any) => { lm[l.id] = l; });
    setLeads(lm);
  };

  useEffect(() => {
    load();
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) map[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(map);
    });
    supabase.from("contas").select("id,nome").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((c: any) => { map[c.id] = c.nome; });
      setContas(map);
    });
  }, []);

  const fmt = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const matchesSearch = (i: Imovel) =>
    !search ||
    i.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(search.toLowerCase()) ||
    i.codigo?.toLowerCase().includes(search.toLowerCase());

  // Build per-imovel proposta info
  const propostasByImovel = useMemo(() => {
    const m: Record<string, Proposta[]> = {};
    propostas.forEach(p => {
      if (!p.imovel_id) return;
      (m[p.imovel_id] ||= []).push(p);
    });
    return m;
  }, [propostas]);

  const isVendido = (i: Imovel) => (i.status || "").toLowerCase() === "vendido";

  const disponiveis = items.filter(i => !isVendido(i) && matchesSearch(i));
  const emProposta = items.filter(i => {
    if (isVendido(i)) return false;
    const ps = propostasByImovel[i.id] || [];
    return ps.some(p => ["em análise", "em analise", "aceita"].includes((p.status || "").toLowerCase()));
  }).filter(matchesSearch);
  const vendidos = items.filter(i => isVendido(i) && matchesSearch(i));

  const marcarVendido = async (imovel: Imovel, proposta: Proposta) => {
    if (!confirm(`Marcar "${imovel.titulo}" como vendido para ${leads[proposta.lead_id]?.nome || "este lead"}?`)) return;
    const { error: e1 } = await supabase.from("propostas").update({ status: "Aceita" }).eq("id", proposta.id);
    const { error: e2 } = await supabase.from("imoveis").update({ status: "Vendido" }).eq("id", imovel.id);
    // Recusar outras propostas do mesmo imóvel
    const outros = (propostasByImovel[imovel.id] || []).filter(p => p.id !== proposta.id);
    if (outros.length) {
      await supabase.from("propostas").update({ status: "Recusada" }).in("id", outros.map(p => p.id));
    }
    await supabase.from("activity_log").insert({
      tipo: "venda",
      descricao: `Imóvel "${imovel.titulo}" vendido para ${leads[proposta.lead_id]?.nome || "—"} por ${fmt(proposta.valor)}`,
      metadata: { imovel_id: imovel.id, proposta_id: proposta.id, lead_id: proposta.lead_id },
    });
    if (e1 || e2) toast.error("Erro ao marcar como vendido");
    else toast.success("Venda registrada");
    load();
  };

  const renderCardDisponivel = (i: Imovel) => (
    <Card key={i.id} className="overflow-hidden">
      <div className="relative">
        {i.fotos?.[0] ? (
          <img src={i.fotos[0]} alt={i.titulo} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground">
            <HomeIcon className="h-10 w-10 opacity-30" />
          </div>
        )}
        <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8" onClick={() => setEditing(i)} title="Editar imóvel">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{i.titulo}</h3>
            {i.codigo && <span className="text-[10px] font-mono text-muted-foreground">{i.codigo}</span>}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{i.status}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`}</div>
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div>Corretor: <span className="text-foreground">{profiles[i.corretor_id] || "—"}</span></div>
          <div>Proprietário: <span className="text-foreground">{contas[i.proprietario_id] || "—"}</span></div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="text-[10px]">{i.finalidade} · {i.tipo}</Badge>
          <span className="font-semibold text-primary">{fmt(i.valor)}</span>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setEditing(i)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
        </Button>
      </div>
    </Card>
  );

  const renderCardProposta = (i: Imovel) => {
    const ps = (propostasByImovel[i.id] || []).filter(p => ["em análise", "em analise", "aceita"].includes((p.status || "").toLowerCase()));
    const principal = ps[0];
    const lead = principal ? leads[principal.lead_id] : null;
    return (
      <Card key={i.id} className="overflow-hidden">
        <div className="relative">
          {i.fotos?.[0] ? (
            <img src={i.fotos[0]} alt={i.titulo} className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground">
              <HomeIcon className="h-10 w-10 opacity-30" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-amber-500/90 text-white border-0 text-[10px]">
            <FileText className="h-3 w-3 mr-1" /> {ps.length} proposta{ps.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight truncate">{i.titulo}</h3>
            <div className="text-[11px] text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`} {i.codigo && `· ${i.codigo}`}</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2 space-y-1 text-[11px]">
            <div className="font-medium text-foreground">{lead?.nome || "Lead não informado"}</div>
            {lead?.telefone && <div className="text-muted-foreground">{lead.telefone}</div>}
            <div className="flex items-center justify-between pt-1">
              <Badge variant="outline" className="text-[10px]">{principal?.status || "—"}</Badge>
              <span className="font-semibold text-primary">{fmt(principal?.valor)}</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">Corretor: <span className="text-foreground">{profiles[principal?.corretor_id || i.corretor_id] || "—"}</span></div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(i)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Imóvel
            </Button>
            <Button size="sm" className="flex-1" onClick={() => principal && marcarVendido(i, principal)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Vendido
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderCardVendido = (i: Imovel) => {
    const ps = propostasByImovel[i.id] || [];
    const aceita = ps.find(p => (p.status || "").toLowerCase() === "aceita") || ps[0];
    const lead = aceita ? leads[aceita.lead_id] : null;
    return (
      <Card key={i.id} className="overflow-hidden border-emerald-500/30">
        <div className="relative">
          {i.fotos?.[0] ? (
            <img src={i.fotos[0]} alt={i.titulo} className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground">
              <HomeIcon className="h-10 w-10 opacity-30" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-emerald-600 text-white border-0 text-[10px]">
            <Trophy className="h-3 w-3 mr-1" /> Vendido
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight truncate">{i.titulo}</h3>
            <div className="text-[11px] text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`} {i.codigo && `· ${i.codigo}`}</div>
          </div>
          <div className="rounded-md border bg-emerald-500/5 p-2 space-y-1 text-[11px]">
            <div className="text-muted-foreground">Comprador</div>
            <div className="font-medium text-foreground">{lead?.nome || "—"}</div>
            {lead?.telefone && <div className="text-muted-foreground">{lead.telefone}</div>}
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Valor de venda</span>
              <span className="font-semibold text-emerald-600">{fmt(aceita?.valor ?? i.valor)}</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">Corretor: <span className="text-foreground">{profiles[aceita?.corretor_id || i.corretor_id] || "—"}</span></div>
          <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => setEditing(i)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar imóvel
          </Button>
        </div>
      </Card>
    );
  };

  const emptyState = (msg: string) => (
    <Card className="p-10 text-center text-muted-foreground col-span-full">{msg}</Card>
  );

  const counts = { d: disponiveis.length, p: emProposta.length, v: vendidos.length };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><HomeIcon className="h-7 w-7 text-primary" /> Imóveis</h1>
          <p className="text-muted-foreground mt-1">{counts.d} disponíveis · {counts.p} em proposta · {counts.v} vendidos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="pl-8 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar imóvel
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="disponiveis">Disponíveis <Badge variant="secondary" className="ml-2 text-[10px]">{counts.d}</Badge></TabsTrigger>
          <TabsTrigger value="proposta">Em Proposta <Badge variant="secondary" className="ml-2 text-[10px]">{counts.p}</Badge></TabsTrigger>
          <TabsTrigger value="vendidos">Vendidos <Badge variant="secondary" className="ml-2 text-[10px]">{counts.v}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disponiveis.map(renderCardDisponivel)}
            {disponiveis.length === 0 && emptyState("Nenhum imóvel disponível. Clique em Cadastrar imóvel para começar.")}
          </div>
        </TabsContent>

        <TabsContent value="proposta" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {emProposta.map(renderCardProposta)}
            {emProposta.length === 0 && emptyState("Nenhum imóvel com proposta em aberto.")}
          </div>
        </TabsContent>

        <TabsContent value="vendidos" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendidos.map(renderCardVendido)}
            {vendidos.length === 0 && emptyState("Nenhuma venda registrada ainda.")}
          </div>
        </TabsContent>
      </Tabs>

      <NovoImovelDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />
      <EditarImovelDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        imovel={editing}
        onSaved={load}
      />
    </div>
  );
}
