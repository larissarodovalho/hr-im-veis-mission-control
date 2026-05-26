import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarCheck, Plus } from "lucide-react";
import { EventsCalendar } from "@/components/EventsCalendar";
import { SearchableSelect } from "@/components/SearchableSelect";

export default function Meetings() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ lead_id: "none", conta_id: "none", imovel_id: "none", agendada_para: "", local: "", link: "", notas: "" });
  const [editForm, setEditForm] = useState({ tipo: "presencial", lead_id: "none", conta_id: "none", imovel_id: "none", agendada_para: "", local: "", link: "", notas: "", status: "agendada" });

  const load = async () => {
    const { data: meetings, error } = await supabase.from("reunioes").select("*").order("agendada_para");
    if (error) {
      toast.error("Não foi possível carregar as reuniões");
      setItems([]);
      return;
    }

    const leadIds = [...new Set((meetings ?? []).map((m) => m.lead_id).filter(Boolean))];
    const { data: meetingLeads } = leadIds.length
      ? await supabase.from("leads").select("id,nome,telefone,email").in("id", leadIds)
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
    supabase.from("imoveis").select("id, titulo, codigo").order("created_at", { ascending: false }).then(({ data }) =>
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: i.codigo ? `${i.titulo} · ${i.codigo}` : i.titulo })))
    );
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agendada_para) return toast.error("Informe data");
    const { error } = await supabase.from("reunioes").insert({
      lead_id: form.lead_id === "none" ? null : form.lead_id,
      conta_id: form.conta_id === "none" ? null : form.conta_id,
      imovel_id: form.imovel_id === "none" ? null : form.imovel_id,
      agendada_para: new Date(form.agendada_para).toISOString(),
      local: form.local || null, link: form.link || null, notas: form.notas || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Reunião adicionada");
    setForm({ lead_id: "none", conta_id: "none", imovel_id: "none", agendada_para: "", local: "", link: "", notas: "" });
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
      imovel_id: m.imovel_id || "none",
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
      imovel_id: editForm.imovel_id === "none" ? null : editForm.imovel_id,
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
              <div>
                <Label>Imóvel visitado</Label>
                <SearchableSelect
                  value={form.imovel_id}
                  onChange={(v) => setForm({ ...form, imovel_id: v })}
                  options={imoveis}
                  placeholder="Buscar imóvel..."
                  emptyLabel="Sem imóvel vinculado"
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
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-0.5">
                    {m.leads?.id ? <Link to={`/crm/leads/${m.lead_id}`} className="font-medium text-primary underline-offset-2 hover:underline">{m.leads.nome}</Link> : m.conta?.id ? <Link to={`/crm/contas/${m.conta_id}`} className="font-medium text-primary underline-offset-2 hover:underline">{m.conta.nome}</Link> : <span>{m.titulo || "Sem lead"}</span>}
                    {m.leads?.telefone && <span className="text-xs text-muted-foreground">📞 {m.leads.telefone}</span>}
                    {m.leads?.email && <span className="text-xs text-muted-foreground truncate max-w-[240px]">✉ {m.leads.email}</span>}
                  </div>
                </td>
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
                to={`/crm/leads/${editing.lead_id}`}
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
                <SearchableSelect
                  value={editForm.lead_id}
                  onChange={(v) => setEditForm({ ...editForm, lead_id: v })}
                  options={leads}
                  placeholder="Buscar lead..."
                  emptyLabel="Sem lead vinculado"
                />
              </div>
              <div>
                <Label>Conta</Label>
                <SearchableSelect
                  value={editForm.conta_id}
                  onChange={(v) => setEditForm({ ...editForm, conta_id: v })}
                  options={contas}
                  placeholder="Buscar conta..."
                  emptyLabel="Sem conta vinculada"
                />
              </div>
            </div>
            <div>
              <Label>Imóvel visitado</Label>
              <SearchableSelect
                value={editForm.imovel_id}
                onChange={(v) => setEditForm({ ...editForm, imovel_id: v })}
                options={imoveis}
                placeholder="Buscar imóvel..."
                emptyLabel="Sem imóvel vinculado"
              />
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
