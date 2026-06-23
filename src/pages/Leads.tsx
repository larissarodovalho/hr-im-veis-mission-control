import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { STAGES, SOURCES, INTERESTS, TEMPERATURES, daysSince, slaColor, slaLabel, initials, ageInDays, ageLabel, ageColor, idleDays, idleLabel, idleColor, Stage, Temperature } from "@/lib/leads";
import { Plus, Search, KanbanSquare, List as ListIcon, Trash2, Building2, Flame, AlertTriangle, Sparkles, ClipboardCheck, Loader2, User as UserIcon } from "lucide-react";
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { findDuplicates, DuplicateMatch } from "@/lib/duplicates";
import { useNavigate } from "react-router-dom";

type Lead = {
  id: string; nome: string; email: string | null; telefone: string | null;
  origem: string | null; etapa_funil: Stage; imovel_interesse: string | null; regiao: string | null;
  valor_estimado: number | null; ultima_interacao: string | null; created_at: string;
  temperatura: Temperature | null; tags: string[] | null; corretor_id: string | null;
};

const isUrgent = (l: { tags?: string[] | null; etapa_funil: Stage }) =>
  (Array.isArray(l.tags) && l.tags.includes("urgente")) || (l.etapa_funil as string) === "Contato Imediato";


export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [brokers, setBrokers] = useState<Record<string, string>>({});
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "idle">("recent");
  const [needsNurture, setNeedsNurture] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAdmin, isGestor } = useRole();
  const canDelete = isAdmin;

  const remove = async (id: string, name: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Lead "${name}" excluído`);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as any) ?? []);
    const { data: accs } = await supabase.from("contas").select("lead_id_origem").not("lead_id_origem", "is", null);
    setConvertedIds(new Set((accs ?? []).map((a: any) => a.lead_id_origem)));
  };

  useEffect(() => {
    load();
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) m[p.user_id] = p.nome || "Sem nome"; });
      setBrokers(m);
    });
    const ch = supabase.channel("leads-stream").on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const isClosedStage = (s: Stage) => s === "Fechado" || s === "Perdido";

  const needsNurtureCount = leads.filter(l => {
    if (isClosedStage(l.etapa_funil)) return false;
    const id = idleDays(l.ultima_interacao);
    return id === null || id >= 4;
  }).length;

  let filtered = leads.filter(l => {
    if (search) {
      const s = search.toLowerCase();
      const match = l.nome.toLowerCase().includes(s) || l.telefone?.includes(search) || l.email?.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (needsNurture) {
      if (isClosedStage(l.etapa_funil)) return false;
      const id = idleDays(l.ultima_interacao);
      if (!(id === null || id >= 4)) return false;
    }
    return true;
  });

  if (sortBy === "idle") {
    filtered = [...filtered].sort((a, b) => {
      const ai = idleDays(a.ultima_interacao);
      const bi = idleDays(b.ultima_interacao);
      if (ai === null && bi === null) return 0;
      if (ai === null) return -1;
      if (bi === null) return 1;
      return bi - ai;
    });
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id);
    const newStage = e.over?.id as Stage | undefined;
    if (!newStage) return;
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.etapa_funil === newStage) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa_funil: newStage } : l));
    const { error } = await supabase.from("leads").update({ etapa_funil: newStage }).eq("id", id);
    if (error) { toast.error("Erro ao mover lead"); load(); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Leads</h1>
          <p className="text-muted-foreground mt-1 text-sm">{filtered.length} de {leads.length}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="relative w-full md:w-56 order-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="pl-8 w-full" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Tabs value={view} onValueChange={v => setView(v as any)} className="order-2">
            <TabsList>
              <TabsTrigger value="kanban"><KanbanSquare className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><ListIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant={needsNurture ? "default" : "outline"}
            size="sm"
            className="order-2 gap-1.5"
            onClick={() => setNeedsNurture(v => !v)}
            title="Leads sem contato há 4+ dias (e fora de Fechado/Perdido)"
          >
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Precisam nutrição</span>
            <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">{needsNurtureCount}</Badge>
          </Button>
          {view === "list" && (
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="order-2 w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="idle">Mais antigos sem contato</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="order-3 ml-auto md:ml-0">
            <NewLeadDialog open={open} onOpenChange={setOpen} onCreated={load} userId={user?.id} />
          </div>
        </div>
      </header>

      {view === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {STAGES.map(s => (
              <Column key={s.id} stage={s.id} label={s.label} color={s.color} leads={filtered.filter(l => l.etapa_funil === s.id)} canDelete={canDelete} onDelete={remove} convertedIds={convertedIds} userId={user?.id} onChanged={load} brokers={brokers} />
            ))}
          </div>
        </DndContext>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(l => {
              const age = ageInDays(l.created_at);
              const idle = idleDays(l.ultima_interacao);
              return (
                <Card key={l.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`/crm/leads/${l.id}`} className="font-medium hover:underline block truncate">{l.nome}</Link>
                      {l.telefone && <div className="text-xs text-muted-foreground truncate">{l.telefone}</div>}
                    </div>
                    {canDelete && <DeleteLeadButton name={l.nome} onConfirm={() => remove(l.id, l.nome)} />}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {isUrgent(l) && <Badge className="bg-destructive text-destructive-foreground border-destructive border text-[10px] animate-pulse">🔥 Contato Imediato</Badge>}
                    {l.origem && <Badge variant="secondary" className="text-[10px]">{SOURCES[l.origem]?.emoji} {SOURCES[l.origem]?.label || l.origem}</Badge>}
                    {l.imovel_interesse && <Badge variant="outline" className="text-[10px]">{INTERESTS[l.imovel_interesse] || l.imovel_interesse}</Badge>}
                    <Badge variant="outline" className="text-[10px]">{STAGES.find(s => s.id === l.etapa_funil)?.label}</Badge>
                    <Badge className={ageColor(age) + " border text-[10px]"}>📅 {ageLabel(age)}</Badge>
                    <Badge className={idleColor(idle) + " border text-[10px]"}>⏱️ {idleLabel(idle)}</Badge>
                    {convertedIds.has(l.id) && <Badge className="bg-success/15 text-success border-success/30 border text-[10px] gap-0.5"><Building2 className="h-2.5 w-2.5" /> Conta</Badge>}
                  </div>
                  <div className="mt-3"><FollowUpCell lead={l} onChanged={load} userId={user?.id} /></div>
                </Card>
              );
            })}
            {filtered.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum lead.</Card>}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr>
                <th className="p-3">Nome</th><th className="p-3">Origem</th><th className="p-3">Interesse</th><th className="p-3">Etapa</th><th className="p-3">Tempo</th><th className="p-3">Follow-up</th>{canDelete && <th className="p-3 w-12"></th>}
              </tr></thead>
              <tbody>
                {filtered.map(l => {
                  const age = ageInDays(l.created_at);
                  const idle = idleDays(l.ultima_interacao);
                  return (
                    <tr key={l.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <Link to={`/crm/leads/${l.id}`} className="font-medium hover:underline">{l.nome}</Link>
                        {isUrgent(l) && <Badge className="ml-2 bg-destructive text-destructive-foreground border-destructive border text-[10px] animate-pulse">🔥 Imediato</Badge>}
                        {convertedIds.has(l.id) && <Badge className="ml-2 bg-success/15 text-success border-success/30 border text-[10px] gap-0.5"><Building2 className="h-2.5 w-2.5" /> Conta</Badge>}
                        <div className="text-xs text-muted-foreground">{l.telefone}</div>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{SOURCES[l.origem || ""]?.emoji} {SOURCES[l.origem || ""]?.label || l.origem}</Badge></td>
                      <td className="p-3 text-muted-foreground">{l.imovel_interesse ? (INTERESTS[l.imovel_interesse] || l.imovel_interesse) : "—"}</td>
                      <td className="p-3"><Badge variant="outline">{STAGES.find(s => s.id === l.etapa_funil)?.label}</Badge></td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className={ageColor(age) + " border text-[10px]"}>📅 {ageLabel(age)}</Badge>
                          <Badge className={idleColor(idle) + " border text-[10px]"}>⏱️ {idleLabel(idle)}</Badge>
                        </div>
                      </td>
                      <td className="p-3"><FollowUpCell lead={l} onChanged={load} userId={user?.id} /></td>
                      {canDelete && <td className="p-3"><DeleteLeadButton name={l.nome} onConfirm={() => remove(l.id, l.nome)} /></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Column({ stage, label, color, leads, canDelete, onDelete, convertedIds, userId, onChanged, brokers }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={"min-w-[280px] w-72 flex-shrink-0 rounded-xl bg-muted/40 p-3 transition flex flex-col min-h-[calc(100vh-220px)] " + (isOver ? "ring-2 ring-primary/40" : "")}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2"><span className={"h-2 w-2 rounded-full " + color} /><span className="font-medium text-sm">{label}</span></div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">{leads.map((l: Lead) => <LeadCard key={l.id} lead={l} canDelete={canDelete} onDelete={onDelete} converted={convertedIds.has(l.id)} userId={userId} onChanged={onChanged} brokers={brokers} />)}</div>
    </div>
  );
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function LeadCard({ lead, canDelete, onDelete, converted, userId, onChanged, brokers }: { lead: Lead; canDelete: boolean; onDelete: (id: string, name: string) => void; converted: boolean; userId?: string; onChanged: () => void; brokers: Record<string, string> }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const age = ageInDays(lead.created_at);
  const idle = idleDays(lead.ultima_interacao);
  const brokerName = lead.corretor_id ? brokers[lead.corretor_id] : null;
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className={"group rounded-lg bg-card border p-3 shadow-soft cursor-grab active:cursor-grabbing relative " + (isDragging ? "opacity-50" : "")}>
      {canDelete && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition" onPointerDown={e => e.stopPropagation()}>
          <DeleteLeadButton name={lead.nome} onConfirm={() => onDelete(lead.id, lead.nome)} compact />
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold flex-shrink-0">{initials(lead.nome)}</div>
        <div className="min-w-0 flex-1">
          <Link to={`/crm/leads/${lead.id}`} className="font-medium text-sm hover:underline block truncate" onPointerDown={e => e.stopPropagation()}>{lead.nome}</Link>
          {lead.regiao && <div className="text-xs text-muted-foreground truncate">{lead.regiao}</div>}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {isUrgent(lead) && <Badge className="bg-destructive text-destructive-foreground border-destructive border text-[10px] animate-pulse">🔥 Imediato</Badge>}
        {lead.origem && <Badge variant="secondary" className="text-[10px]">{SOURCES[lead.origem]?.emoji} {SOURCES[lead.origem]?.label || lead.origem}</Badge>}
        {lead.temperatura && <Badge className={TEMPERATURES[lead.temperatura].className + " border text-[10px]"}>{TEMPERATURES[lead.temperatura].emoji} {TEMPERATURES[lead.temperatura].label}</Badge>}
        {converted && <Badge className="bg-success/15 text-success border-success/30 border text-[10px] gap-0.5"><Building2 className="h-2.5 w-2.5" /> Conta</Badge>}
      </div>
      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
        <Badge className={ageColor(age) + " border text-[10px]"}>📅 {ageLabel(age)}</Badge>
        <Badge className={idleColor(idle) + " border text-[10px]"}>⏱️ {idleLabel(idle)}</Badge>
        {brokerName ? (
          <Badge variant="secondary" className="text-[10px] gap-0.5 max-w-full truncate" title={`Responsável: ${brokerName}`}>
            <UserIcon className="h-2.5 w-2.5" /> {shortName(brokerName)}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-0.5 text-muted-foreground" title="Sem responsável">
            <UserIcon className="h-2.5 w-2.5" /> Sem responsável
          </Badge>
        )}
      </div>
      <div className="mt-2.5 pt-2 border-t flex items-center justify-between gap-2" onPointerDown={e => e.stopPropagation()}>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Follow-up</span>
        <FollowUpCell lead={lead} onChanged={onChanged} userId={userId} compact />
      </div>
    </div>
  );
}

function FollowUpCell({ lead, onChanged, userId, compact }: { lead: Lead; onChanged: () => void; userId?: string; compact?: boolean }) {
  const [loadingIa, setLoadingIa] = useState(false);
  const [openManual, setOpenManual] = useState(false);
  const [nota, setNota] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const idle = idleDays(lead.ultima_interacao);
  const isClosed = lead.etapa_funil === "Fechado" || lead.etapa_funil === "Perdido";
  const iaEligible = !isClosed && (idle === null || idle >= 3) && !!lead.telefone;

  const sendIa = async () => {
    if (!iaEligible) return;
    setLoadingIa(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-followup-ia", { body: { lead_id: lead.id } });
      if (error) throw error;
      if ((data as any)?.ok) toast.success("Follow-up IA enviado");
      else toast.error((data as any)?.error || "Falha ao enviar");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar");
    } finally {
      setLoadingIa(false);
    }
  };

  const saveManual = async () => {
    if (!userId) return toast.error("Sessão expirada");
    setSavingManual(true);
    try {
      const { error } = await supabase.from("interacoes").insert({
        lead_id: lead.id,
        tipo: "followup_manual",
        descricao: nota.trim() || "Follow-up manual registrado",
        created_by: userId,
      });
      if (error) throw error;
      await supabase.from("leads").update({ ultima_interacao: new Date().toISOString() }).eq("id", lead.id);
      toast.success("Follow-up registrado");
      setNota("");
      setOpenManual(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={iaEligible ? "default" : "outline"}
          className={"gap-1 h-8 px-2.5 text-[11px] " + (iaEligible ? "bg-primary text-primary-foreground hover:bg-primary/90" : "")}
          disabled={!iaEligible || loadingIa}
          onClick={(e) => { e.stopPropagation(); sendIa(); }}
          title={iaEligible ? "Enviar mensagem de reaquecimento via IA" : "Disponível para leads sem interação há 72h+"}
        >
          {loadingIa ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          IA
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 h-8 px-2.5 text-[11px]"
          onClick={(e) => { e.stopPropagation(); setOpenManual(true); }}
          title="Registrar follow-up manual"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Manual
        </Button>
      </div>

      <Dialog open={openManual} onOpenChange={setOpenManual}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar follow-up manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Lead: <strong>{lead.nome}</strong></p>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="O que foi conversado, próximos passos…" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenManual(false)}>Cancelar</Button>
            <Button onClick={saveManual} disabled={savingManual}>{savingManual ? "Salvando…" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteLeadButton({ name, onConfirm, compact }: { name: string; onConfirm: () => void; compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className={compact ? "h-7 w-7 bg-background/80 hover:bg-destructive hover:text-destructive-foreground" : "h-8 w-8 text-muted-foreground hover:text-destructive"} onClick={e => e.stopPropagation()}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir <strong>{name}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NewLeadDialog({ open, onOpenChange, onCreated, userId }: any) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", imovel_interesse: "none", regiao: "", observacoes: "", origem: "manual" });
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const reset = () => {
    setForm({ nome: "", email: "", telefone: "", imovel_interesse: "none", regiao: "", observacoes: "", origem: "manual" });
    setDuplicates([]);
    setPendingPayload(null);
  };

  const insertNew = async (payload: any) => {
    const { error } = await supabase.from("leads").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead criado");
    onOpenChange(false);
    reset();
    onCreated();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (!userId) return toast.error("Sessão expirada");
    setSaving(true);
    try {
      const payload: any = { ...form, imovel_interesse: form.imovel_interesse === "none" ? null : form.imovel_interesse, created_by: userId };
      Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });

      const dups = (await findDuplicates({ email: form.email, telefone: form.telefone })).filter(d => d.table === "leads");
      if (dups.length > 0) {
        setPendingPayload(payload);
        setDuplicates(dups);
        return;
      }
      await insertNew(payload);
    } finally {
      setSaving(false);
    }
  };

  const updateExisting = async (dup: DuplicateMatch) => {
    const p = pendingPayload || {};
    const { data: cur } = await supabase.from("leads").select("nome, email, telefone, regiao, imovel_interesse, observacoes").eq("id", dup.id).maybeSingle();
    const upd: any = { ultima_interacao: new Date().toISOString(), etapa_funil: "Novo Lead" };
    if (p.nome && (!cur?.nome || cur.nome.startsWith("WhatsApp ") || cur.nome === "Lead sem nome")) upd.nome = p.nome;
    if (p.email && !cur?.email) upd.email = p.email;
    if (p.telefone && !cur?.telefone) upd.telefone = p.telefone;
    if (p.regiao && !cur?.regiao) upd.regiao = p.regiao;
    if (p.imovel_interesse && !cur?.imovel_interesse) upd.imovel_interesse = p.imovel_interesse;
    if (p.observacoes) upd.observacoes = cur?.observacoes ? `${cur.observacoes}\n---\n${p.observacoes}` : p.observacoes;
    const { error } = await supabase.from("leads").update(upd).eq("id", dup.id);
    if (error) return toast.error(error.message);
    toast.success("Lead atualizado e movido para 'Novo Lead'");
    onOpenChange(false);
    reset();
    onCreated();
  };

  const createAnyway = async () => {
    if (!pendingPayload) return;
    setSaving(true);
    try { await insertNew(pendingPayload); } finally { setSaving(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
        <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo lead</Button></DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Nome*</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Interesse</Label>
                <Select value={form.imovel_interesse} onValueChange={v => setForm({ ...form, imovel_interesse: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {Object.entries(INTERESTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Região</Label><Input value={form.regiao} onChange={e => setForm({ ...form, regiao: e.target.value })} placeholder="MT, GO…" /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar lead"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicates.length > 0} onOpenChange={(o) => { if (!o) { setDuplicates([]); setPendingPayload(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Lead já existe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Encontramos {duplicates.length === 1 ? "um lead" : `${duplicates.length} leads`} com o mesmo telefone ou e-mail:
            </p>
            {duplicates.map(d => (
              <div key={d.id} className="rounded-lg border p-3 space-y-2">
                <div>
                  <div className="font-medium">{d.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.telefone || "—"} · {d.email || "sem e-mail"}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">
                    Coincide por: <strong>{d.matchedBy.join(", ")}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); reset(); navigate(`/crm/leads/${d.id}`); }}>
                    Abrir existente
                  </Button>
                  <Button size="sm" onClick={() => updateExisting(d)}>
                    Atualizar e mover p/ Novo Lead
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => { setDuplicates([]); setPendingPayload(null); }}>Cancelar</Button>
              <Button variant="secondary" onClick={createAnyway} disabled={saving}>Criar novo mesmo assim</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
