import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListTodo, Plus, Trash2, AlertCircle, Search, Building2, User } from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
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
  lead_id: string | null;
};

type Profile = { user_id: string; nome: string | null };

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

const groupOf = (t: Tarefa): string => {
  if (!t.prazo) return "Sem prazo";
  const d = new Date(t.prazo);
  if (t.status !== "Concluída" && isPast(d) && !isToday(d)) return "Atrasadas";
  if (isToday(d)) return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "Esta semana";
  return "Mais tarde";
};

const GROUP_ORDER = ["Atrasadas", "Hoje", "Amanhã", "Esta semana", "Mais tarde", "Sem prazo"];

export default function Tasks() {
  const { isAdmin, isGestor } = useRole();
  const canFilterByOwner = isAdmin || isGestor;
  const [items, setItems] = useState<Tarefa[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contas, setContas] = useState<Record<string, string>>({});
  const [leads, setLeads] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"pendentes" | "concluidas" | "todas">("pendentes");
  const [prazoFilter, setPrazoFilter] = useState<"todas" | "hoje" | "semana" | "atrasadas" | "futuras">("futuras");
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const [{ data: tarefas }, { data: profs }, { data: cs }, { data: ls }, { data: { user } }] = await Promise.all([
      supabase.from("tarefas").select("*").order("prazo", { ascending: true, nullsFirst: false }),
      supabase.from("profiles").select("user_id, nome").eq("ativo", true).order("nome"),
      supabase.from("contas").select("id, nome"),
      supabase.from("leads").select("id, nome"),
      supabase.auth.getUser(),
    ]);
    setItems((tarefas as Tarefa[]) ?? []);
    setProfiles((profs as Profile[]) ?? []);
    setContas(Object.fromEntries(((cs as any[]) ?? []).map((c) => [c.id, c.nome])));
    setLeads(Object.fromEntries(((ls as any[]) ?? []).map((l) => [l.id, l.nome])));
    setUserId(user?.id ?? null);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("tarefas-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "tarefas" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (statusFilter === "pendentes" && t.status === "Concluída") return false;
      if (statusFilter === "concluidas" && t.status !== "Concluída") return false;

      if (prazoFilter !== "todas") {
        if (!t.prazo) return prazoFilter === "futuras" ? false : false;
        const d = new Date(t.prazo);
        if (prazoFilter === "hoje" && !isToday(d)) return false;
        if (prazoFilter === "semana" && !isThisWeek(d, { weekStartsOn: 1 })) return false;
        if (prazoFilter === "atrasadas" && !(isPast(d) && !isToday(d) && t.status !== "Concluída")) return false;
        if (prazoFilter === "futuras" && d.getTime() < startOfDay(new Date()).getTime()) return false;
      }

      if (responsavelFilter !== "todos" && t.responsavel_id !== responsavelFilter) return false;
      if (busca && !t.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [items, statusFilter, prazoFilter, responsavelFilter, busca]);

  const grouped = useMemo(() => {
    const g: Record<string, Tarefa[]> = {};
    filtered.forEach((t) => {
      const k = groupOf(t);
      (g[k] ||= []).push(t);
    });
    return g;
  }, [filtered]);

  const nomeDe = (uid: string | null) => (uid ? profiles.find((p) => p.user_id === uid)?.nome || "—" : "—");

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

  const nova = () => {
    setForm({
      titulo: "",
      descricao: "",
      prazo: amanha9h(),
      prioridade: "Média",
      responsavel_id: userId || "",
    });
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.titulo?.trim()) return toast.error("Informe um título");
    setSaving(true);
    const { error } = await supabase.from("tarefas").insert({
      titulo: form.titulo.trim(),
      descricao: form.descricao?.trim() || null,
      prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
      prioridade: form.prioridade || "Média",
      status: "A fazer",
      responsavel_id: form.responsavel_id || null,
      created_by: userId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tarefa criada");
    setOpen(false);
    load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <ListTodo className="h-7 w-7 text-primary" /> Tarefas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe tudo que precisa ser feito.</p>
        </div>
        <Button onClick={nova}><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar título…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendentes">Pendentes</SelectItem>
            <SelectItem value="concluidas">Concluídas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prazoFilter} onValueChange={(v: any) => setPrazoFilter(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="futuras">Futuras + hoje</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Esta semana</SelectItem>
            <SelectItem value="atrasadas">Atrasadas</SelectItem>
            <SelectItem value="todas">Todos os prazos</SelectItem>
          </SelectContent>
        </Select>
        {canFilterByOwner && (
          <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos responsáveis</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>{p.nome || "Sem nome"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada com esses filtros.</Card>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter((g) => grouped[g]?.length).map((g) => (
            <div key={g}>
              <h2 className="font-display text-lg font-semibold mb-2">{g} <span className="text-sm text-muted-foreground font-normal">({grouped[g].length})</span></h2>
              <Card>
                <ul>
                  {grouped[g].map((t) => {
                    const atrasada = t.prazo && t.status !== "Concluída" && isPast(new Date(t.prazo)) && !isToday(new Date(t.prazo));
                    return (
                      <li key={t.id} className="flex items-start gap-3 p-4 border-b last:border-b-0">
                        <Checkbox checked={t.status === "Concluída"} onCheckedChange={() => toggle(t)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${t.status === "Concluída" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</span>
                            <Badge variant="outline" className={PRIO_COLOR[t.prioridade] ?? PRIO_COLOR.Média}>{t.prioridade}</Badge>
                            {atrasada && <Badge variant="outline" className="bg-rose-500/15 text-rose-700 border-rose-500/30"><AlertCircle className="h-3 w-3 mr-1" />Atrasada</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {t.prazo && <span>{format(new Date(t.prazo), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</span>}
                            <span>Responsável: {nomeDe(t.responsavel_id)}</span>
                            {t.conta_id && contas[t.conta_id] && (
                              <Link to={`/crm/contas/${t.conta_id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                                <Building2 className="h-3 w-3" />{contas[t.conta_id]}
                              </Link>
                            )}
                            {t.lead_id && leads[t.lead_id] && (
                              <Link to={`/crm/leads/${t.lead_id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                                <User className="h-3 w-3" />{leads[t.lead_id]}
                              </Link>
                            )}
                          </div>
                          {t.descricao && <p className="text-sm mt-2 whitespace-pre-wrap text-muted-foreground">{t.descricao}</p>}
                        </div>
                        {(isAdmin || t.created_by === userId) && (
                          <Button size="sm" variant="ghost" onClick={() => excluir(t.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título*</Label>
              <Input value={form.titulo ?? ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Preparar proposta" />
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
