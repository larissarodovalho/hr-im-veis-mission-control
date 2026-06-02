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
import { Calendar as CalendarIcon, Phone, Video, MapPin, MessageCircle, Plus, Ban, Sparkles, Trash2, Pencil, Save, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { SearchableSelect } from "@/components/SearchableSelect";

type Compromisso = {
  id: string;
  date: Date;
  end?: Date;
  tipo: "ligacao" | "presencial" | "videochamada" | "mensagem";
  titulo: string;
  status: string;
  local?: string | null;
  link?: string | null;
  notas?: string | null;
  lead_id?: string | null;
  lead_nome?: string | null;
  lead_telefone?: string | null;
  lead_email?: string | null;
  conta_id?: string | null;
  conta_nome?: string | null;
  origem?: "captacao";
  criado_por_ia?: boolean;
  criado_por_id?: string | null;
  criado_por_nome?: string | null;
  recorrencia_id?: string | null;
  recorrencia_regra?: string | null;
};


type RecorrenciaRegra = "nenhuma" | "diaria_util" | "semanal" | "quinzenal" | "mensal";

const RECORRENCIA_LABEL: Record<Exclude<RecorrenciaRegra, "nenhuma">, string> = {
  diaria_util: "Diariamente (seg–sex)",
  semanal: "Semanalmente",
  quinzenal: "Quinzenalmente",
  mensal: "Mensalmente",
};

function gerarOcorrencias(inicio: Date, regra: RecorrenciaRegra, ate: Date, maxN = 60): Date[] {
  if (regra === "nenhuma") return [inicio];
  const out: Date[] = [];
  let cursor = new Date(inicio);
  while (cursor <= ate && out.length < maxN) {
    if (regra === "diaria_util") {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) out.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    } else if (regra === "semanal") {
      out.push(new Date(cursor));
      cursor = addDays(cursor, 7);
    } else if (regra === "quinzenal") {
      out.push(new Date(cursor));
      cursor = addDays(cursor, 14);
    } else if (regra === "mensal") {
      out.push(new Date(cursor));
      cursor = addMonths(cursor, 1);
    }
  }
  return out;
}

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
  mensagem: "Mensagem",
};

const TipoIcon = ({ tipo }: { tipo: Compromisso["tipo"] }) => {
  if (tipo === "ligacao") return <Phone className="h-4 w-4" />;
  if (tipo === "videochamada") return <Video className="h-4 w-4" />;
  if (tipo === "mensagem") return <MessageCircle className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
};

// Paleta determinística por usuário criador (cor estável por user_id)
const USER_HUES = [12, 32, 56, 92, 142, 172, 200, 222, 258, 288, 318, 348];
function hashUserId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function colorForUser(id?: string | null): { solid: string; soft: string } | null {
  if (!id) return null;
  const hue = USER_HUES[hashUserId(id) % USER_HUES.length];
  return {
    solid: `hsl(${hue} 70% 45%)`,
    soft: `hsl(${hue} 70% 45% / 0.12)`,
  };
}

export default function Schedule() {
  const { user, roles } = useAuth();
  const { isAdmin } = useRole();
  const canManage = roles.some((r) => r === "admin" || r === "gestor" || r === "corretor" || r === "secretaria");
  const [reunioes, setReunioes] = useState<Compromisso[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contasList, setContasList] = useState<any[]>([]);
  const [imoveisList, setImoveisList] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
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
    conta_id: "none",
    imovel_id: "none",
    local: "",
    link: "",
    notas: "",
    recorrencia: "nenhuma" as RecorrenciaRegra,
    recorrencia_ate: "",
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
        .select("id, agendada_para, status, local, link, notas, tipo, duracao_min, titulo, criado_por_ia, lead_id, conta_id, recorrencia_id, recorrencia_regra, created_by")
        .order("agendada_para"),
      supabase.from("agenda_bloqueios" as any).select("*").order("inicio"),
      supabase.from("leads").select("id, nome").order("nome"),
      supabase.from("ligacoes")
        .select("id, data, duracao_seg, resultado, notas, lead_id, conta_id, created_by")
        .order("data"),
      supabase.from("visitas")
        .select("id, data_visita, status, observacoes, lead_id, imovel_id, conta_id, created_by")
        .order("data_visita"),
      supabase.from("captacoes_imovel")
        .select("id, data_agendada, estagio, observacoes, conta_id, imovel_id, responsavel_id, created_by")
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
      const { data: ls } = await supabase.from("leads").select("id, nome, telefone, email").in("id", leadIds);
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

    const criadorIds = [
      ...new Set([
        ...((r ?? []) as any[]).map((m) => m.created_by).filter(Boolean),
        ...((ligs ?? []) as any[]).map((c) => c.created_by).filter(Boolean),
        ...((vis ?? []) as any[]).map((v) => v.created_by).filter(Boolean),
        ...((capts ?? []) as any[]).map((c) => c.created_by).filter(Boolean),
      ]),
    ];
    let criadoresById = new Map<string, string>();
    if (criadorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, nome").in("user_id", criadorIds);
      criadoresById = new Map((profs ?? []).map((p: any) => [p.user_id, p.nome]));
    }

    const reus: Compromisso[] = ((r ?? []) as any[]).map((m) => {
      const start = new Date(m.agendada_para);
      const end = new Date(start.getTime() + (m.duracao_min ?? 60) * 60000);
      const lead = m.lead_id ? leadsById.get(m.lead_id) : null;
      const leadNome = lead?.nome ?? null;
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
        lead_telefone: lead?.telefone ?? null,
        lead_email: lead?.email ?? null,
        conta_id: m.conta_id ?? null,
        conta_nome: contaNome ?? null,
        criado_por_ia: m.criado_por_ia,
        criado_por_id: m.created_by ?? null,
        criado_por_nome: m.created_by ? criadoresById.get(m.created_by) ?? null : null,

        recorrencia_id: m.recorrencia_id ?? null,
        recorrencia_regra: m.recorrencia_regra ?? null,
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
        const lead = c.lead_id ? leadsById.get(c.lead_id) : null;
        const leadNome = lead?.nome ?? null;
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
          lead_telefone: lead?.telefone ?? null,
          lead_email: lead?.email ?? null,
          conta_id: c.conta_id ?? null,
          conta_nome: contaNome ?? null,
          criado_por_ia: false,
          criado_por_id: c.created_by ?? null,
          criado_por_nome: c.created_by ? criadoresById.get(c.created_by) ?? null : null,

        };
      });
    const visitasAgendadas: Compromisso[] = ((vis ?? []) as any[]).map((v) => {
      const start = new Date(v.data_visita);
      const lead = v.lead_id ? leadsById.get(v.lead_id) : null;
      const leadNome = lead?.nome ?? null;
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
        lead_telefone: lead?.telefone ?? null,
        lead_email: lead?.email ?? null,
        conta_id: v.conta_id ?? null,
        conta_nome: contaNome ?? null,
        criado_por_ia: false,
        criado_por_id: v.created_by ?? null,
        criado_por_nome: v.created_by ? criadoresById.get(v.created_by) ?? null : null,

      };
    });
    const captacoesAgendadas: Compromisso[] = ((capts ?? []) as any[]).map((c) => {
      const start = new Date(c.data_agendada);
      const contaNome = c.conta_id ? contasById.get(c.conta_id)?.nome : null;
      const imovel = c.imovel_id ? imoveisById.get(c.imovel_id) : null;
      const base = imovel?.titulo ? `Captação – ${imovel.titulo}` : "Captação";
      const titulo = contaNome ? `${base} · ${contaNome}` : base;
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
        conta_id: c.conta_id ?? null,
        conta_nome: contaNome ?? null,
        origem: "captacao",
        criado_por_ia: false,
        criado_por_id: c.created_by ?? null,
        criado_por_nome: c.created_by ? criadoresById.get(c.created_by) ?? null : null,

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
    const { data: ctsAll } = await supabase.from("contas").select("id, nome").order("nome");
    setContasList(ctsAll ?? []);
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

    // Calcular ocorrências (única ou recorrente)
    let datas: Date[] = [start];
    if (novo.recorrencia !== "nenhuma") {
      if (!novo.recorrencia_ate) return toast.error("Informe a data final da repetição");
      const ate = new Date(novo.recorrencia_ate + "T23:59:59");
      if (ate < start) return toast.error("A data final deve ser posterior à inicial");
      datas = gerarOcorrencias(start, novo.recorrencia, ate);
      if (datas.length === 0) return toast.error("Nenhuma ocorrência gerada no intervalo");
    }

    // Conflitos
    const conflitos: string[] = [];
    for (const d of datas) {
      const e2 = new Date(d.getTime() + novo.duracao_min * 60000);
      const c = checkConflito(d, e2);
      if (c.conflito) conflitos.push(`${format(d, "dd/MM HH:mm", { locale: ptBR })} — ${c.razao}`);
    }
    if (conflitos.length === datas.length) return toast.error("Todas as ocorrências conflitam: " + conflitos[0]);
    const datasOk = datas.filter((d) => {
      const e2 = new Date(d.getTime() + novo.duracao_min * 60000);
      return !checkConflito(d, e2).conflito;
    });

    const recorrenciaId = novo.recorrencia !== "nenhuma" ? crypto.randomUUID() : null;
    const rows = datasOk.map((d) => ({
      agendada_para: d.toISOString(),
      tipo: novo.tipo,
      duracao_min: novo.duracao_min,
      titulo: novo.titulo,
      lead_id: novo.lead_id === "none" ? null : novo.lead_id,
      conta_id: novo.conta_id === "none" ? null : novo.conta_id,
      imovel_id: novo.imovel_id === "none" ? null : novo.imovel_id,
      local: novo.tipo === "presencial" ? novo.local || null : null,
      link: novo.tipo === "videochamada" ? novo.link || null : null,
      notas: novo.notas || null,
      created_by: user?.id,
      corretor_id: user?.id,
      status: "agendada",
      recorrencia_id: recorrenciaId,
      recorrencia_regra: novo.recorrencia !== "nenhuma" ? novo.recorrencia : null,
    }));

    const { data: inserted, error } = await supabase.from("reunioes").insert(rows as any).select("id");
    if (error) return toast.error(error.message);

    // Push para Google Calendar (pessoal + compartilhada). Silencioso se falhar.
    for (const row of inserted ?? []) {
      supabase.functions.invoke("gcal-push", {
        body: { entity_type: "reuniao", entity_id: (row as any).id, action: "create" },
      }).catch(() => {});
    }

    if (conflitos.length > 0) {
      toast.success(`${rows.length} criado(s). ${conflitos.length} pulado(s) por conflito.`);
    } else if (rows.length > 1) {
      toast.success(`${rows.length} compromissos criados`);
    } else {
      toast.success("Compromisso criado");
    }
    setNovo({ tipo: "presencial", titulo: "", agendada_para: "", duracao_min: 60, lead_id: "none", conta_id: "none", imovel_id: "none", local: "", link: "", notas: "", recorrencia: "nenhuma", recorrencia_ate: "" });
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

  const marcarConcluido = async (c: Compromisso) => {
    const { table, realId, entity } = parseId(c.id);
    let res;
    if (table === "reunioes") res = await supabase.from("reunioes").update({ status: "realizada" } as any).eq("id", realId);
    else if (table === "ligacoes") res = await supabase.from("ligacoes").update({ resultado: "realizada" } as any).eq("id", realId);
    else if (table === "visitas") res = await supabase.from("visitas").update({ status: "Realizada" } as any).eq("id", realId);
    else res = await supabase.from("captacoes_imovel").update({ estagio: "concluido" } as any).eq("id", realId);
    if (res?.error) return toast.error(res.error.message);
    toast.success("Marcado como concluído");
    supabase.functions.invoke("gcal-push", { body: { entity_type: entity, entity_id: realId, action: "update" } }).catch(() => {});
    load();
  };

  const excluirCompromisso = async () => {
    if (!editing) return;
    const { table, realId, entity } = parseId(editing.id);
    const isRecorrente = !!editing.recorrencia_id;
    const msg = isRecorrente
      ? "Este é um compromisso recorrente. Excluir apenas esta ocorrência?\n\nClique em OK para excluir SÓ esta ocorrência, ou Cancelar para abortar."
      : "Excluir este compromisso? Esta ação não pode ser desfeita.";
    if (!window.confirm(msg)) return;
    setSavingEdit(true);
    const { error } = await supabase.from(table).delete().eq("id", realId);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Compromisso excluído");
    supabase.functions.invoke("gcal-push", {
      body: { entity_type: entity, entity_id: realId, action: "delete" },
    }).catch(() => {});
    setEditing(null);
    load();
  };

  const excluirSerie = async () => {
    if (!editing?.recorrencia_id) return;
    if (!window.confirm("Excluir TODAS as ocorrências desta série? Esta ação não pode ser desfeita.")) return;
    setSavingEdit(true);
    const { error } = await supabase.from("reunioes").delete().eq("recorrencia_id", editing.recorrencia_id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Série excluída");
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
        {canManage && (
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo compromisso</DialogTitle></DialogHeader>
              <form onSubmit={criarCompromisso} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v as Compromisso["tipo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">📞 Ligação</SelectItem>
                        <SelectItem value="mensagem">💬 Mensagem</SelectItem>
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
                  <SearchableSelect
                    value={novo.lead_id}
                    onChange={(v) => setNovo({ ...novo, lead_id: v })}
                    options={leads.map((l: any) => ({ id: l.id, nome: l.nome }))}
                    placeholder="Buscar lead..."
                    emptyLabel="Sem lead vinculado"
                  />
                </div>
                <div>
                  <Label>Conta (cliente) vinculada</Label>
                  <SearchableSelect
                    value={novo.conta_id}
                    onChange={(v) => setNovo({ ...novo, conta_id: v })}
                    options={contasList.map((c: any) => ({ id: c.id, nome: c.nome }))}
                    placeholder="Buscar conta..."
                    emptyLabel="Sem conta vinculada"
                  />
                </div>
                <div>
                  <Label>Imóvel visitado</Label>
                  <SearchableSelect
                    value={novo.imovel_id}
                    onChange={(v) => setNovo({ ...novo, imovel_id: v })}
                    options={imoveisList.map((i: any) => ({ id: i.id, nome: i.nome }))}
                    placeholder="Buscar imóvel..."
                    emptyLabel="Sem imóvel vinculado"
                  />
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

                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <div className="text-sm font-medium">Repetição</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Frequência</Label>
                      <Select
                        value={novo.recorrencia}
                        onValueChange={(v) => {
                          const reg = v as RecorrenciaRegra;
                          let ate = novo.recorrencia_ate;
                          if (reg !== "nenhuma" && !ate && novo.agendada_para) {
                            ate = addMonths(new Date(novo.agendada_para), 3).toISOString().slice(0, 10);
                          }
                          setNovo({ ...novo, recorrencia: reg, recorrencia_ate: ate });
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhuma">Não repete</SelectItem>
                          <SelectItem value="diaria_util">Diariamente (seg–sex) — fixo</SelectItem>
                          <SelectItem value="semanal">Semanalmente</SelectItem>
                          <SelectItem value="quinzenal">Quinzenalmente</SelectItem>
                          <SelectItem value="mensal">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {novo.recorrencia !== "nenhuma" && (
                      <div>
                        <Label>Termina em</Label>
                        <Input
                          type="date"
                          value={novo.recorrencia_ate}
                          onChange={(e) => setNovo({ ...novo, recorrencia_ate: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  {novo.recorrencia !== "nenhuma" && novo.agendada_para && novo.recorrencia_ate && (() => {
                    const start = new Date(novo.agendada_para);
                    const ate = new Date(novo.recorrencia_ate + "T23:59:59");
                    if (Number.isNaN(+start) || Number.isNaN(+ate) || ate < start) return null;
                    const n = gerarOcorrencias(start, novo.recorrencia, ate).length;
                    return (
                      <p className="text-xs text-muted-foreground">
                        {RECORRENCIA_LABEL[novo.recorrencia as Exclude<RecorrenciaRegra, "nenhuma">]} • {n} compromisso{n !== 1 ? "s" : ""} ser{n !== 1 ? "ão" : "á"} criado{n !== 1 ? "s" : ""} (máx. 60).
                      </p>
                    );
                  })()}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
                  <Button type="submit">Agendar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        )}
      </div>

      <div className="space-y-6">
        <Card className="p-4 md:p-6">
          {(() => {
            const anchor = viewMode === "week" ? (selected ?? currentMonth) : currentMonth;
            const gridStart = viewMode === "week"
              ? startOfWeek(anchor, { locale: ptBR })
              : startOfWeek(startOfMonth(currentMonth), { locale: ptBR });
            const gridEnd = viewMode === "week"
              ? endOfWeek(anchor, { locale: ptBR })
              : endOfWeek(endOfMonth(currentMonth), { locale: ptBR });

            const days: Date[] = [];
            for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

            const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
            const eventsByDay = new Map<string, Compromisso[]>();
            reunioes.forEach((r) => {
              const k = dayKey(r.date);
              const arr = eventsByDay.get(k) ?? [];
              arr.push(r);
              eventsByDay.set(k, arr);
            });

            const blockedDays = new Set<string>();
            bloqueios.forEach((b) => {
              const cur = new Date(b.inicio); cur.setHours(0,0,0,0);
              const end = new Date(b.fim);
              while (cur <= end) { blockedDays.add(dayKey(cur)); cur.setDate(cur.getDate()+1); }
            });

            const tipoChip: Record<Compromisso["tipo"], string> = {
              ligacao: "bg-warning/15 text-warning border-l-2 border-warning",
              presencial: "bg-success/15 text-success border-l-2 border-success",
              videochamada: "bg-accent/20 text-accent-foreground border-l-2 border-accent",
              mensagem: "bg-primary/15 text-primary border-l-2 border-primary",
            };
            const weekDays = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

            const headerLabel = viewMode === "week"
              ? `${format(gridStart, "d 'de' MMM", { locale: ptBR })} – ${format(gridEnd, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
              : format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

            const goPrev = () => {
              if (viewMode === "week") {
                const next = addDays(anchor, -7);
                setSelected(next);
                setCurrentMonth(next);
              } else {
                setCurrentMonth(subMonths(currentMonth, 1));
              }
            };
            const goNext = () => {
              if (viewMode === "week") {
                const next = addDays(anchor, 7);
                setSelected(next);
                setCurrentMonth(next);
              } else {
                setCurrentMonth(addMonths(currentMonth, 1));
              }
            };

            return (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg md:text-2xl font-light capitalize">{headerLabel}</h2>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md border border-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode("month")}
                        className={cn("px-3 py-1.5 text-sm transition-colors", viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent/30")}
                      >
                        Mês
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("week")}
                        className={cn("px-3 py-1.5 text-sm transition-colors border-l border-border", viewMode === "week" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent/30")}
                      >
                        Semana
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={goPrev}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { const t = new Date(); setCurrentMonth(t); setSelected(t); }}>
                        Hoje
                      </Button>
                      <Button variant="ghost" size="icon" onClick={goNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const seen = new Map<string, string>();
                  days.forEach((d) => {
                    (eventsByDay.get(dayKey(d)) ?? []).forEach((c) => {
                      if (c.criado_por_id && c.criado_por_nome && !seen.has(c.criado_por_id)) {
                        seen.set(c.criado_por_id, c.criado_por_nome);
                      }
                    });
                  });
                  if (seen.size === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs text-muted-foreground">
                      <span className="font-medium">Criado por:</span>
                      {Array.from(seen.entries()).map(([uid, nome]) => {
                        const col = colorForUser(uid);
                        return (
                          <span key={uid} className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ background: col?.solid }}
                              aria-hidden
                            />
                            <span className="text-foreground/80">{nome}</span>
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}




                {viewMode === "week" ? (
                  (() => {
                    const HOUR_START = 7;
                    const HOUR_END = 19; // exclusive (mostra até 18h)
                    const HOUR_PX = 56;
                    const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
                    const now = new Date();
                    const nowOffset = (now.getHours() + now.getMinutes() / 60 - HOUR_START) * HOUR_PX;
                    const totalHeight = (HOUR_END - HOUR_START) * HOUR_PX;

                    return (
                      <div className="border border-border rounded-lg overflow-x-auto shadow-sm bg-card">
                       <div className="min-w-[720px]">
                        {/* Header */}
                        <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                          <div />
                          {days.map((d) => {
                            const today = isToday(d);
                            const isSelected = selected && isSameDay(d, selected);
                            return (
                              <button
                                key={dayKey(d)}
                                type="button"
                                onClick={() => setSelected(d)}
                                className={cn(
                                  "py-2 px-1 min-w-0 text-center border-l border-border hover:bg-accent/20 transition-colors flex items-center justify-center gap-1.5",
                                  isSelected && "bg-primary/5",
                                )}
                              >
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{format(d, "EEE", { locale: ptBR })}</span>
                                <span className={cn(
                                  "text-xs font-semibold h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-full",
                                  today && "bg-destructive text-destructive-foreground",
                                )}>
                                  {format(d, "d")}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* All-day / blocked row */}
                        {days.some((d) => blockedDays.has(dayKey(d))) && (
                          <div className="grid border-b border-border" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}>
                            <div className="text-[10px] uppercase text-muted-foreground py-1.5 pr-2 text-right">dia inteiro</div>
                            {days.map((d) => (
                              <div key={dayKey(d) + "-all"} className={cn("border-l border-border min-h-[28px] py-1 px-1", blockedDays.has(dayKey(d)) && "bg-destructive/10")}>
                                {blockedDays.has(dayKey(d)) && (
                                  <div className="text-[11px] text-destructive font-medium px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                                    <Ban className="h-3 w-3" /> Bloqueio
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Time grid */}
                        <div className="grid relative" style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))", height: totalHeight }}>
                          {/* Hour labels */}
                          <div className="relative">
                            {hours.map((h) => (
                              <div
                                key={h}
                                className="absolute right-2 text-[10px] text-muted-foreground tabular-nums"
                                style={{ top: (h - HOUR_START) * HOUR_PX - 6 }}
                              >
                                {String(h).padStart(2, "0")}:00
                              </div>
                            ))}
                          </div>

                          {/* Day columns */}
                          {days.map((d) => {
                            const k = dayKey(d);
                            const events = eventsByDay.get(k) ?? [];
                            const today = isToday(d);
                            const isSelected = selected && isSameDay(d, selected);
                            return (
                              <div
                                key={k}
                                onClick={() => setSelected(d)}
                                className={cn(
                                  "relative border-l border-border cursor-pointer",
                                  today && "bg-warning/5",
                                  isSelected && !today && "bg-primary/5",
                                )}
                              >
                                {/* hour lines */}
                                {hours.map((h) => (
                                  <div
                                    key={h}
                                    className="absolute left-0 right-0 border-t border-border/60"
                                    style={{ top: (h - HOUR_START) * HOUR_PX }}
                                  />
                                ))}
                                {/* half-hour subtle lines */}
                                {hours.map((h) => (
                                  <div
                                    key={`half-${h}`}
                                    className="absolute left-0 right-0 border-t border-dashed border-border/30"
                                    style={{ top: (h - HOUR_START) * HOUR_PX + HOUR_PX / 2 }}
                                  />
                                ))}

                                {/* Events */}
                                {events.map((c) => {
                                  const startH = c.date.getHours() + c.date.getMinutes() / 60;
                                  const endDate = c.end ?? new Date(c.date.getTime() + 60 * 60000);
                                  const endH = endDate.getHours() + endDate.getMinutes() / 60;
                                  const top = Math.max(0, (startH - HOUR_START) * HOUR_PX);
                                  const height = Math.max(22, (Math.min(endH, HOUR_END) - Math.max(startH, HOUR_START)) * HOUR_PX - 2);
                                  if (endH <= HOUR_START || startH >= HOUR_END) return null;
                                  const userColor = colorForUser(c.criado_por_id);
                                  return (
                                    <div
                                      key={c.id}
                                      onClick={(e) => { e.stopPropagation(); setSelected(d); openEdit(c); }}
                                      className={cn(
                                        "absolute left-1 right-1 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:brightness-95 shadow-sm",
                                        tipoChip[c.tipo],
                                      )}
                                      style={{
                                        top,
                                        height,
                                        ...(userColor ? { borderLeftColor: userColor.solid, borderLeftWidth: 4 } : {}),
                                      }}
                                      title={`${format(c.date, "HH:mm")} – ${format(endDate, "HH:mm")} · ${c.titulo}${c.criado_por_nome ? ` · ${c.criado_por_nome}` : ""}`}
                                    >
                                      <div className="text-[11px] font-semibold leading-tight truncate">{c.titulo}</div>
                                      <div className="text-[10px] tabular-nums opacity-80 leading-tight">
                                        {format(c.date, "HH:mm")} – {format(endDate, "HH:mm")}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Now line */}
                                {today && nowOffset >= 0 && nowOffset <= totalHeight && (
                                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
                                    <div className="relative h-px bg-destructive">
                                      <div className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-destructive" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                       </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="overflow-x-auto -mx-2 px-2">
                   <div className="grid grid-cols-7 border-t border-l border-border rounded-lg overflow-hidden shadow-sm min-w-[640px]">
                    {weekDays.map((wd, i) => (
                      <div
                        key={wd}
                        className={cn(
                          "text-xs font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-3 border-r border-b border-border bg-muted/40 text-center",
                          (i === 0 || i === 6) && "text-primary/70",
                        )}
                      >
                        {wd}
                      </div>
                    ))}
                    {days.map((d) => {
                      const k = dayKey(d);
                      const events = (eventsByDay.get(k) ?? []).sort((a, b) => +a.date - +b.date);
                      const inMonth = isSameMonth(d, currentMonth);
                      const today = isToday(d);
                      const isSelected = selected && isSameDay(d, selected);
                      const blocked = blockedDays.has(k);
                      const weekend = d.getDay() === 0 || d.getDay() === 6;
                      const visible = events.slice(0, 3);
                      const extra = events.length - visible.length;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelected(d)}
                          aria-label={format(d, "PPPP", { locale: ptBR })}
                          className={cn(
                            "text-left p-2 border-r border-b border-border align-top transition-all relative group min-h-[130px]",
                            "hover:bg-accent/15 hover:z-10",
                            weekend && inMonth && "bg-muted/20",
                            !inMonth && "bg-muted/30 text-muted-foreground/50",
                            blocked && "bg-destructive/10",
                            isSelected && "ring-2 ring-primary ring-inset bg-primary/5",
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            {events.length > 0 && inMonth && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                                {events.length}
                              </span>
                            )}
                            <span className={cn(
                              "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full ml-auto transition-colors",
                              today && "bg-destructive text-destructive-foreground shadow-sm",
                              !today && isSelected && "bg-primary text-primary-foreground",
                              !today && !isSelected && inMonth && "text-foreground",
                            )}>
                              {format(d, "d")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {visible.map((c) => {
                              const userColor = colorForUser(c.criado_por_id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={(e) => { e.stopPropagation(); setSelected(d); openEdit(c); }}
                                  className={cn(
                                    "flex items-center gap-1.5 text-[11px] leading-tight rounded-sm pl-1.5 pr-1 py-1 cursor-pointer overflow-hidden font-medium hover:brightness-95 transition-all",
                                    tipoChip[c.tipo],
                                  )}
                                  style={userColor ? { borderLeftColor: userColor.solid, borderLeftWidth: 4 } : undefined}
                                  title={`${format(c.date, "HH:mm")} ${c.titulo}${c.criado_por_nome ? ` · ${c.criado_por_nome}` : ""}`}
                                >
                                  {userColor && (
                                    <span
                                      className="inline-block h-2 w-2 rounded-full shrink-0"
                                      style={{ background: userColor.solid }}
                                      aria-hidden
                                    />
                                  )}
                                  <span className="shrink-0 text-[10px] tabular-nums opacity-80">{format(c.date, "HH:mm")}</span>
                                  <span className="truncate flex-1 min-w-0">{c.titulo}</span>
                                </div>
                              );
                            })}
                            {extra > 0 && (
                              <div className="text-[10px] text-muted-foreground pl-1.5 font-medium hover:text-foreground">
                                + {extra} mais
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                   </div>
                  </div>
                )}
              </div>
            );
          })()}
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
                .map((c) => {
                  const userColor = colorForUser(c.criado_por_id);
                  return (
                  <li
                    key={c.id}
                    className="rounded-md border bg-card p-3"
                    style={userColor ? { borderLeft: `4px solid ${userColor.solid}` } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <TipoIcon tipo={c.tipo} />
                          <span className="capitalize">{format(c.date, "EEEE, dd/MM", { locale: ptBR })}</span> às {format(c.date, "HH:mm", { locale: ptBR })} — {c.titulo}
                          {c.origem === "captacao" && (
                            <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/40">
                              Captação
                            </Badge>
                          )}
                          {c.criado_por_ia && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" /> IA
                            </Badge>
                          )}
                          {c.recorrencia_id && (
                            <Badge variant="outline" title={c.recorrencia_regra ? RECORRENCIA_LABEL[c.recorrencia_regra as Exclude<RecorrenciaRegra, "nenhuma">] ?? "Recorrente" : "Recorrente"}>
                              Recorrente
                            </Badge>
                          )}
                        </div>
                        {c.lead_nome && <div className="text-xs text-muted-foreground mt-0.5">Lead: {c.lead_id ? <Link to={`/crm/leads/${c.lead_id}`} className="text-primary hover:underline">{c.lead_nome}</Link> : c.lead_nome}</div>}
                        {!c.lead_nome && c.conta_nome && <div className="text-xs text-muted-foreground mt-0.5">Cliente: {c.conta_id ? <Link to={`/crm/contas/${c.conta_id}`} className="text-primary hover:underline">{c.conta_nome}</Link> : c.conta_nome}</div>}
                        {(c.lead_telefone || c.lead_email) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.lead_telefone && <span>📞 {c.lead_telefone}</span>}
                            {c.lead_telefone && c.lead_email && <span> · </span>}
                            {c.lead_email && <span>✉ {c.lead_email}</span>}
                          </div>
                        )}
                        {(c.local || c.link) && <div className="text-xs text-muted-foreground mt-0.5">{c.local || c.link}</div>}
                        {c.notas && <div className="text-xs text-muted-foreground mt-1">{c.notas}</div>}
                        {c.criado_por_nome && <div className="text-xs text-muted-foreground mt-1">Criado por: {c.criado_por_nome}</div>}

                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline">{c.status}</Badge>
                        {canManage && !["realizada","Realizada","concluido"].includes(c.status) && (
                          <Button size="icon" variant="ghost" onClick={() => marcarConcluido(c)} title="Marcar como concluído" className="text-emerald-600 hover:text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canManage && (
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                  );
                })}
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
                        <span className="capitalize">{format(c.date, "EEEE, dd/MM", { locale: ptBR })}</span> às {format(c.date, "HH:mm", { locale: ptBR })} — {c.titulo}
                        {c.criado_por_ia && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />IA</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {TIPO_LABEL[c.tipo]} · {c.lead_id && c.lead_nome ? <Link to={`/crm/leads/${c.lead_id}`} className="text-primary hover:underline">{c.lead_nome}</Link> : (c.lead_nome || "sem lead")}{c.local || c.link ? ` · ${c.local || c.link}` : ""}
                      </div>
                      {(c.lead_telefone || c.lead_email) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.lead_telefone && <span>📞 {c.lead_telefone}</span>}
                          {c.lead_telefone && c.lead_email && <span> · </span>}
                          {c.lead_email && <span>✉ {c.lead_email}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline">{c.status}</Badge>
                      {canManage && !["realizada","Realizada","concluido"].includes(c.status) && (
                        <Button size="icon" variant="ghost" onClick={() => marcarConcluido(c)} title="Marcar como concluído" className="text-emerald-600 hover:text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {canManage && (
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar compromisso</DialogTitle></DialogHeader>
          {editing && (() => {
            const { entity } = parseId(editing.id);
            const showDuracao = entity === "reuniao" || entity === "ligacao";
            const showLocalLink = entity === "reuniao";
            const showTitulo = true;
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
          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button variant="destructive" onClick={excluirCompromisso} disabled={savingEdit}>
                <Trash2 className="h-4 w-4 mr-1" />Excluir
              </Button>
              {editing?.recorrencia_id && (
                <Button variant="outline" onClick={excluirSerie} disabled={savingEdit} className="text-destructive border-destructive/40 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-1" />Excluir série
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={salvarEdicao} disabled={savingEdit}><Save className="h-4 w-4 mr-1" />Salvar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
