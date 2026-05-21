import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Building2, Flame, Home as HomeIcon, Trophy, XCircle } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import NovaOportunidadeDialog from "@/components/imoveis/NovaOportunidadeDialog";
import EditarOportunidadeDialog from "@/components/imoveis/EditarOportunidadeDialog";
import { toast } from "sonner";

type Oportunidade = any;

const ESTAGIOS = [
  { key: "nova", label: "Nova", color: "bg-slate-500/10 border-slate-500/30" },
  { key: "buscando", label: "Buscando imóvel", color: "bg-blue-500/10 border-blue-500/30" },
  { key: "visita", label: "Visita agendada", color: "bg-indigo-500/10 border-indigo-500/30" },
  { key: "proposta", label: "Em proposta", color: "bg-amber-500/10 border-amber-500/30" },
  { key: "ganha", label: "Ganha", color: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "perdida", label: "Perdida", color: "bg-zinc-500/10 border-zinc-500/30" },
] as const;

const PRIO_COLORS: Record<string, string> = {
  alta: "bg-red-500/15 text-red-500 border-red-500/30",
  media: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  baixa: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

const fmt = (n: number | null | undefined) => n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function OportunidadeCard({ op, clienteNome, corretorNome, qtdImoveis, onClick }: { op: Oportunidade; clienteNome: string; corretorNome: string; qtdImoveis: number; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: op.id });
  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3 space-y-2 cursor-grab active:cursor-grabbing hover:border-primary/40 transition ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight">{op.titulo}</h4>
        <Badge variant="outline" className={`text-[10px] ${PRIO_COLORS[op.prioridade] || ""}`}>
          {op.prioridade === "alta" && <Flame className="h-3 w-3 mr-0.5" />}
          {op.prioridade}
        </Badge>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <div className="flex items-center gap-1">
          {op.cliente_tipo === "lead" ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
          <span className="text-foreground truncate">{clienteNome || "—"}</span>
        </div>
        {op.cidade && <div>{op.cidade}{op.bairro && ` · ${op.bairro}`}</div>}
        <div className="flex items-center justify-between pt-1">
          <span className="text-primary font-semibold">{fmt(op.valor_alvo)}</span>
          {qtdImoveis > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              <HomeIcon className="h-3 w-3 mr-1" />{qtdImoveis}
            </Badge>
          )}
        </div>
        {corretorNome && <div className="text-[10px] truncate">👤 {corretorNome}</div>}
      </div>
    </Card>
  );
}

function Coluna({ estagio, children, count }: { estagio: typeof ESTAGIOS[number]; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio.key });
  return (
    <div ref={setNodeRef} className={`rounded-md border-2 border-dashed ${estagio.color} p-2 min-h-[200px] transition ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {estagio.key === "ganha" && <Trophy className="h-3.5 w-3.5 text-emerald-600" />}
          {estagio.key === "perdida" && <XCircle className="h-3.5 w-3.5 text-zinc-500" />}
          <span className="text-xs font-semibold uppercase tracking-wide">{estagio.label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function OportunidadesTab() {
  const [items, setItems] = useState<Oportunidade[]>([]);
  const [vinculos, setVinculos] = useState<Record<string, number>>({});
  const [leads, setLeads] = useState<Record<string, string>>({});
  const [contas, setContas] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [corretorFilter, setCorretorFilter] = useState<string>("all");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Oportunidade | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const [opRes, viRes] = await Promise.all([
      supabase.from("oportunidades").select("*").order("created_at", { ascending: false }),
      supabase.from("oportunidade_imoveis").select("oportunidade_id"),
    ]);
    setItems(opRes.data ?? []);
    const counts: Record<string, number> = {};
    (viRes.data ?? []).forEach((v: any) => { counts[v.oportunidade_id] = (counts[v.oportunidade_id] || 0) + 1; });
    setVinculos(counts);
  };

  useEffect(() => {
    load();
    supabase.from("leads").select("id,nome").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((l: any) => { m[l.id] = l.nome; });
      setLeads(m);
    });
    supabase.from("contas").select("id,nome").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((c: any) => { m[c.id] = c.nome; });
      setContas(m);
    });
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) m[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(m);
    });
  }, []);

  const clienteNome = (op: Oportunidade) => op.cliente_tipo === "lead" ? leads[op.cliente_id] : contas[op.cliente_id];

  const filtered = useMemo(() => {
    return items.filter((op) => {
      if (corretorFilter !== "all" && op.corretor_id !== corretorFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return op.titulo?.toLowerCase().includes(s)
        || (clienteNome(op) || "").toLowerCase().includes(s)
        || op.cidade?.toLowerCase().includes(s)
        || op.bairro?.toLowerCase().includes(s);
    });
  }, [items, search, corretorFilter, leads, contas]);

  const byEstagio = useMemo(() => {
    const m: Record<string, Oportunidade[]> = {};
    ESTAGIOS.forEach((e) => { m[e.key] = []; });
    filtered.forEach((op) => { (m[op.estagio] ||= []).push(op); });
    return m;
  }, [filtered]);

  const ativas = items.filter((op) => !["ganha", "perdida"].includes(op.estagio)).length;

  const corretoresList = useMemo(() => {
    const ids = new Set(items.map((i) => i.corretor_id).filter(Boolean));
    return Array.from(ids).map((id) => ({ id, nome: profiles[id as string] || "—" }));
  }, [items, profiles]);

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const novoEstagio = String(e.over.id);
    const op = items.find((i) => i.id === id);
    if (!op || op.estagio === novoEstagio) return;
    setItems(items.map((i) => i.id === id ? { ...i, estagio: novoEstagio } : i));
    const { error } = await supabase.from("oportunidades").update({ estagio: novoEstagio }).eq("id", id);
    if (error) { toast.error("Erro ao mover"); load(); return; }
    toast.success(`Movida para ${ESTAGIOS.find((s) => s.key === novoEstagio)?.label}`);
  };

  const draggingOp = draggingId ? items.find((i) => i.id === draggingId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar oportunidade..." className="pl-8 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            value={corretorFilter}
            onChange={(e) => setCorretorFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="all">Todos os corretores</option>
            {corretoresList.map((c) => <option key={c.id} value={c.id as string}>{c.nome}</option>)}
          </select>
          <Badge variant="secondary">{ativas} ativas</Badge>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova oportunidade
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {ESTAGIOS.map((est) => (
            <Coluna key={est.key} estagio={est} count={byEstagio[est.key].length}>
              {byEstagio[est.key].map((op) => (
                <OportunidadeCard
                  key={op.id}
                  op={op}
                  clienteNome={clienteNome(op) || ""}
                  corretorNome={profiles[op.corretor_id] || ""}
                  qtdImoveis={vinculos[op.id] || 0}
                  onClick={() => setEditing(op)}
                />
              ))}
              {byEstagio[est.key].length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-6">Vazio</div>
              )}
            </Coluna>
          ))}
        </div>
        <DragOverlay>
          {draggingOp && (
            <OportunidadeCard
              op={draggingOp}
              clienteNome={clienteNome(draggingOp) || ""}
              corretorNome={profiles[draggingOp.corretor_id] || ""}
              qtdImoveis={vinculos[draggingOp.id] || 0}
              onClick={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <NovaOportunidadeDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />
      <EditarOportunidadeDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        oportunidade={editing}
        onSaved={load}
      />
    </div>
  );
}
