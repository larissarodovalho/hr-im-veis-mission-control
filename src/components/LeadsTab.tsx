import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLeads, LeadDB } from "@/hooks/useLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Phone, Mail, Pencil, Trash2, Loader2, User,
  LayoutGrid, List as ListIcon, GripVertical, ExternalLink,
} from "lucide-react";
import {
  DndContext, DragEndEvent, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  ETAPAS, ORIGENS, STATUS, TEMPERATURAS, ETAPA_COLORS, TEMP_META,
  daysSince, slaColor, slaLabel,
} from "@/lib/leads";

const empty: Partial<LeadDB> = {
  nome: "", telefone: "", email: "", origem: "Site",
  status: "Novo", etapa_funil: "Prospecção", valor_estimado: null,
  imovel_interesse: "", observacoes: "",
};

type View = "lista" | "kanban";

function DroppableColumn({ etapa, children, count }: { etapa: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-lg border bg-muted/30 p-2 transition ${isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{etapa}</h3>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {count === 0 && (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4 italic">arraste leads aqui</p>
        )}
        {children}
      </div>
    </div>
  );
}

function DraggableCard({ lead, etapa, onEdit }: { lead: LeadDB; etapa: string; onEdit: (l: LeadDB) => void }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: lead.id });
  const dias = daysSince(lead.ultima_interacao);
  const temp = (lead as any).temperatura as keyof typeof TEMP_META | null;
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-t-2 ${ETAPA_COLORS[etapa] ?? "border-t-muted"} hover:shadow-md transition ${isDragging ? "opacity-40" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing touch-none mt-0.5"
            aria-label="Arrastar"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate flex-1">{lead.nome}</p>
              <Link to={`/crm/lead/${lead.id}`} aria-label="Abrir detalhe">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </Link>
              <button onClick={() => onEdit(lead)} aria-label="Editar">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Badge className="text-[9px] py-0 px-1.5 h-4">{lead.status}</Badge>
              {lead.origem && <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">{lead.origem}</Badge>}
              {temp && TEMP_META[temp] && (
                <Badge variant="outline" className={`text-[9px] py-0 px-1.5 h-4 ${TEMP_META[temp].cls}`}>
                  {TEMP_META[temp].emoji} {TEMP_META[temp].label}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[9px] py-0 px-1.5 h-4 ${slaColor(dias)}`}>
                ⏱ {slaLabel(dias)}
              </Badge>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
              {lead.telefone && <p className="flex items-center gap-1 truncate"><Phone className="h-2.5 w-2.5" />{lead.telefone}</p>}
              {lead.imovel_interesse && <p className="truncate">🏠 {lead.imovel_interesse}</p>}
              {lead.valor_estimado && <p className="font-medium text-foreground/70">R$ {Number(lead.valor_estimado).toLocaleString("pt-BR")}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadsTab() {
  const { leads, loading, createLead, updateLead, deleteLead } = useLeads();
  const [view, setView] = useState<View>("lista");
  const [search, setSearch] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("Todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeadDB | null>(null);
  const [form, setForm] = useState<Partial<LeadDB>>(empty);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(l =>
      (filtroEtapa === "Todos" || view === "kanban" || l.etapa_funil === filtroEtapa) &&
      (!q || l.nome.toLowerCase().includes(q) || (l.telefone ?? "").includes(q) || (l.email ?? "").toLowerCase().includes(q))
    );
  }, [leads, search, filtroEtapa, view]);

  const porEtapa = useMemo(() => {
    const map: Record<string, LeadDB[]> = {};
    ETAPAS.forEach(e => { map[e] = []; });
    filtered.forEach(l => {
      const e = (ETAPAS as readonly string[]).includes(l.etapa_funil) ? l.etapa_funil : "Prospecção";
      map[e].push(l);
    });
    return map;
  }, [filtered]);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(l: LeadDB) { setEditing(l); setForm(l); setOpen(true); }

  async function salvar() {
    if (!form.nome?.trim()) return;
    setSaving(true);
    if (editing) await updateLead(editing.id, form);
    else await createLead(form);
    setSaving(false);
    setOpen(false);
  }

  async function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const newEtapa = e.over?.id as string | undefined;
    if (!newEtapa) return;
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.etapa_funil === newEtapa) return;
    await updateLead(lead.id, { etapa_funil: newEtapa });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        {view === "lista" && (
          <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas etapas</SelectItem>
              {ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex rounded-md border bg-muted/40 p-0.5">
          <Button size="sm" variant={view === "lista" ? "default" : "ghost"} className="h-8 px-3" onClick={() => setView("lista")}>
            <ListIcon className="h-4 w-4 mr-1" /> Lista
          </Button>
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} className="h-8 px-3" onClick={() => setView("kanban")}>
            <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar lead" : "Novo lead"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(66) 99999-0000" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Origem</Label>
                  <Select value={form.origem ?? ""} onValueChange={(v) => setForm({ ...form, origem: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORIGENS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Status</Label>
                  <Select value={form.status ?? "Novo"} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Etapa do funil</Label>
                  <Select value={form.etapa_funil ?? "Prospecção"} onValueChange={(v) => setForm({ ...form, etapa_funil: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Temperatura</Label>
                  <Select value={(form as any).temperatura ?? ""} onValueChange={(v) => setForm({ ...form, ...(v ? { temperatura: v } : { temperatura: null }) } as any)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {TEMPERATURAS.map(t => <SelectItem key={t} value={t}>{TEMP_META[t].emoji} {TEMP_META[t].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Valor estimado (R$)</Label>
                  <Input type="number" value={form.valor_estimado ?? ""} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Região</Label>
                  <Input value={(form as any).regiao ?? ""} onChange={(e) => setForm({ ...form, regiao: e.target.value } as any)} placeholder="Cidade / UF" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Imóvel de interesse</Label>
                <Input value={form.imovel_interesse ?? ""} onChange={(e) => setForm({ ...form, imovel_interesse: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : view === "lista" ? (
        filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            {leads.length === 0 ? "Nenhum lead ainda. Clique em \"Novo Lead\" para começar." : "Nenhum lead encontrado com esses filtros."}
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map(l => {
              const dias = daysSince(l.ultima_interacao);
              const temp = (l as any).temperatura as keyof typeof TEMP_META | null;
              return (
                <Card key={l.id} className="border-border/50 hover:border-primary/40 transition">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/crm/lead/${l.id}`} className="font-semibold text-sm truncate hover:text-primary hover:underline">
                          {l.nome}
                        </Link>
                        <Badge variant="outline" className="text-[10px]">{l.etapa_funil}</Badge>
                        <Badge className="text-[10px]">{l.status}</Badge>
                        {l.origem && <Badge variant="secondary" className="text-[10px]">{l.origem}</Badge>}
                        {temp && TEMP_META[temp] && (
                          <Badge variant="outline" className={`text-[10px] ${TEMP_META[temp].cls}`}>
                            {TEMP_META[temp].emoji} {TEMP_META[temp].label}
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${slaColor(dias)}`}>⏱ {slaLabel(dias)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {l.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{l.telefone}</span>}
                        {l.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{l.email}</span>}
                        {l.valor_estimado && <span>R$ {Number(l.valor_estimado).toLocaleString("pt-BR")}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita. O lead "{l.nome}" será removido.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteLead(l.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        // KANBAN com @dnd-kit
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {ETAPAS.map(etapa => {
                const items = porEtapa[etapa] ?? [];
                return (
                  <DroppableColumn key={etapa} etapa={etapa} count={items.length}>
                    {items.map(l => (
                      <DraggableCard key={l.id} lead={l} etapa={etapa} onEdit={openEdit} />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>
        </DndContext>
      )}
    </div>
  );
}
