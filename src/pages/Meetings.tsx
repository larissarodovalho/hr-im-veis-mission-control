import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarCheck, Plus, Check, ChevronsUpDown } from "lucide-react";
import { EventsCalendar } from "@/components/EventsCalendar";

type Option = { id: string; nome: string };

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const label = value === "none" || !value ? emptyLabel : selected?.nome ?? emptyLabel;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", (value === "none" || !value) && "text-muted-foreground")}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={emptyLabel}
                onSelect={() => {
                  onChange("none");
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "none" ? "opacity-100" : "opacity-0")} />
                {emptyLabel}
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.nome}
                  onSelect={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
                  {o.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ lead_id: "none", conta_id: "none", agendada_para: "", local: "", link: "", notas: "" });
  const [editForm, setEditForm] = useState({ tipo: "presencial", lead_id: "none", conta_id: "none", agendada_para: "", local: "", link: "", notas: "", status: "agendada" });

  const load = async () => {
    const { data: meetings, error } = await supabase.from("reunioes").select("*").order("agendada_para");
    if (error) {
      toast.error("Não foi possível carregar as reuniões");
      setItems([]);
      return;
    }

    const leadIds = [...new Set((meetings ?? []).map((m) => m.lead_id).filter(Boolean))];
    const { data: meetingLeads } = leadIds.length
      ? await supabase.from("leads").select("id,nome").in("id", leadIds)
      : { data: [] };
    const leadsById = new Map((meetingLeads ?? []).map((lead) => [lead.id, lead]));

    const contaIds = [...new Set((meetings ?? []).map((m: any) => m.conta_id).filter(Boolean))];
    const { data: meetingContas } = contaIds.length
      ? await (supabase.from("contas" as any).select("id,nome").in("id", contaIds) as any)
      : { data: [] };
    const contasById = new Map(((meetingContas ?? []) as any[]).map((c: any) => [c.id, c]));

    setItems((meetings ?? []).map((meeting: any) => ({
      ...meeting,
      leads: meeting.lead_id ? leadsById.get(meeting.lead_id) : null,
      conta: meeting.conta_id ? contasById.get(meeting.conta_id) : null,
    })));
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
    (supabase.from("contas" as any).select("id, nome").order("nome") as any).then(({ data }: any) => setContas(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agendada_para) return toast.error("Informe data");
    const { error } = await supabase.from("reunioes").insert({
      lead_id: form.lead_id === "none" ? null : form.lead_id,
      conta_id: form.conta_id === "none" ? null : form.conta_id,
      agendada_para: new Date(form.agendada_para).toISOString(),
      local: form.local || null, link: form.link || null, notas: form.notas || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Reunião adicionada");
    setForm({ lead_id: "none", conta_id: "none", agendada_para: "", local: "", link: "", notas: "" });
    setOpen(false);
    load();
  };

  const openEdit = (m: any) => {
    setEditing(m);
    const dt = new Date(m.agendada_para);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditForm({
      tipo: m.tipo || "presencial",
      lead_id: m.lead_id || "none",
      conta_id: m.conta_id || "none",
      agendada_para: local,
      local: m.local || "",
      link: m.link || "",
      notas: m.notas || "",
      status: m.status || "agendada",
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { error } = await supabase.from("reunioes").update({
      tipo: editForm.tipo,
      lead_id: editForm.lead_id === "none" ? null : editForm.lead_id,
      conta_id: editForm.conta_id === "none" ? null : editForm.conta_id,
      agendada_para: new Date(editForm.agendada_para).toISOString(),
      local: editForm.local || null,
      link: editForm.link || null,
      notas: editForm.notas || null,
      status: editForm.status,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Reunião atualizada");
    setEditing(null);
    load();
  };

  const quickStatus = async (m: any, status: string) => {
    const { error } = await supabase.from("reunioes").update({ status }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    load();
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Excluir esta reunião?")) return;
    const { error } = await supabase.from("reunioes").delete().eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Reunião excluída");
    setEditing(null);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2"><CalendarCheck className="h-7 w-7" /> Reuniões</h1>
          <p className="text-sm text-muted-foreground mt-1">Clique numa linha para editar ou aprovar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova reunião</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>Lead</Label>
                <SearchableSelect
                  value={form.lead_id}
                  onChange={(v) => setForm({ ...form, lead_id: v })}
                  options={leads}
                  placeholder="Buscar lead..."
                  emptyLabel="Sem lead vinculado"
                />
              </div>
              <div>
                <Label>Conta</Label>
                <SearchableSelect
                  value={form.conta_id}
                  onChange={(v) => setForm({ ...form, conta_id: v })}
                  options={contas}
                  placeholder="Buscar conta..."
                  emptyLabel="Sem conta vinculada"
                />
              </div>
              <div><Label>Data e hora</Label><Input type="datetime-local" value={form.agendada_para} onChange={e => setForm({ ...form, agendada_para: e.target.value })} /></div>
              <div><Label>Local</Label><Input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} /></div>
              <div><Label>Link</Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Data</th><th className="p-3">Lead</th><th className="p-3">Tipo / Local</th><th className="p-3">Status</th><th className="p-3 w-24">Ações</th></tr></thead>
          <tbody>
            {items.map(m => {
              const tipoMeta: Record<string, { label: string; emoji: string }> = {
                presencial: { label: "Presencial", emoji: "🏠" },
                videochamada: { label: "Videochamada", emoji: "💻" },
                ligacao: { label: "Ligação", emoji: "📞" },
              };
              const t = tipoMeta[m.tipo] || { label: m.tipo || "—", emoji: "📌" };
              return (
              <tr key={m.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => openEdit(m)}>
                <td className="p-3 whitespace-nowrap">{format(new Date(m.agendada_para), "Pp", { locale: ptBR })}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>{m.leads?.id ? <Link to={`/app/leads/${m.lead_id}`} className="font-medium text-primary underline-offset-2 hover:underline">{m.leads.nome}</Link> : m.conta?.id ? <Link to={`/app/contas/${m.conta_id}`} className="font-medium text-primary underline-offset-2 hover:underline">{m.conta.nome}</Link> : (m.titulo || "Sem lead")}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit">{t.emoji} {t.label}</Badge>
                    {(m.local || m.link) && (
                      m.link ? (
                        <a href={m.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate max-w-[240px]" onClick={(e) => e.stopPropagation()}>{m.link}</a>
                      ) : (
                        <span className="text-xs text-muted-foreground truncate max-w-[240px]">{m.local}</span>
                      )
                    )}
                  </div>
                </td>
                <td className="p-3">
                  {(() => {
                    const styles: Record<string, string> = {
                      agendada: "bg-danger/15 text-danger border-danger/30",
                      confirmada: "bg-success/15 text-success border-success/30",
                      realizada: "bg-success text-success-foreground border-transparent",
                      cancelada: "bg-muted text-muted-foreground border-border",
                      no_show: "bg-warning/15 text-warning border-warning/30",
                    };
                    return <Badge variant="outline" className={styles[m.status] || ""}>{m.status}</Badge>;
                  })()}
                </td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {m.status !== "confirmada" && m.status !== "realizada" && (
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => quickStatus(m, "confirmada")}>Aprovar</Button>
                  )}
                </td>
              </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nada por aqui.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar reunião</DialogTitle></DialogHeader>
          {editing?.leads?.id && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Lead:</span>
              <Link
                to={`/app/leads/${editing.lead_id}`}
                className="font-medium text-primary underline-offset-2 hover:underline truncate"
                onClick={() => setEditing(null)}
              >
                {editing.leads.nome} →
              </Link>
            </div>
          )}
          <form onSubmit={saveEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lead</Label>
                <Select value={editForm.lead_id} onValueChange={v => setEditForm({ ...editForm, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem lead vinculado</SelectItem>
                    {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta</Label>
                <Select value={editForm.conta_id} onValueChange={v => setEditForm({ ...editForm, conta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem conta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem conta vinculada</SelectItem>
                    {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={editForm.tipo} onValueChange={v => setEditForm({ ...editForm, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="videochamada">Videochamada</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Data e hora</Label><Input type="datetime-local" value={editForm.agendada_para} onChange={e => setEditForm({ ...editForm, agendada_para: e.target.value })} /></div>
            <div><Label>Local</Label><Input value={editForm.local} onChange={e => setEditForm({ ...editForm, local: e.target.value })} /></div>
            <div><Label>Link</Label><Input value={editForm.link} onChange={e => setEditForm({ ...editForm, link: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={editForm.notas} onChange={e => setEditForm({ ...editForm, notas: e.target.value })} /></div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button type="button" variant="destructive" onClick={remove}>Excluir</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EventsCalendar
        title="Calendário de reuniões"
        events={items.map(m => ({ id: m.id, date: new Date(m.agendada_para), title: m.leads?.nome || m.conta?.nome || m.titulo || "Sem lead", lead_id: m.lead_id, status: m.status, description: m.local || m.notas }))}
      />
    </div>
  );
}
