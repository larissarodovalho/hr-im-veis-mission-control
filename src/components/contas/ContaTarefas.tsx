import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListTodo, Plus, Trash2, AlertCircle, Pencil } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: string;
  status: string;
  responsavel_id: string | null;
  created_by: string | null;
  conta_id: string | null;
};

const PRIO_COLOR: Record<string, string> = {
  Alta: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  Média: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Baixa: "bg-slate-500/15 text-slate-700 border-slate-500/30",
};

const amanha9h = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

interface Props {
  contaId: string;
  responsavelId?: string | null;
}

export default function ContaTarefas({ contaId, responsavelId }: Props) {
  const { isAdmin } = useRole();
  const [items, setItems] = useState<Tarefa[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; nome: string | null }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const [{ data }, { data: profs }, { data: { user } }] = await Promise.all([
      supabase.from("tarefas").select("*").eq("conta_id", contaId).order("prazo", { ascending: true, nullsFirst: false }),
      supabase.from("profiles").select("user_id, nome").eq("ativo", true).order("nome"),
      supabase.auth.getUser(),
    ]);
    setItems((data as Tarefa[]) ?? []);
    setProfiles((profs as any) ?? []);
    setUserId(user?.id ?? null);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`tarefas-conta-${contaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tarefas", filter: `conta_id=eq.${contaId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId]);

  const novaTarefa = () => {
    setEditingId(null);
    setForm({
      titulo: "",
      descricao: "",
      prazo: amanha9h(),
      prioridade: "Média",
      responsavel_id: responsavelId || userId || "",
    });
    setOpen(true);
  };

  const editar = (t: Tarefa) => {
    setEditingId(t.id);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      prazo: t.prazo ? new Date(new Date(t.prazo).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
      prioridade: t.prioridade,
      responsavel_id: t.responsavel_id ?? "",
    });
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.titulo?.trim()) return toast.error("Informe um título");
    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao?.trim() || null,
      prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
      prioridade: form.prioridade || "Média",
      responsavel_id: form.responsavel_id || null,
    };
    const { error } = editingId
      ? await supabase.from("tarefas").update(payload).eq("id", editingId)
      : await supabase.from("tarefas").insert({ ...payload, conta_id: contaId, status: "A fazer", created_by: userId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Tarefa atualizada" : "Tarefa criada");
    setOpen(false);
    setEditingId(null);
    load();
  };

  const toggle = async (t: Tarefa) => {
    const novo = t.status === "Concluída" ? "A fazer" : "Concluída";
    const { error } = await supabase.from("tarefas").update({ status: novo }).eq("id", t.id);
    if (error) return toast.error(error.message);
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta tarefa?")) return;
    const { error } = await supabase.from("tarefas").delete().eq("id", id);
    if (error) return toast.error(error.message);
  };

  const pendentes = items.filter((t) => t.status !== "Concluída");
  const concluidas = items.filter((t) => t.status === "Concluída");
  const nomeDe = (uid: string | null) => (uid ? profiles.find((p) => p.user_id === uid)?.nome || "—" : "—");

  const renderItem = (t: Tarefa) => {
    const atrasada = t.prazo && t.status !== "Concluída" && isPast(new Date(t.prazo));
    return (
      <li key={t.id} className="flex items-start gap-3 py-3 border-b last:border-b-0">
        <Checkbox checked={t.status === "Concluída"} onCheckedChange={() => toggle(t)} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${t.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</span>
            <Badge variant="outline" className={PRIO_COLOR[t.prioridade] ?? PRIO_COLOR.Média}>{t.prioridade}</Badge>
            {atrasada && <Badge variant="outline" className="bg-rose-500/15 text-rose-700 border-rose-500/30"><AlertCircle className="h-3 w-3 mr-1" />Atrasada</Badge>}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
            {t.prazo && <span>{format(new Date(t.prazo), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>}
            <span>Responsável: {nomeDe(t.responsavel_id)}</span>
          </div>
          {t.descricao && <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{t.descricao}</p>}
        </div>
        {(isAdmin || t.created_by === userId) && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => editar(t)}><Pencil className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => excluir(t.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <ListTodo className="h-5 w-5" /> Tarefas
        </h3>
        <Button size="sm" onClick={novaTarefa}><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa ainda.</p>
      ) : (
        <>
          {pendentes.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Pendentes</p>
              <ul>{pendentes.map(renderItem)}</ul>
            </div>
          )}
          {concluidas.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs uppercase tracking-wide text-muted-foreground cursor-pointer">
                Concluídas ({concluidas.length})
              </summary>
              <ul>{concluidas.map(renderItem)}</ul>
            </details>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título*</Label>
              <Input value={form.titulo ?? ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Ligar para confirmar visita" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo</Label>
                <Input type="datetime-local" value={form.prazo ?? ""} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade || "Média"} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id || ""} onValueChange={(v) => setForm({ ...form, responsavel_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.nome || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Criar tarefa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
