import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Link2, Plus, SlidersHorizontal } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ESTAGIOS, ESTAGIO_ICONS, ESTAGIO_TEXT_COLORS, isEstagioFinal, tempoNaEtapa, prioridadeLabel, categoriaLabel,
  diasSemAcao, diagnosticoPendencias, diagnosticoAtrasado,
} from "@/lib/oportunidadesFunil";
import OportunidadeDetailDialog from "@/components/oportunidades/OportunidadeDetailDialog";
import CriarOportunidadeDialog from "@/components/oportunidades/CriarOportunidadeDialog";
import MigracaoLegadasPanel from "@/components/oportunidades/MigracaoLegadasPanel";

type Op = any;

const PAGE_SIZE = 500;

const prioridadeBadge = (p?: string | null) => {
  const map: Record<string, string> = {
    alta: "bg-red-500/10 text-red-600 border-red-500/30",
    media: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    baixa: "bg-muted text-muted-foreground",
  };
  return map[p ?? "media"] ?? map.media;
};

function OpCard({
  o,
  cli,
  vincs,
  lastActionIso,
  corretorNome,
  onClick,
}: {
  o: Op;
  cli: { nome: string; contaId: string | null; categoria: string | null };
  vincs: any[];
  lastActionIso?: string;
  corretorNome: string;
  onClick: () => void;
}) {
  const pend = !isEstagioFinal(o.estagio) ? diagnosticoPendencias(o).length : 0;
  const semAcao = !isEstagioFinal(o.estagio) ? diasSemAcao(lastActionIso, o.created_at) : 0;
  return (
    <Card className="p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium leading-tight line-clamp-2">{o.titulo}</p>
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        <Badge variant="outline" className={`text-[10px] ${prioridadeBadge(o.prioridade)}`}>{prioridadeLabel(o.prioridade)}</Badge>
        {categoriaLabel(o.categoria_origem ?? cli.categoria) && (
          <Badge variant="outline" className="text-[10px]">{categoriaLabel(o.categoria_origem ?? cli.categoria)}</Badge>
        )}
        {o.possui_permuta && <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/30">Permuta</Badge>}
      </div>
      <p className="text-xs mt-2 flex items-center gap-1 text-muted-foreground">
        <Link2 className="h-3 w-3 shrink-0" />
        <span className={cli.contaId ? "text-foreground" : "text-amber-600"}>{cli.nome}</span>
      </p>
      <div className="text-[11px] text-muted-foreground mt-1.5 space-y-0.5">
        {(o.cidade || o.bairro) && <p>{[o.cidade, o.bairro].filter(Boolean).join(" · ")}</p>}
        {o.valor_alvo != null && <p className="font-medium text-foreground">{formatBRL(o.valor_alvo)}</p>}
        {vincs.length > 0 && (
          <p>{vincs.length} imóve{vincs.length === 1 ? "l" : "is"} · {vincs.filter((v) => v.interesse === "alto").length} interesse alto</p>
        )}
        <p>Resp.: {corretorNome}</p>
      </div>
      {!isEstagioFinal(o.estagio) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pend > 0 && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
              <AlertTriangle className="h-3 w-3 mr-0.5" /> {pend} pendência{pend > 1 ? "s" : ""}
            </Badge>
          )}
          {o.estagio === "nova" && diagnosticoAtrasado(o) && (
            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30">Diagnóstico &gt; 5d</Badge>
          )}
          {semAcao > 7 && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">{semAcao}d sem ação</Badge>
          )}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">há {tempoNaEtapa(o.estagio_desde ?? o.created_at)}</p>
    </Card>
  );
}

/**
 * Funil de Oportunidades de Negócio — etapa final da cadeia comercial
 * Lead → Conta (Carteira/Marketing) → Oportunidade.
 */
export default function Oportunidades() {
  const { isAdmin, isGestor } = useAuth();
  const [ops, setOps] = useState<Op[]>([]);
  const [imoveisPorOp, setImoveisPorOp] = useState<Record<string, any[]>>({});
  const [lastAction, setLastAction] = useState<Record<string, string>>({});
  const [contasMap, setContasMap] = useState<Record<string, any>>({});
  const [leadsMap, setLeadsMap] = useState<Record<string, any>>({});
  const [corretores, setCorretores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [fCorretor, setFCorretor] = useState("todos");
  const [fCategoria, setFCategoria] = useState("todas");
  const [fTipo, setFTipo] = useState("todos");
  const [fOrigem, setFOrigem] = useState("todas");
  const [fVinculo, setFVinculo] = useState("todos");
  const [fPrioridade, setFPrioridade] = useState("todas");
  const [fDias, setFDias] = useState("todos");
  const [fPermuta, setFPermuta] = useState("todos");
  const [showFinalizadas, setShowFinalizadas] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileEstagio, setMobileEstagio] = useState<string>(ESTAGIOS[0]?.key ?? "nova");

  const [selected, setSelected] = useState<Op | null>(null);
  const [criarOpen, setCriarOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    // Paginação para superar o limite de 1000 linhas
    let all: Op[] = [];
    let from = 0;
    for (;;) {
      const { data } = await supabase
        .from("oportunidades")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      const batch = (data ?? []) as Op[];
      all = all.concat(batch);
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    setOps(all);

    const ids = all.map((o) => o.id);
    const contaIds = [...new Set(all.map((o) => o.conta_id || (o.cliente_tipo === "conta" ? o.cliente_id : null)).filter(Boolean))] as string[];
    const leadIds = [...new Set(all.map((o) => o.lead_id_origem || (o.cliente_tipo === "lead" ? o.cliente_id : null)).filter(Boolean))] as string[];

    const [vincRes, contasRes, leadsRes, profRes, interRes] = await Promise.all([
      ids.length ? supabase.from("oportunidade_imoveis").select("oportunidade_id,interesse,status").in("oportunidade_id", ids) : Promise.resolve({ data: [] as any[] }),
      contaIds.length ? supabase.from("contas").select("id,nome,categoria,origem").in("id", contaIds) : Promise.resolve({ data: [] as any[] }),
      leadIds.length ? supabase.from("leads").select("id,nome").in("id", leadIds) : Promise.resolve({ data: [] as any[] }),
      supabase.from("profiles").select("user_id,nome"),
      ids.length
        ? supabase.from("interacoes").select("oportunidade_id,created_at").in("oportunidade_id", ids).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const porOp: Record<string, any[]> = {};
    (vincRes.data ?? []).forEach((v: any) => {
      (porOp[v.oportunidade_id] = porOp[v.oportunidade_id] ?? []).push(v);
    });
    setImoveisPorOp(porOp);

    const cm: Record<string, any> = {};
    (contasRes.data ?? []).forEach((c: any) => { cm[c.id] = c; });
    setContasMap(cm);
    const lm: Record<string, any> = {};
    (leadsRes.data ?? []).forEach((l: any) => { lm[l.id] = l; });
    setLeadsMap(lm);
    const pm: Record<string, string> = {};
    (profRes.data ?? []).forEach((p: any) => { if (p.user_id) pm[p.user_id] = p.nome || "—"; });
    setCorretores(pm);

    const la: Record<string, string> = {};
    (interRes.data ?? []).forEach((i: any) => {
      if (!la[i.oportunidade_id]) la[i.oportunidade_id] = i.created_at;
    });
    setLastAction(la);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Deep-link: /crm/oportunidades?op=<id> abre os detalhes da oportunidade
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const opId = searchParams.get("op");
    if (!opId || loading) return;
    const found = ops.find((o) => o.id === opId);
    if (found) setSelected(found);
    setSearchParams((prev) => { prev.delete("op"); return prev; }, { replace: true });
  }, [searchParams, ops, loading, setSearchParams]);

  const clienteDe = (o: Op): { nome: string; contaId: string | null; categoria: string | null } => {
    const contaId = o.conta_id || (o.cliente_tipo === "conta" ? o.cliente_id : null);
    if (contaId && contasMap[contaId]) return { nome: contasMap[contaId].nome, contaId, categoria: contasMap[contaId].categoria };
    const leadId = o.lead_id_origem || (o.cliente_tipo === "lead" ? o.cliente_id : null);
    if (leadId && leadsMap[leadId]) return { nome: leadsMap[leadId].nome, contaId: null, categoria: null };
    return { nome: "Cliente não identificado", contaId, categoria: null };
  };

  const tipos = useMemo(() => [...new Set(ops.map((o) => o.tipo_imovel).filter(Boolean))] as string[], [ops]);
  const origens = useMemo(() => [...new Set(ops.map((o) => o.origem).filter(Boolean))] as string[], [ops]);
  const corretoresLista = useMemo(
    () => [...new Set(ops.map((o) => o.corretor_id).filter(Boolean))].map((id) => ({ id, nome: corretores[id as string] ?? "—" })),
    [ops, corretores]
  );

  const filtradas = useMemo(() => {
    const limite = fDias === "todos" ? null : Number(fDias);
    const agora = Date.now();
    return ops.filter((o) => {
      if (!showFinalizadas && isEstagioFinal(o.estagio)) return false;
      const cli = clienteDe(o);
      if (q && !(`${o.titulo} ${cli.nome}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (fCorretor !== "todos" && o.corretor_id !== fCorretor) return false;
      if (fCategoria !== "todas" && (o.categoria_origem ?? cli.categoria) !== fCategoria) return false;
      if (fTipo !== "todos" && o.tipo_imovel !== fTipo) return false;
      if (fOrigem !== "todas" && o.origem !== fOrigem) return false;
      if (fPrioridade !== "todas" && (o.prioridade ?? "media") !== fPrioridade) return false;
      if (fPermuta === "sim" && !o.possui_permuta) return false;
      if (fPermuta === "nao" && o.possui_permuta) return false;
      if (fVinculo === "pendente" && o.conta_id) return false;
      if (fVinculo === "ok" && !o.conta_id) return false;
      if (limite) {
        const criado = new Date(o.created_at).getTime();
        if (agora - criado > limite * 86400000) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops, q, fCorretor, fCategoria, fTipo, fOrigem, fVinculo, fPrioridade, fDias, fPermuta, showFinalizadas, contasMap, leadsMap]);

  const porEstagio = (key: string) => filtradas.filter((o) => (o.estagio ?? "nova") === key);
  const ativas = filtradas.filter((o) => !isEstagioFinal(o.estagio)).length;
  const paradas = ativas ? filtradas.filter((o) => !isEstagioFinal(o.estagio) && diasSemAcao(lastAction[o.id], o.created_at) > 7).length : 0;
  const vinculoPendente = filtradas.filter((o) => !o.conta_id && !isEstagioFinal(o.estagio)).length;

  const activeFilterCount =
    (fCorretor !== "todos" ? 1 : 0) +
    (fCategoria !== "todas" ? 1 : 0) +
    (fTipo !== "todos" ? 1 : 0) +
    (fOrigem !== "todas" ? 1 : 0) +
    (fVinculo !== "todos" ? 1 : 0) +
    (fPrioridade !== "todas" ? 1 : 0) +
    (fDias !== "todos" ? 1 : 0) +
    (fPermuta !== "todos" ? 1 : 0) +
    (showFinalizadas ? 1 : 0);

  const renderCard = (o: Op) => (
    <OpCard
      key={o.id}
      o={o}
      cli={clienteDe(o)}
      vincs={imoveisPorOp[o.id] ?? []}
      lastActionIso={lastAction[o.id]}
      corretorNome={o.corretor_id ? corretores[o.corretor_id] ?? "—" : "—"}
      onClick={() => setSelected(o)}
    />
  );

  const mobileCards = porEstagio(mobileEstagio);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 md:h-full md:min-h-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold font-display">Oportunidades de Negócio</h1>
          <p className="text-sm text-muted-foreground">
            Funil de compra — nasce das Contas em Contato estabelecido com destino Comprar.
          </p>
        </div>
        <Button onClick={() => setCriarOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova oportunidade
        </Button>
      </div>

      {/* Busca + botão de filtros (mobile) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:flex-none md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por título ou cliente..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" className="md:hidden shrink-0" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <div className={cn("flex-wrap items-center gap-2", filtersOpen ? "flex" : "hidden md:flex")}>
        <Select value={fCorretor} onValueChange={setFCorretor}>
          <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Corretor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os corretores</SelectItem>
            {corretoresLista.map((c) => <SelectItem key={c.id as string} value={c.id as string}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fCategoria} onValueChange={setFCategoria}>
          <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            <SelectItem value="carteira">Carteira</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Tipo de imóvel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fOrigem} onValueChange={setFOrigem}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas origens</SelectItem>
            {origens.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fPrioridade} onValueChange={setFPrioridade}>
          <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fDias} onValueChange={setFDias}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="180">Últimos 180 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fVinculo} onValueChange={setFVinculo}>
          <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Vínculo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Vínculo: todos</SelectItem>
            <SelectItem value="ok">Com conta</SelectItem>
            <SelectItem value="pendente">Sem conta (legado)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fPermuta} onValueChange={setFPermuta}>
          <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="Permuta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Permuta: todas</SelectItem>
            <SelectItem value="sim">Com permuta</SelectItem>
            <SelectItem value="nao">Sem permuta</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setShowFinalizadas(!showFinalizadas)}
          className={`text-xs px-3 py-2 rounded-md border transition-colors ${showFinalizadas ? "bg-accent border-border" : "text-muted-foreground hover:bg-accent/50"}`}
        >
          {showFinalizadas ? "Ocultar finalizadas" : "Mostrar finalizadas"}
        </button>
      </div>

      {/* Indicadores */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">{ativas} ativas</Badge>
        {paradas > 0 && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{paradas} sem ação &gt; 7 dias</Badge>}
        {vinculoPendente > 0 && <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">{vinculoPendente} sem conta vinculada</Badge>}
      </div>

      {(isAdmin || isGestor) && <MigracaoLegadasPanel />}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando oportunidades…</p>
      ) : (
        <>
          {/* Kanban — desktop */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0">
            {ESTAGIOS.map((col) => {
              const cards = porEstagio(col.key);
              const Icon = ESTAGIO_ICONS[col.key];
              return (
                <div key={col.key} className="w-[280px] shrink-0 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Icon className={`h-4 w-4 ${ESTAGIO_TEXT_COLORS[col.key]}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">{cards.length}</Badge>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2 rounded-md bg-muted/30 p-1.5">
                    {cards.map(renderCard)}
                    {cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhuma oportunidade</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista por etapa — mobile */}
          <div className="md:hidden space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {ESTAGIOS.map((col) => {
                const count = porEstagio(col.key).length;
                const Icon = ESTAGIO_ICONS[col.key];
                const active = mobileEstagio === col.key;
                return (
                  <button
                    key={col.key}
                    onClick={() => setMobileEstagio(col.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                      active ? "bg-primary/10 border-primary/50 text-foreground" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <Icon className={`h-3.5 w-3.5 ${ESTAGIO_TEXT_COLORS[col.key]}`} />
                    {col.label}
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px]">{count}</Badge>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {mobileCards.map(renderCard)}
              {mobileCards.length === 0 && (
                <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma oportunidade nesta etapa.</Card>
              )}
            </div>
          </div>
        </>
      )}

      <OportunidadeDetailDialog
        open={!!selected}
        onOpenChange={(v) => { if (!v) setSelected(null); }}
        oportunidade={selected}
        onSaved={load}
      />
      <CriarOportunidadeDialog
        open={criarOpen}
        onOpenChange={setCriarOpen}
        onCreated={() => load()}
      />
    </div>
  );
}
