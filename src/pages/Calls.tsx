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
import { Phone, Plus } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";

export default function Calls() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ lead_id: "none", conta_id: "none", data: "", duracao_seg: 0, resultado: "atendeu", notas: "" });
  const [editForm, setEditForm] = useState({ lead_id: "none", conta_id: "none", data: "", duracao_seg: 0, resultado: "atendeu", notas: "" });

  const load = async () => {
    const [{ data: calls, error }, { data: inter, error: ie }] = await Promise.all([
      supabase.from("ligacoes").select("*").order("data", { ascending: false }),
      supabase.from("interacoes").select("id,lead_id,conta_id,resultado,descricao,created_at,created_by").eq("tipo", "ligacao"),
    ]);
    if (error) console.error("[Calls] ligacoes error", error);
    if (ie) console.error("[Calls] interacoes error", ie);

    const fromLigacoes = (calls ?? []).map((c: any) => ({ ...c, _source: "ligacao" as const }));
    const fromInteracoes = (inter ?? []).map((i: any) => ({
      id: i.id,
      data: i.created_at,
      lead_id: i.lead_id,
      conta_id: i.conta_id,
      resultado: i.resultado,
      notas: i.descricao,
      duracao_seg: 0,
      created_by: i.created_by,
      _source: "interacao" as const,
    }));
    const merged = [...fromLigacoes, ...fromInteracoes].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    const leadIds = [...new Set(merged.map((c: any) => c.lead_id).filter(Boolean))];
    const contaIds = [...new Set(merged.map((c: any) => c.conta_id).filter(Boolean))];
    let leadsById = new Map<string, any>();
    let contasById = new Map<string, any>();
    if (leadIds.length) {
      const { data: ls } = await supabase.from("leads").select("id,nome").in("id", leadIds);
      leadsById = new Map((ls ?? []).map((l: any) => [l.id, l]));
    }
    if (contaIds.length) {
      const { data: cs } = await supabase.from("contas").select("id,nome").in("id", contaIds);
      contasById = new Map((cs ?? []).map((c: any) => [c.id, c]));
    }
    setItems(merged.map((c: any) => ({
      ...c,
      leads: c.lead_id ? leadsById.get(c.lead_id) ?? null : null,
      conta: c.conta_id ? contasById.get(c.conta_id) ?? null : null,
    })));
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
    supabase.from("contas").select("id, nome").order("nome").then(({ data }) => setContas(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data) return toast.error("Informe data");
    const { error } = await supabase.from("ligacoes").insert({
      lead_id: form.lead_id === "none" ? null : form.lead_id,
      conta_id: form.conta_id === "none" ? null : form.conta_id,
      data: new Date(form.data).toISOString(),
      duracao_seg: Number(form.duracao_seg) || 0,
      resultado: form.resultado, notas: form.notas || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Ligação registrada");
    setForm({ lead_id: "none", conta_id: "none", data: "", duracao_seg: 0, resultado: "atendeu", notas: "" });
    setOpen(false); load();
  };

  const openEdit = (c: any) => {
    setEditing(c);
    const dt = new Date(c.data);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditForm({
      lead_id: c.lead_id || "none",
      conta_id: c.conta_id || "none",
      data: local,
      duracao_seg: c.duracao_seg || 0,
      resultado: c.resultado || "atendeu",
      notas: c.notas || "",
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    let error;
    if (editing._source === "interacao") {
      ({ error } = await supabase.from("interacoes").update({
        lead_id: editForm.lead_id === "none" ? null : editForm.lead_id,
        conta_id: editForm.conta_id === "none" ? null : editForm.conta_id,
        resultado: editForm.resultado,
        descricao: editForm.notas || null,
      }).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("ligacoes").update({
        lead_id: editForm.lead_id === "none" ? null : editForm.lead_id,
        conta_id: editForm.conta_id === "none" ? null : editForm.conta_id,
        data: new Date(editForm.data).toISOString(),
        duracao_seg: Number(editForm.duracao_seg) || 0,
        resultado: editForm.resultado,
        notas: editForm.notas || null,
      }).eq("id", editing.id));
    }
    if (error) return toast.error(error.message);
    toast.success("Ligação atualizada");
    setEditing(null);
    load();
  };

  const quickResult = async (c: any, resultado: string) => {
    const table = c._source === "interacao" ? "interacoes" : "ligacoes";
    const { error } = await supabase.from(table).update({ resultado }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`Resultado: ${resultado}`);
    load();
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm("Excluir esta ligação?")) return;
    const table = editing._source === "interacao" ? "interacoes" : "ligacoes";
    const { error } = await supabase.from(table).delete().eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Ligação excluída");
    setEditing(null);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2"><Phone className="h-7 w-7" /> Ligações</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de chamadas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Registrar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova ligação</DialogTitle></DialogHeader>
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
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data e hora</Label><Input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
                <div><Label>Duração (s)</Label><Input type="number" value={form.duracao_seg} onChange={e => setForm({ ...form, duracao_seg: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={form.resultado} onValueChange={v => setForm({ ...form, resultado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendeu">Atendeu</SelectItem>
                    <SelectItem value="nao_atendeu">Não atendeu</SelectItem>
                    <SelectItem value="caixa_postal">Caixa postal</SelectItem>
                    <SelectItem value="agendou">Agendou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Quando</th><th className="p-3">Vínculo</th><th className="p-3">Duração</th><th className="p-3">Resultado</th><th className="p-3 w-32">Ações</th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => openEdit(c)}>
                <td className="p-3">{format(new Date(c.data), "Pp", { locale: ptBR })}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {c.leads?.id ? (
                    <Link to={`/crm/leads/${c.lead_id}`} className="hover:underline font-medium">{c.leads.nome}</Link>
                  ) : c.conta?.id ? (
                    <Link to={`/crm/contas/${c.conta_id}`} className="hover:underline font-medium">{c.conta.nome}</Link>
                  ) : c.lead_id ? (
                    <span className="text-muted-foreground">Lead removido</span>
                  ) : (
                    <span className="text-muted-foreground">Sem vínculo</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{c.duracao_seg ? `${Math.floor(c.duracao_seg/60)}m ${c.duracao_seg%60}s` : "—"}</td>
                <td className="p-3"><Badge variant="outline">{c.resultado || "—"}</Badge></td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {(c.resultado === "agendada" || c.resultado === "agendou") && (
                    <Button size="sm" variant="outline" onClick={() => quickResult(c, "atendeu")}>Aprovar</Button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma ligação.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar ligação</DialogTitle></DialogHeader>
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
              <div><Label>Data e hora</Label><Input type="datetime-local" value={editForm.data} onChange={e => setEditForm({ ...editForm, data: e.target.value })} /></div>
              <div><Label>Duração (s)</Label><Input type="number" value={editForm.duracao_seg} onChange={e => setEditForm({ ...editForm, duracao_seg: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Resultado</Label>
              <Select value={editForm.resultado} onValueChange={v => setEditForm({ ...editForm, resultado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="atendeu">Atendeu</SelectItem>
                  <SelectItem value="nao_atendeu">Não atendeu</SelectItem>
                  <SelectItem value="caixa_postal">Caixa postal</SelectItem>
                  <SelectItem value="agendou">Agendou</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    </div>
  );
}
