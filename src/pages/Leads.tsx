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
import { STAGES, SOURCES, INTERESTS, TEMPERATURES, daysSince, slaColor, slaLabel, initials, Stage, Temperature } from "@/lib/leads";
import { Plus, Search, KanbanSquare, List as ListIcon, Trash2, Building2 } from "lucide-react";
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { findDuplicates, DuplicateMatch } from "@/lib/duplicates";
import DuplicateAlert from "@/components/DuplicateAlert";

type Lead = {
  id: string; nome: string; email: string | null; telefone: string | null;
  origem: string | null; etapa_funil: Stage; imovel_interesse: string | null; regiao: string | null;
  valor_estimado: number | null; ultima_interacao: string | null; created_at: string;
  temperatura: Temperature | null;
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { isAdmin, isGestor } = useRole();
  const canDelete = isAdmin || isGestor;

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
    const ch = supabase.channel("leads-stream").on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = leads.filter(l => !search || l.nome.toLowerCase().includes(search.toLowerCase()) || l.telefone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase()));
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
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Leads</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {leads.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="pl-8 w-56" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Tabs value={view} onValueChange={v => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban"><KanbanSquare className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><ListIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <NewLeadDialog open={open} onOpenChange={setOpen} onCreated={load} userId={user?.id} />
        </div>
      </header>

      {view === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(s => (
              <Column key={s.id} stage={s.id} label={s.label} color={s.color} leads={filtered.filter(l => l.etapa_funil === s.id)} canDelete={canDelete} onDelete={remove} convertedIds={convertedIds} />
            ))}
          </div>
        </DndContext>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr>
              <th className="p-3">Nome</th><th className="p-3">Origem</th><th className="p-3">Interesse</th><th className="p-3">Etapa</th><th className="p-3">SLA</th>{canDelete && <th className="p-3 w-12"></th>}
            </tr></thead>
            <tbody>
              {filtered.map(l => {
                const d = daysSince(l.ultima_interacao ?? l.created_at);
                return (
                  <tr key={l.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <Link to={`/app/leads/${l.id}`} className="font-medium hover:underline">{l.nome}</Link>
                      {convertedIds.has(l.id) && <Badge className="ml-2 bg-success/15 text-success border-success/30 border text-[10px] gap-0.5"><Building2 className="h-2.5 w-2.5" /> Conta</Badge>}
                      <div className="text-xs text-muted-foreground">{l.telefone}</div>
                    </td>
                    <td className="p-3"><Badge variant="secondary">{SOURCES[l.origem || ""]?.emoji} {SOURCES[l.origem || ""]?.label || l.origem}</Badge></td>
                    <td className="p-3 text-muted-foreground">{l.imovel_interesse || "—"}</td>
                    <td className="p-3"><Badge variant="outline">{STAGES.find(s => s.id === l.etapa_funil)?.label}</Badge></td>
                    <td className="p-3"><Badge className={slaColor(d) + " border"}>{slaLabel(d)}</Badge></td>
                    {canDelete && <td className="p-3"><DeleteLeadButton name={l.nome} onConfirm={() => remove(l.id, l.nome)} /></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Column({ stage, label, color, leads, canDelete, onDelete, convertedIds }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={"min-w-[280px] w-72 flex-shrink-0 rounded-xl bg-muted/40 p-3 transition " + (isOver ? "ring-2 ring-primary/40" : "")}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2"><span className={"h-2 w-2 rounded-full " + color} /><span className="font-medium text-sm">{label}</span></div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="space-y-2">{leads.map((l: Lead) => <LeadCard key={l.id} lead={l} canDelete={canDelete} onDelete={onDelete} converted={convertedIds.has(l.id)} />)}</div>
    </div>
  );
}

function LeadCard({ lead, canDelete, onDelete, converted }: { lead: Lead; canDelete: boolean; onDelete: (id: string, name: string) => void; converted: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const d = daysSince(lead.ultima_interacao ?? lead.created_at);
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
          <Link to={`/app/leads/${lead.id}`} className="font-medium text-sm hover:underline block truncate" onPointerDown={e => e.stopPropagation()}>{lead.nome}</Link>
          {lead.regiao && <div className="text-xs text-muted-foreground truncate">{lead.regiao}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
        {lead.origem && <Badge variant="secondary" className="text-[10px]">{SOURCES[lead.origem]?.emoji} {SOURCES[lead.origem]?.label || lead.origem}</Badge>}
        {lead.temperatura && <Badge className={TEMPERATURES[lead.temperatura].className + " border text-[10px]"}>{TEMPERATURES[lead.temperatura].emoji} {TEMPERATURES[lead.temperatura].label}</Badge>}
        {converted && <Badge className="bg-success/15 text-success border-success/30 border text-[10px] gap-0.5"><Building2 className="h-2.5 w-2.5" /> Conta</Badge>}
        <Badge className={slaColor(d) + " border text-[10px]"}>{slaLabel(d)}</Badge>
      </div>
    </div>
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
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", imovel_interesse: "none", regiao: "", observacoes: "", origem: "manual" });
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [forceCreate, setForceCreate] = useState(false);

  useEffect(() => {
    if (!open) { setDuplicates([]); setForceCreate(false); return; }
    const t = setTimeout(async () => {
      if (!form.email && !form.telefone) { setDuplicates([]); return; }
      const m = await findDuplicates({ email: form.email, telefone: form.telefone });
      setDuplicates(m);
      setForceCreate(false);
    }, 400);
    return () => clearTimeout(t);
  }, [form.email, form.telefone, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (!userId) return toast.error("Sessão expirada");
    if (duplicates.length && !forceCreate) {
      return toast.error("Contato já cadastrado. Confirme abaixo para prosseguir.");
    }
    setSaving(true);
    const payload: any = { ...form, imovel_interesse: form.imovel_interesse === "none" ? null : form.imovel_interesse, created_by: userId };
    Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
    const { error } = await supabase.from("leads").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lead criado");
    onOpenChange(false);
    setForm({ nome: "", email: "", telefone: "", imovel_interesse: "none", regiao: "", observacoes: "", origem: "manual" });
    setDuplicates([]);
    setForceCreate(false);
    onCreated();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <div><Label>Região</Label><Input value={form.regiao} onChange={e => setForm({ ...form, regiao: e.target.value })} /></div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
          {duplicates.length > 0 && (
            <DuplicateAlert matches={duplicates} showActions onIgnore={() => setForceCreate(true)} />
          )}
          {forceCreate && <p className="text-xs text-amber-600">Lead será criado mesmo com duplicidade detectada.</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving || (duplicates.length > 0 && !forceCreate)}>
              {saving ? "Salvando…" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
