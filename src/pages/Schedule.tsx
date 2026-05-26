import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Phone, Video, MapPin, Plus, Ban, Sparkles, Trash2, Pencil, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Compromisso = {
  id: string;
  date: Date;
  end?: Date;
  tipo: "ligacao" | "presencial" | "videochamada";
  titulo: string;
  status: string;
  local?: string | null;
  link?: string | null;
  notas?: string | null;
  lead_id?: string | null;
  lead_nome?: string | null;
  criado_por_ia?: boolean;
};

type Bloqueio = {
  id: string;
  inicio: Date;
  fim: Date;
  motivo: string | null;
  dia_inteiro: boolean;
  created_by: string | null;
};

const TIPO_LABEL: Record<Compromisso["tipo"], string> = {
  ligacao: "Ligação",
  presencial: "Presencial",
  videochamada: "Videochamada",
};

const TipoIcon = ({ tipo }: { tipo: Compromisso["tipo"] }) => {
  if (tipo === "ligacao") return <Phone className="h-4 w-4" />;
  if (tipo === "videochamada") return <Video className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
};

export default function Schedule() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [reunioes, setReunioes] = useState<Compromisso[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [imoveisList, setImoveisList] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [openNovo, setOpenNovo] = useState(false);
  const [openBloqueio, setOpenBloqueio] = useState(false);
  const [editing, setEditing] = useState<Compromisso | null>(null);
  const [editForm, setEditForm] = useState<{ when: string; duracao: number; titulo: string; local: string; link: string; notas: string; status: string }>({ when: "", duracao: 60, titulo: "", local: "", link: "", notas: "", status: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [novo, setNovo] = useState({
    tipo: "presencial" as Compromisso["tipo"],
    titulo: "",
    agendada_para: "",
    duracao_min: 60,
    lead_id: "none",
    imovel_id: "none",
    local: "",
    link: "",
    notas: "",
  });

  const [bloq, setBloq] = useState({
    inicio: "",
    fim: "",
    motivo: "",
    dia_inteiro: false,
  });

  const load = async () => {
    const [
      { data: r, error: rErr },
      { data: b },
      { data: l },
      { data: ligs, error: lErr },
      { data: vis, error: vErr },
      { data: capts, error: cErr },
    ] = await Promise.all([
      supabase.from("reunioes")
        .select("id, agendada_para, status, local, link, notas, tipo, duracao_min, titulo, criado_por_ia, lead_id, conta_id")
        .order("agendada_para"),
      supabase.from("agenda_bloqueios" as any).select("*").order("inicio"),
      supabase.from("leads").select("id, nome").order("nome"),
      supabase.from("ligacoes")
        .select("id, data, duracao_seg, resultado, notas, lead_id, conta_id")
        .order("data"),
      supabase.from("visitas")
        .select("id, data_visita, status, observacoes, lead_id, imovel_id, conta_id")
        .order("data_visita"),
      supabase.from("captacoes_imovel")
        .select("id, data_agendada, estagio, observacoes, conta_id, imovel_id, responsavel_id")
        .not("data_agendada", "is", null)
        .order("data_agendada"),
    ]);
    if (rErr) console.error("[Schedule] reunioes", rErr);
    if (lErr) console.error("[Schedule] ligacoes", lErr);
    if (vErr) console.error("[Schedule] visitas", vErr);
    if (cErr) console.error("[Schedule] captacoes", cErr);

    const leadIds = [
      ...new Set([
        ...((r ?? []) as any[]).map((m) => m.lead_id).filter(Boolean),
        ...((ligs ?? []) as any[]).map((c) => c.lead_id).filter(Boolean),
        ...((vis ?? []) as any[]).map((v) => v.lead_id).filter(Boolean),
      ]),
    ];
    const contaIds = [
      ...new Set([
        ...((r ?? []) as any[]).map((m) => m.conta_id).filter(Boolean),
        ...((ligs ?? []) as any[]).map((c) => c.conta_id).filter(Boolean),
        ...((vis ?? []) as any[]).map((v) => v.conta_id).filter(Boolean),
        ...((capts ?? []) as any[]).map((c) => c.conta_id).filter(Boolean),
      ]),
    ];
    const imovelIds = [
      ...new Set([
        ...((vis ?? []) as any[]).map((v) => v.imovel_id).filter(Boolean),
        ...((capts ?? []) as any[]).map((c) => c.imovel_id).filter(Boolean),
      ]),
    ];

    let leadsById = new Map<string, any>();
    if (leadIds.length) {
      const { data: ls } = await supabase.from("leads").select("id, nome").in("id", leadIds);
      leadsById = new Map((ls ?? []).map((x: any) => [x.id, x]));
    }
    let contasById = new Map<string, any>();
    if (contaIds.length) {
      const { data: cs } = await supabase.from("contas").select("id, nome").in("id", contaIds);
      contasById = new Map((cs ?? []).map((x: any) => [x.id, x]));
    }
    let imoveisById = new Map<string, any>();
    if (imovelIds.length) {
      const { data: ims } = await supabase.from("imoveis").select("id, titulo, endereco").in("id", imovelIds);
      imoveisById = new Map((ims ?? []).map((x: any) => [x.id, x]));
    }

    const reus: Compromisso[] = ((r ?? []) as any[]).map((m) => {
      const start = new Date(m.agendada_para);
      const end = new Date(start.getTime() + (m.duracao_min ?? 60) * 60000);
      const leadNome = m.lead_id ? leadsById.get(m.lead_id)?.nome : null;
      const contaNome = m.conta_id ? contasById.get(m.conta_id)?.nome : null;
      return {
        id: m.id,
        date: start,
        end,
        tipo: (m.tipo ?? "presencial") as Compromisso["tipo"],
        titulo: m.titulo || leadNome || contaNome || "Compromisso",
        status: m.status,
        local: m.local,
        link: m.link,
        notas: m.notas,
        lead_id: m.lead_id,
        lead_nome: leadNome,
        criado_por_ia: m.criado_por_ia,
      };
    });
    const ligsAgendadas: Compromisso[] = ((ligs ?? []) as any[])
      .filter((c) => {
        const r = (c.resultado || "").toLowerCase();
        return r === "agendada" || r === "agendado" || r === "agendou";
      })
      .map((c) => {
        const start = new Date(c.data);
        const dur = c.duracao_seg ? Math.round(c.duracao_seg / 60) : 30;
        const leadNome = c.lead_id ? leadsById.get(c.lead_id)?.nome : null;
        const contaNome = c.conta_id ? contasById.get(c.conta_id)?.nome : null;
        const alvo = leadNome || contaNome;
        return {
          id: `lig:${c.id}`,
          date: start,
          end: new Date(start.getTime() + dur * 60000),
          tipo: "ligacao" as const,
          titulo: alvo ? `Ligação com ${alvo}` : "Ligação agendada",
          status: c.resultado || "agendada",
          notas: c.notas,
          lead_id: c.lead_id,
          lead_nome: leadNome,
          criado_por_ia: false,
        };
      });
    const visitasAgendadas: Compromisso[] = ((vis ?? []) as any[]).map((v) => {
      const start = new Date(v.data_visita);
      const leadNome = v.lead_id ? leadsById.get(v.lead_id)?.nome : null;
      const contaNome = v.conta_id ? contasById.get(v.conta_id)?.nome : null;
      const imovel = v.imovel_id ? imoveisById.get(v.imovel_id) : null;
      const alvo = leadNome || contaNome;
      const titulo = imovel?.titulo
        ? `Visita: ${imovel.titulo}${alvo ? ` (${alvo})` : ""}`
        : alvo ? `Visita com ${alvo}` : "Visita";
      return {
        id: `vis:${v.id}`,
        date: start,
        end: new Date(start.getTime() + 60 * 60000),
        tipo: "presencial" as const,
        titulo,
        status: v.status || "Agendada",
        local: imovel?.endereco ?? null,
        link: null,
        notas: v.observacoes,
        lead_id: v.lead_id,
        lead_nome: leadNome,
        criado_por_ia: false,
      };
    });
    const captacoesAgendadas: Compromisso[] = ((capts ?? []) as any[]).map((c) => {
      const start = new Date(c.data_agendada);
      const contaNome = c.conta_id ? contasById.get(c.conta_id)?.nome : null;
      const imovel = c.imovel_id ? imoveisById.get(c.imovel_id) : null;
      const titulo = imovel?.titulo
        ? `Captação: ${imovel.titulo}${contaNome ? ` (${contaNome})` : ""}`
        : contaNome ? `Captação — ${contaNome}` : "Captação";
      return {
        id: `cap:${c.id}`,
        date: start,
        end: new Date(start.getTime() + 60 * 60000),
        tipo: "presencial" as const,
        titulo,
        status: c.estagio || "agendada",
        local: imovel?.endereco ?? null,
        link: null,
        notas: c.observacoes,
        lead_id: null,
        lead_nome: null,
        criado_por_ia: false,
      };
    });
    setReunioes([...reus, ...ligsAgendadas, ...visitasAgendadas, ...captacoesAgendadas].sort((a, b) => +a.date - +b.date));
    setBloqueios(((b ?? []) as any[]).map((x) => ({
      id: x.id,
      inicio: new Date(x.inicio),
      fim: new Date(x.fim),
      motivo: x.motivo,
      dia_inteiro: x.dia_inteiro,
      created_by: x.created_by,
    })));
    setLeads(l ?? []);
    const { data: ims } = await supabase.from("imoveis").select("id, titulo, codigo").order("created_at", { ascending: false });
    setImoveisList((ims ?? []).map((i: any) => ({ id: i.id, nome: i.codigo ? `${i.titulo} · ${i.codigo}` : i.titulo })));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("agenda-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reunioes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ligacoes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "agenda_bloqueios" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "visitas" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "captacoes_imovel" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const allDayDates = useMemo(() => [
    ...reunioes.map((r) => r.date),
    ...bloqueios.map((b) => b.inicio),
  ], [reunioes, bloqueios]);

  const eventosDoDia = useMemo(() => {
    if (!selected) return { compromissos: [] as Compromisso[], bloqueios: [] as Bloqueio[] };
    return {
      compromissos: reunioes.filter((r) => isSameDay(r.date, selected)),
      bloqueios: bloqueios.filter((b) =>
        isSameDay(b.inicio, selected) ||
        isSameDay(b.fim, selected) ||
        (b.inicio < selected && b.fim > selected)
      ),
    };
  }, [reunioes, bloqueios, selected]);

  const checkConflito = (start: Date, end: Date): { conflito: boolean; razao?: string } => {
    for (const b of bloqueios) {
      if (start < b.fim && end > b.inicio) {
        return { conflito: true, razao: `Bloqueio: ${b.motivo || "horário indisponível"}` };
      }
    }
    for (const r of reunioes) {
      const rEnd = r.end ?? new Date(r.date.getTime() + 60 * 60000);
      if (start < rEnd && end > r.date) {
        return { conflito: true, razao: `Conflita com: ${r.titulo} (${TIPO_LABEL[r.tipo]})` };
      }
    }
    return { conflito: false };
  };

  const criarCompromisso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.titulo || !novo.agendada_para) return toast.error("Preencha título e data/hora");
    const start = new Date(novo.agendada_para);
    const end = new Date(start.getTime() + novo.duracao_min * 60000);
    const c = checkConflito(start, end);
    if (c.conflito) return toast.error(c.razao!);

    const { error } = await supabase.from("reunioes").insert({
      agendada_para: start.toISOString(),
      tipo: novo.tipo,
      duracao_min: novo.duracao_min,
      titulo: novo.titulo,
      lead_id: novo.lead_id === "none" ? null : novo.lead_id,
      imovel_id: novo.imovel_id === "none" ? null : novo.imovel_id,
      local: novo.tipo === "presencial" ? novo.local || null : null,
      link: novo.tipo === "videochamada" ? novo.link || null : null,
      notas: novo.notas || null,
      created_by: user?.id,
      corretor_id: user?.id,
      status: "agendada",
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Compromisso criado");
    setNovo({ tipo: "presencial", titulo: "", agendada_para: "", duracao_min: 60, lead_id: "none", imovel_id: "none", local: "", link: "", notas: "" });
    setOpenNovo(false);
    load();
  };

  const criarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloq.inicio || !bloq.fim) return toast.error("Informe início e fim");
    const inicio = new Date(bloq.inicio);
    const fim = new Date(bloq.fim);
    if (fim <= inicio) return toast.error("Fim deve ser posterior ao início");
    const { error } = await supabase.from("agenda_bloqueios" as any).insert({
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      motivo: bloq.motivo || null,
      dia_inteiro: bloq.dia_inteiro,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Bloqueio criado");
    setBloq({ inicio: "", fim: "", motivo: "", dia_inteiro: false });
    setOpenBloqueio(false);
    load();
  };

  const removerBloqueio = async (id: string) => {
    const { error } = await supabase.from("agenda_bloqueios" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Bloqueio removido");
    load();
  };

  const parseId = (id: string): { table: "reunioes" | "ligacoes" | "visitas" | "captacoes_imovel"; realId: string; entity: "reuniao" | "ligacao" | "visita" | "captacao" } => {
    if (id.startsWith("lig:")) return { table: "ligacoes", realId: id.slice(4), entity: "ligacao" };
    if (id.startsWith("vis:")) return { table: "visitas", realId: id.slice(4), entity: "visita" };
    if (id.startsWith("cap:")) return { table: "captacoes_imovel", realId: id.slice(4), entity: "captacao" };
    return { table: "reunioes", realId: id, entity: "reuniao" };
  };

  const toLocalInput = (d: Date) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  };

  const openEdit = (c: Compromisso) => {
    const durMin = c.end ? Math.round((+c.end - +c.date) / 60000) : 60;
    setEditing(c);
    setEditForm({
      when: toLocalInput(c.date),
      duracao: durMin,
      titulo: c.titulo ?? "",
      local: c.local ?? "",
      link: c.link ?? "",
      notas: c.notas ?? "",
      status: c.status ?? "",
    });
  };

  const salvarEdicao = async () => {
    if (!editing) return;
    if (!editForm.when) return toast.error("Informe data e hora");
    setSavingEdit(true);
    const { table, realId, entity } = parseId(editing.id);
    const whenISO = new Date(editForm.when).toISOString();
    let error: any = null;
    if (table === "reunioes") {
      const res = await supabase.from("reunioes").update({
        agendada_para: whenISO,
        duracao_min: Number(editForm.duracao) || 60,
        titulo: editForm.titulo?.trim() || null,
        local: editForm.local?.trim() || null,
        link: editForm.link?.trim() || null,
        notas: editForm.notas?.trim() || null,
        status: editForm.status || "agendada",
      } as any).eq("id", realId);
      error = res.error;
    } else if (table === "ligacoes") {
      const res = await supabase.from("ligacoes").update({
        data: whenISO,
        duracao_seg: (Number(editForm.duracao) || 30) * 60,
        notas: editForm.notas?.trim() || null,
        resultado: editForm.status || "agendada",
      } as any).eq("id", realId);
      error = res.error;
    } else if (table === "visitas") {
      const res = await supabase.from("visitas").update({
        data_visita: whenISO,
        observacoes: editForm.notas?.trim() || null,
        status: editForm.status || "Agendada",
      } as any).eq("id", realId);
      error = res.error;
    } else if (table === "captacoes_imovel") {
      const res = await supabase.from("captacoes_imovel").update({
        data_agendada: whenISO,
        observacoes: editForm.notas?.trim() || null,
        estagio: editForm.status || "agendada",
      } as any).eq("id", realId);
      error = res.error;
    }
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Compromisso atualizado");
    supabase.functions.invoke("gcal-push", {
      body: { entity_type: entity, entity_id: realId, action: "update" },
    }).catch(() => {});
    setEditing(null);
    load();
  };


  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-7 w-7" /> Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhada com a equipe • integrada ao WhatsApp e à captação automática com IA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={openBloqueio} onOpenChange={setOpenBloqueio}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Ban className="h-4 w-4 mr-1" />Bloquear horário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bloquear horário</DialogTitle></DialogHeader>
              <form onSubmit={criarBloqueio} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input type="datetime-local" value={bloq.inicio} onChange={(e) => setBloq({ ...bloq, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input type="datetime-local" value={bloq.fim} onChange={(e) => setBloq({ ...bloq, fim: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input placeholder="Folga, almoço, feriado..." value={bloq.motivo} onChange={(e) => setBloq({ ...bloq, motivo: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenBloqueio(false)}>Cancelar</Button>
                  <Button type="submit">Bloquear</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo compromisso</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo compromisso</DialogTitle></DialogHeader>
              <form onSubmit={criarCompromisso} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v as Compromisso["tipo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">📞 Ligação</SelectItem>
                        <SelectItem value="presencial">📍 Presencial</SelectItem>
                        <SelectItem value="videochamada">🎥 Videochamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input type="number" min={15} step={15} value={novo.duracao_min} onChange={(e) => setNovo({ ...novo, duracao_min: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Ex.: Visita ao apartamento Centro" />
                </div>
                <div>
                  <Label>Data e hora</Label>
                  <Input type="datetime-local" value={novo.agendada_para} onChange={(e) => setNovo({ ...novo, agendada_para: e.target.value })} />
                </div>
                <div>
                  <Label>Lead vinculado</Label>
                  <Select value={novo.lead_id} onValueChange={(v) => setNovo({ ...novo, lead_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem lead vinculado</SelectItem>
                      {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Imóvel visitado</Label>
                  <Select value={novo.imovel_id} onValueChange={(v) => setNovo({ ...novo, imovel_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem imóvel vinculado</SelectItem>
                      {imoveisList.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {novo.tipo === "presencial" && (
                  <div>
                    <Label>Local</Label>
                    <Input value={novo.local} onChange={(e) => setNovo({ ...novo, local: e.target.value })} placeholder="Endereço" />
                  </div>
                )}
                {novo.tipo === "videochamada" && (
                  <div>
                    <Label>Link da chamada</Label>
                    <Input value={novo.link} onChange={(e) => setNovo({ ...novo, link: e.target.value })} placeholder="Google Meet, Zoom..." />
                  </div>
                )}
                <div>
                  <Label>Notas</Label>
                  <Textarea value={novo.notas} onChange={(e) => setNovo({ ...novo, notas: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
                  <Button type="submit">Agendar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-4 md:p-6">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={ptBR}
            numberOfMonths={typeof window !== "undefined" && window.innerWidth >= 1024 ? 2 : 1}
            modifiers={{
              hasEvent: reunioes.map((r) => r.date),
              blocked: bloqueios.flatMap((b) => {
                const days: Date[] = [];
                const cur = new Date(b.inicio); cur.setHours(0,0,0,0);
                const end = new Date(b.fim);
                while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
                return days;
              }),
            }}
            modifiersClassNames={{
              hasEvent: "relative font-semibold text-primary after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary",
              blocked: "line-through opacity-60 bg-destructive/10",
            }}
            className={cn("pointer-events-auto w-full")}
            classNames={{
              months: "flex flex-col lg:flex-row gap-8 w-full justify-center",
              month: "space-y-4 flex-1",
              caption_label: "text-base font-medium capitalize",
              table: "w-full border-collapse",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm py-2",
              head_row: "flex w-full",
              row: "flex w-full mt-2",
              cell: "flex-1 h-14 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent/40 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-14 w-full p-0 font-normal text-base hover:bg-accent rounded-md aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
            }}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 md:p-6 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Dia selecionado</h3>
              <div className="text-sm text-muted-foreground capitalize">
                {selected ? format(selected, "PPPP", { locale: ptBR }) : "Selecione um dia"}
              </div>
            </div>

            {eventosDoDia.bloqueios.length > 0 && (
              <div className="space-y-2 mb-3">
                {eventosDoDia.bloqueios.map((b) => (
                  <div key={b.id} className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2"><Ban className="h-4 w-4" />{b.motivo || "Indisponível"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {format(b.inicio, "Pp", { locale: ptBR })} → {format(b.fim, "Pp", { locale: ptBR })}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" onClick={() => removerBloqueio(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {eventosDoDia.compromissos.length === 0 && eventosDoDia.bloqueios.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md">
                Nada agendado neste dia.
              </div>
            )}

            <ul className="space-y-2">
              {eventosDoDia.compromissos
                .sort((a, b) => +a.date - +b.date)
                .map((c) => (
                  <li key={c.id} className="rounded-md border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <TipoIcon tipo={c.tipo} />
                          {format(c.date, "HH:mm", { locale: ptBR })} — {c.titulo}
                          {c.criado_por_ia && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" /> IA
                            </Badge>
                          )}
                        </div>
                        {c.lead_nome && <div className="text-xs text-muted-foreground mt-0.5">Lead: {c.lead_id ? <Link to={`/crm/leads/${c.lead_id}`} className="text-primary hover:underline">{c.lead_nome}</Link> : c.lead_nome}</div>}
                        {(c.local || c.link) && <div className="text-xs text-muted-foreground mt-0.5">{c.local || c.link}</div>}
                        {c.notas && <div className="text-xs text-muted-foreground mt-1">{c.notas}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline">{c.status}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </Card>

          <Card className="p-4 md:p-6 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Próximos compromissos</h3>
              <div className="text-sm text-muted-foreground">Agendamentos futuros</div>
            </div>
            <div className="space-y-2 max-h-[36rem] overflow-auto">
              {reunioes.filter((r) => r.date >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum compromisso futuro.</p>
              )}
              {reunioes
                .filter((r) => r.date >= new Date())
                .map((c) => (
                  <div key={c.id} className="rounded-md border p-3 text-sm flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <TipoIcon tipo={c.tipo} />
                        {format(c.date, "Pp", { locale: ptBR })} — {c.titulo}
                        {c.criado_por_ia && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />IA</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {TIPO_LABEL[c.tipo]} · {c.lead_id && c.lead_nome ? <Link to={`/crm/leads/${c.lead_id}`} className="text-primary hover:underline">{c.lead_nome}</Link> : (c.lead_nome || "sem lead")}{c.local || c.link ? ` · ${c.local || c.link}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline">{c.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        {bloqueios.length > 0 && (
          <Card className="p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Bloqueios cadastrados ({bloqueios.length})</h3>
            </div>
            <div className="space-y-2">
              {bloqueios.map((b) => (
                <div key={b.id} className="rounded-md border p-3 text-sm flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Ban className="h-4 w-4" />{b.motivo || "Indisponível"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(b.inicio, "Pp", { locale: ptBR })} → {format(b.fim, "Pp", { locale: ptBR })}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" onClick={() => removerBloqueio(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar compromisso</DialogTitle></DialogHeader>
          {editing && (() => {
            const { entity } = parseId(editing.id);
            const showDuracao = entity === "reuniao" || entity === "ligacao";
            const showLocalLink = entity === "reuniao";
            const showTitulo = entity === "reuniao";
            const statusOptions =
              entity === "captacao"
                ? ["novo", "agendada", "em_andamento", "concluido", "cancelada"]
                : entity === "visita"
                ? ["Agendada", "Realizada", "Cancelada", "Remarcada"]
                : entity === "ligacao"
                ? ["agendada", "realizada", "nao_atendeu", "cancelada"]
                : ["agendada", "realizada", "cancelada", "remarcada"];
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Data e hora</Label>
                    <Input type="datetime-local" value={editForm.when} onChange={(e) => setEditForm({ ...editForm, when: e.target.value })} />
                  </div>
                  {showDuracao && (
                    <div>
                      <Label>Duração (min)</Label>
                      <Input type="number" min={5} step={5} value={editForm.duracao} onChange={(e) => setEditForm({ ...editForm, duracao: Number(e.target.value) })} />
                    </div>
                  )}
                </div>
                {showTitulo && (
                  <div>
                    <Label>Título</Label>
                    <Input value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} />
                  </div>
                )}
                {showLocalLink && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Local</Label><Input value={editForm.local} onChange={(e) => setEditForm({ ...editForm, local: e.target.value })} /></div>
                    <div><Label>Link</Label><Input value={editForm.link} onChange={(e) => setEditForm({ ...editForm, link: e.target.value })} /></div>
                  </div>
                )}
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{entity === "visita" || entity === "captacao" ? "Observações" : "Notas"}</Label>
                  <Textarea rows={3} value={editForm.notas} onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })} />
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={savingEdit}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
