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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EventsCalendar } from "@/components/EventsCalendar";
import { SearchableSelect } from "@/components/SearchableSelect";

export default function Visits() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ lead_id: "none", conta_id: "none", imovel_id: "none", data_visita: "", observacoes: "" });
  const [editForm, setEditForm] = useState({ lead_id: "none", conta_id: "none", data_visita: "", imovel_id: "none", status: "Agendada", observacoes: "" });

  const load = async () => {
    const { data } = await supabase
      .from("visitas")
      .select("*, leads(id,nome), imoveis(id,titulo)")
      .order("data_visita", { ascending: false });
    const rows = data ?? [];
    const contaIds = [...new Set(rows.map((v: any) => v.conta_id).filter(Boolean))];
    let contasById = new Map<string, any>();
    if (contaIds.length) {
      const { data: cs } = await supabase.from("contas").select("id,nome").in("id", contaIds);
      contasById = new Map((cs ?? []).map((c: any) => [c.id, c]));
    }
    setItems(rows.map((v: any) => ({ ...v, conta: v.conta_id ? contasById.get(v.conta_id) ?? null : null })));
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
    supabase.from("contas").select("id, nome").order("nome").then(({ data }) => setContas(data ?? []));
    supabase.from("imoveis").select("id, titulo").order("titulo").then(({ data }) => setImoveis(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const lead = form.lead_id !== "none" ? form.lead_id : null;
    const conta = form.conta_id !== "none" ? form.conta_id : null;
    if (!lead && !conta) return toast.error("Selecione um lead ou uma conta");
    if (!form.data_visita) return toast.error("Informe a data");
    const { error } = await supabase.from("visitas").insert({
      lead_id: lead,
      conta_id: conta,
      imovel_id: form.imovel_id === "none" ? null : form.imovel_id,
      data_visita: new Date(form.data_visita).toISOString(),
      observacoes: form.observacoes || null,
      created_by: user?.id, corretor_id: user?.id,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Visita registrada");
    setForm({ lead_id: "none", conta_id: "none", imovel_id: "none", data_visita: "", observacoes: "" });
    setOpen(false); load();
  };

  const openEdit = (v: any) => {
    setEditing(v);
    const dt = new Date(v.data_visita);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditForm({
      lead_id: v.lead_id || "none",
      conta_id: v.conta_id || "none",
      data_visita: local,
      imovel_id: v.imovel_id || "none",
      status: v.status || "Agendada",
      observacoes: v.observacoes || "",
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { error } = await supabase.from("visitas").update({
      lead_id: editForm.lead_id === "none" ? null : editForm.lead_id,
      conta_id: editForm.conta_id === "none" ? null : editForm.conta_id,
      data_visita: new Date(editForm.data_visita).toISOString(),
      imovel_id: editForm.imovel_id === "none" ? null : editForm.imovel_id,
      status: editForm.status,
      observacoes: editForm.observacoes || null,
    } as any).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Visita atualizada");
    setEditing(null);
    load();
  };

  const quickStatus = async (v: any, status: string) => {
    const { error } = await supabase.from("visitas").update({ status }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    load();
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Excluir esta visita?")) return;
    const { error } = await supabase.from("visitas").delete().eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Visita excluída");
    setEditing(null);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Visitas</h1>
          <p className="text-sm text-muted-foreground mt-1">Clique numa linha para editar ou aprovar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova visita</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Lead</Label>
                  <SearchableSelect
                    value={form.lead_id}
                    onChange={(v) => setForm({ ...form, lead_id: v })}
                    options={leads}
                    placeholder="Buscar lead..."
                    emptyLabel="Sem lead"
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <SearchableSelect
                    value={form.conta_id}
                    onChange={(v) => setForm({ ...form, conta_id: v })}
                    options={contas}
                    placeholder="Buscar conta..."
                    emptyLabel="Sem conta"
                  />
                </div>
              </div>
              <div>
                <Label>Imóvel (opcional)</Label>
                <Select value={form.imovel_id} onValueChange={v => setForm({ ...form, imovel_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem imóvel</SelectItem>
                    {imoveis.map(i => <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora</Label><Input type="datetime-local" value={form.data_visita} onChange={e => setForm({ ...form, data_visita: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
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
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Quando</th><th className="p-3">Vínculo</th><th className="p-3">Imóvel</th><th className="p-3">Status</th><th className="p-3 w-32">Ações</th></tr></thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => openEdit(v)}>
                <td className="p-3">{format(new Date(v.data_visita), "Pp", { locale: ptBR })}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {v.leads?.id ? (
                    <Link to={`/crm/leads/${v.lead_id}`} className="hover:underline font-medium">{v.leads.nome}</Link>
                  ) : v.conta?.id ? (
                    <Link to={`/crm/contas/${v.conta_id}`} className="hover:underline font-medium">{v.conta.nome}</Link>
                  ) : "—"}
                </td>
                <td className="p-3 text-muted-foreground">{v.imoveis?.titulo || "—"}</td>
                <td className="p-3"><Badge variant="outline">{v.status}</Badge></td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {v.status === "Agendada" && (
                    <Button size="sm" variant="outline" onClick={() => quickStatus(v, "Confirmada")}>Aprovar</Button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem visitas.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar visita</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Lead</Label>
                <SearchableSelect
                  value={editForm.lead_id}
                  onChange={(v) => setEditForm({ ...editForm, lead_id: v })}
                  options={leads}
                  placeholder="Buscar lead..."
                  emptyLabel="Sem lead"
                />
              </div>
              <div>
                <Label>Conta</Label>
                <SearchableSelect
                  value={editForm.conta_id}
                  onChange={(v) => setEditForm({ ...editForm, conta_id: v })}
                  options={contas}
                  placeholder="Buscar conta..."
                  emptyLabel="Sem conta"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data e hora</Label><Input type="datetime-local" value={editForm.data_visita} onChange={e => setEditForm({ ...editForm, data_visita: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendada">Agendada</SelectItem>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Imóvel</Label>
              <Select value={editForm.imovel_id} onValueChange={v => setEditForm({ ...editForm, imovel_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem imóvel</SelectItem>
                  {imoveis.map(i => <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={editForm.observacoes} onChange={e => setEditForm({ ...editForm, observacoes: e.target.value })} /></div>
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
        title="Calendário de visitas"
        events={items.map(v => ({
          id: v.id,
          date: new Date(v.data_visita),
          title: v.leads?.nome || v.conta?.nome || "Sem vínculo",
          lead_id: v.lead_id,
          status: v.status,
          description: v.imoveis?.titulo || v.observacoes,
        }))}
      />
    </div>
  );
}
