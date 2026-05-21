import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Home as HomeIcon, Plus, Pencil, CheckCircle2, Trophy, FileText, Handshake, XCircle, FileSignature, Undo2, FileDown, History } from "lucide-react";
import { toast } from "sonner";
import NovoImovelDialog from "@/components/imoveis/NovoImovelDialog";
import EditarImovelDialog from "@/components/imoveis/EditarImovelDialog";
import NovaPropostaDialog from "@/components/imoveis/NovaPropostaDialog";
import ImovelHistoricoDrawer from "@/components/imoveis/ImovelHistoricoDrawer";
import VendidosTab from "@/pages/imoveis/VendidosTab";

type Imovel = any;
type Proposta = any;
type Lead = any;

const statusLower = (s?: string) => (s || "").toLowerCase();
const isEmAnalise = (p: Proposta) => ["em análise", "em analise"].includes(statusLower(p.status));
const isAceita = (p: Proposta) => statusLower(p.status) === "aceita";

export default function Imoveis() {
  const [items, setItems] = useState<Imovel[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Imovel | null>(null);
  const [propostaFor, setPropostaFor] = useState<Imovel | null>(null);
  const [histFor, setHistFor] = useState<Imovel | null>(null);
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

  const fmt = (n: number | null | undefined) => n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const matchesSearch = (i: Imovel) =>
    !search ||
    i.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(search.toLowerCase()) ||
    i.codigo?.toLowerCase().includes(search.toLowerCase());

  const propostasByImovel = useMemo(() => {
    const m: Record<string, Proposta[]> = {};
    propostas.forEach(p => {
      if (!p.imovel_id) return;
      (m[p.imovel_id] ||= []).push(p);
    });
    return m;
  }, [propostas]);

  const isVendido = (i: Imovel) => statusLower(i.status) === "vendido";

  // Classificação por estágio
  const stage = (i: Imovel): "vendido" | "fechamento" | "proposta" | "disponivel" => {
    if (isVendido(i)) return "vendido";
    const ps = propostasByImovel[i.id] || [];
    if (ps.some(isAceita)) return "fechamento";
    if (ps.some(isEmAnalise)) return "proposta";
    return "disponivel";
  };

  const disponiveis = items.filter(i => stage(i) === "disponivel" && matchesSearch(i));
  const emProposta  = items.filter(i => stage(i) === "proposta"   && matchesSearch(i));
  const emFechamento = items.filter(i => stage(i) === "fechamento" && matchesSearch(i));
  const vendidos    = items.filter(i => stage(i) === "vendido"    && matchesSearch(i));

  // ---------- Ações ----------
  const aceitarProposta = async (imovel: Imovel, proposta: Proposta) => {
    if (!confirm(`Aceitar a proposta de ${leads[proposta.lead_id]?.nome || "este lead"} por ${fmt(proposta.valor)}? As demais propostas deste imóvel serão recusadas.`)) return;
    await supabase.from("propostas").update({ status: "Aceita" }).eq("id", proposta.id);
    const outras = (propostasByImovel[imovel.id] || []).filter(p => p.id !== proposta.id && isEmAnalise(p));
    if (outras.length) await supabase.from("propostas").update({ status: "Recusada" }).in("id", outras.map(p => p.id));
    toast.success("Proposta aceita — imóvel em fechamento");
    load();
  };

  const recusarProposta = async (proposta: Proposta) => {
    if (!confirm("Recusar esta proposta?")) return;
    await supabase.from("propostas").update({ status: "Recusada" }).eq("id", proposta.id);
    toast.success("Proposta recusada");
    load();
  };

  const cancelarFechamento = async (proposta: Proposta) => {
    if (!confirm("Voltar este imóvel para 'Em Proposta'?")) return;
    await supabase.from("propostas").update({ status: "Em análise" }).eq("id", proposta.id);
    toast.success("Fechamento cancelado");
    load();
  };

  const confirmarVenda = async (imovel: Imovel, proposta: Proposta) => {
    if (!confirm(`Confirmar venda de "${imovel.titulo}" para ${leads[proposta.lead_id]?.nome || "—"}?`)) return;
    await supabase.from("imoveis").update({ status: "Vendido" }).eq("id", imovel.id);
    await supabase.from("activity_log").insert({
      tipo: "venda",
      descricao: `Imóvel "${imovel.titulo}" vendido para ${leads[proposta.lead_id]?.nome || "—"} por ${fmt(proposta.valor)}`,
      metadata: { imovel_id: imovel.id, proposta_id: proposta.id, lead_id: proposta.lead_id },
    });
    toast.success("Venda confirmada 🎉");
    load();
  };

  const verDocumento = async (p: Proposta) => {
    if (!p.documento_url) { toast.error("Sem documento anexado"); return; }
    const { data, error } = await supabase.storage.from("propostas").createSignedUrl(p.documento_url, 60 * 60);
    if (error || !data?.signedUrl) { toast.error("Erro ao abrir o documento"); return; }
    window.open(data.signedUrl, "_blank");
  };

  // ---------- Cards ----------
  const Header = ({ i, badge }: { i: Imovel; badge?: React.ReactNode }) => (
    <div className="relative">
      {i.fotos?.[0] ? (
        <img src={i.fotos[0]} alt={i.titulo} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground">
          <HomeIcon className="h-10 w-10 opacity-30" />
        </div>
      )}
      {badge}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setHistFor(i)} title="Histórico do imóvel">
          <History className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setEditing(i)} title="Editar imóvel">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const Title = ({ i }: { i: Imovel }) => (
    <div>
      <h3 className="font-semibold text-sm leading-tight truncate">{i.titulo}</h3>
      <div className="text-[11px] text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`} {i.codigo && `· ${i.codigo}`}</div>
    </div>
  );

  const renderDisponivel = (i: Imovel) => (
    <Card key={i.id} className="overflow-hidden">
      <Header i={i} badge={<Badge className="absolute top-2 left-2 text-[10px]" variant="outline">{i.status}</Badge>} />
      <div className="p-4 space-y-2">
        <Title i={i} />
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div>Corretor: <span className="text-foreground">{profiles[i.corretor_id] || "—"}</span></div>
          <div>Proprietário: <span className="text-foreground">{contas[i.proprietario_id] || "—"}</span></div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="text-[10px]">{i.finalidade} · {i.tipo}</Badge>
          <span className="font-semibold text-primary">{fmt(i.valor)}</span>
        </div>
        <Button size="sm" className="w-full mt-2" onClick={() => setPropostaFor(i)}>
          <Handshake className="h-3.5 w-3.5 mr-1.5" /> Iniciar proposta
        </Button>
      </div>
    </Card>
  );

  const renderEmProposta = (i: Imovel) => {
    const ps = (propostasByImovel[i.id] || []).filter(isEmAnalise);
    return (
      <Card key={i.id} className="overflow-hidden">
        <Header i={i} badge={
          <Badge className="absolute top-2 left-2 bg-amber-500/90 text-white border-0 text-[10px]">
            <FileText className="h-3 w-3 mr-1" /> {ps.length} proposta{ps.length > 1 ? "s" : ""}
          </Badge>
        } />
        <div className="p-4 space-y-2">
          <Title i={i} />
          <div className="space-y-2 max-h-56 overflow-auto">
            {ps.map(p => {
              const lead = leads[p.lead_id];
              return (
                <div key={p.id} className="rounded-md border bg-muted/30 p-2 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-foreground truncate">{lead?.nome || "Lead —"}</div>
                    <span className="font-semibold text-primary">{fmt(p.valor)}</span>
                  </div>
                  {lead?.telefone && <div className="text-muted-foreground">{lead.telefone}</div>}
                  {p.condicoes && <div className="text-muted-foreground italic">{p.condicoes}</div>}
                  {p.documento_url && (
                    <button onClick={() => verDocumento(p)} className="flex items-center gap-1 text-primary hover:underline">
                      <FileDown className="h-3 w-3" /> Ver PDF assinado
                    </button>
                  )}
                  <div className="flex gap-1.5 pt-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => recusarProposta(p)}>
                      <XCircle className="h-3 w-3 mr-1" /> Recusar
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-[11px] flex-1" onClick={() => aceitarProposta(i, p)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aceitar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={() => setPropostaFor(i)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova proposta
          </Button>
        </div>
      </Card>
    );
  };

  const renderEmFechamento = (i: Imovel) => {
    const aceita = (propostasByImovel[i.id] || []).find(isAceita);
    const lead = aceita ? leads[aceita.lead_id] : null;
    return (
      <Card key={i.id} className="overflow-hidden border-amber-500/40">
        <Header i={i} badge={
          <Badge className="absolute top-2 left-2 bg-amber-600 text-white border-0 text-[10px]">
            <FileSignature className="h-3 w-3 mr-1" /> Em fechamento
          </Badge>
        } />
        <div className="p-4 space-y-2">
          <Title i={i} />
          <div className="rounded-md border bg-amber-500/5 p-2 space-y-1 text-[11px]">
            <div className="text-muted-foreground">Comprador</div>
            <div className="font-medium text-foreground">{lead?.nome || "—"}</div>
            {lead?.telefone && <div className="text-muted-foreground">{lead.telefone}</div>}
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Valor acordado</span>
              <span className="font-semibold text-primary">{fmt(aceita?.valor)}</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">Corretor: <span className="text-foreground">{profiles[aceita?.corretor_id || i.corretor_id] || "—"}</span></div>
          {aceita?.documento_url && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => verDocumento(aceita)}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Ver PDF assinado
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button size="sm" variant="outline" asChild>
              <Link to="/crm/contratos"><FileSignature className="h-3.5 w-3.5 mr-1.5" /> Contrato</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => aceita && cancelarFechamento(aceita)}>
              <Undo2 className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </Button>
          </div>
          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => aceita && confirmarVenda(i, aceita)}>
            <Trophy className="h-3.5 w-3.5 mr-1.5" /> Confirmar venda
          </Button>
        </div>
      </Card>
    );
  };

  const renderVendido = (i: Imovel) => {
    const ps = propostasByImovel[i.id] || [];
    const aceita = ps.find(isAceita) || ps[0];
    const lead = aceita ? leads[aceita.lead_id] : null;
    return (
      <Card key={i.id} className="overflow-hidden border-emerald-500/40">
        <Header i={i} badge={
          <Badge className="absolute top-2 left-2 bg-emerald-600 text-white border-0 text-[10px]">
            <Trophy className="h-3 w-3 mr-1" /> Vendido
          </Badge>
        } />
        <div className="p-4 space-y-2">
          <Title i={i} />
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
          {aceita?.documento_url && (
            <Button size="sm" variant="outline" className="w-full" onClick={() => verDocumento(aceita)}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Ver PDF assinado
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const emptyState = (msg: string) => (
    <Card className="p-10 text-center text-muted-foreground col-span-full">{msg}</Card>
  );

  const counts = { d: disponiveis.length, p: emProposta.length, f: emFechamento.length, v: vendidos.length };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><HomeIcon className="h-7 w-7 text-primary" /> Imóveis</h1>
          <p className="text-muted-foreground mt-1">{counts.d} disponíveis · {counts.p} em proposta · {counts.f} em fechamento · {counts.v} vendidos</p>
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
          <TabsTrigger value="fechamento">Em Fechamento <Badge variant="secondary" className="ml-2 text-[10px]">{counts.f}</Badge></TabsTrigger>
          <TabsTrigger value="vendidos">Vendidos <Badge variant="secondary" className="ml-2 text-[10px]">{counts.v}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disponiveis.map(renderDisponivel)}
            {disponiveis.length === 0 && emptyState("Nenhum imóvel disponível. Clique em Cadastrar imóvel para começar.")}
          </div>
        </TabsContent>

        <TabsContent value="proposta" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {emProposta.map(renderEmProposta)}
            {emProposta.length === 0 && emptyState("Nenhuma proposta em aberto. Inicie uma proposta a partir de um imóvel disponível.")}
          </div>
        </TabsContent>

        <TabsContent value="fechamento" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {emFechamento.map(renderEmFechamento)}
            {emFechamento.length === 0 && emptyState("Nenhum imóvel em fechamento. Aceite uma proposta para chegar até aqui.")}
          </div>
        </TabsContent>

        <TabsContent value="vendidos" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendidos.map(renderVendido)}
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
      <NovaPropostaDialog
        open={!!propostaFor}
        onOpenChange={(v) => { if (!v) setPropostaFor(null); }}
        imovel={propostaFor}
        onCreated={load}
      />
      <ImovelHistoricoDrawer
        open={!!histFor}
        onOpenChange={(v) => { if (!v) setHistFor(null); }}
        imovel={histFor}
      />
    </div>
  );
}
