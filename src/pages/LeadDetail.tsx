import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  STAGES, SOURCES, INTERESTS, TEMPERATURES,
  ageInDays, ageLabel, ageColor, idleDays, idleLabel, idleColor, formatDateBR,
  initials, Stage, Temperature,
} from "@/lib/leads";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, MessageSquare, Plus, Building2, FileSignature, Pencil } from "lucide-react";
import EntityDocumentsTab from "@/components/EntityDocumentsTab";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { findDuplicates, onlyDigits, normEmail, DuplicateMatch } from "@/lib/duplicates";
import DuplicateAlert from "@/components/DuplicateAlert";

type MeetingFormat = "escritorio" | "virtual" | "ligacao";
const FORMAT_LABEL: Record<MeetingFormat, string> = {
  escritorio: "Reunião no escritório",
  virtual: "Reunião virtual",
  ligacao: "Ligação",
};
const INTERACTION_TYPE_LABEL: Record<string, string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  videochamada: "Videochamada",
  mensagem: "Mensagem",
  email: "Email",
  visita: "Visita",
  nota: "Nota",
};
const inferFormat = (m: any): MeetingFormat => {
  if (m.tipo === "ligacao") return "ligacao";
  if (m.link) return "virtual";
  return "escritorio";
};

const normalizePhone = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [conta, setConta] = useState<any>(null);
  const [brokers, setBrokers] = useState<Record<string, string>>({});
  const [interaction, setInteraction] = useState({ tipo: "ligacao", resultado: "", descricao: "", proxima_acao: "" });
  const [meeting, setMeeting] = useState<{ agendada_para: string; local: string; link: string; notas: string; format: MeetingFormat }>({ agendada_para: "", local: "", link: "", notas: "", format: "escritorio" });
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);
  const [editLead, setEditLead] = useState<any | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState<any>(null);
  const [converting, setConverting] = useState(false);
  const [convertDups, setConvertDups] = useState<DuplicateMatch[]>([]);
  const [forceConvert, setForceConvert] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: l } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    setLead(l);
    const { data: ints } = await supabase.from("interacoes").select("*").eq("lead_id", id).order("created_at", { ascending: false });
    setInteracoes(ints ?? []);
    const [{ data: ms }, { data: ligs }] = await Promise.all([
      supabase.from("reunioes").select("*").eq("lead_id", id).order("agendada_para", { ascending: false }),
      supabase.from("ligacoes").select("*").eq("lead_id", id).order("data", { ascending: false }),
    ]);
    // Normaliza ligações para o mesmo formato da seção de agendamentos
    const ligsAsMeetings = (ligs ?? []).map((c: any) => ({
      __isLigacao: true,
      id: c.id,
      lead_id: c.lead_id,
      agendada_para: c.data,
      duracao_min: c.duracao_seg ? Math.round(c.duracao_seg / 60) : 30,
      tipo: "ligacao",
      local: null,
      link: null,
      notas: c.notas,
      status: c.resultado || "agendada",
    }));
    setReunioes([...(ms ?? []), ...ligsAsMeetings].sort((a: any, b: any) => +new Date(b.agendada_para) - +new Date(a.agendada_para)));
    const { data: acc } = await supabase.from("contas").select("id, nome").eq("lead_id_origem", id).maybeSingle();
    setConta(acc ?? null);
  };

  useEffect(() => { load(); }, [id]);

  const updateLead = async (patch: any) => {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("interacoes").insert({
      lead_id: id!, tipo: interaction.tipo, descricao: interaction.descricao,
      proxima_acao: interaction.proxima_acao, resultado: interaction.resultado || null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    await supabase.from("leads").update({ ultima_interacao: new Date().toISOString() }).eq("id", id);
    setInteraction({ tipo: "ligacao", resultado: "", descricao: "", proxima_acao: "" });
    toast.success("Interação registrada");
    load();
  };

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting.agendada_para) return toast.error("Data obrigatória");
    const startIso = new Date(meeting.agendada_para).toISOString();
    if (meeting.format === "ligacao") {
      // Ligação vai para a tabela `ligacoes` (aparece na aba Ligações e na Agenda)
      const { error } = await supabase.from("ligacoes").insert({
        lead_id: id!,
        data: startIso,
        duracao_seg: 30 * 60,
        resultado: "agendada",
        notas: meeting.notas || null,
        created_by: user?.id,
        corretor_id: user?.id,
      });
      if (error) return toast.error(error.message);
    } else {
      const tipo = meeting.format === "virtual" ? "videochamada" : "presencial";
      const payload: any = {
        lead_id: id!,
        agendada_para: startIso,
        tipo,
        duracao_min: 60,
        local: meeting.format === "virtual" ? null : (meeting.local || null),
        link: meeting.format === "virtual" ? (meeting.link || null) : null,
        notas: meeting.notas || null,
        created_by: user?.id,
        corretor_id: user?.id,
        status: "agendada",
      };
      const { error } = await supabase.from("reunioes").insert(payload);
      if (error) return toast.error(error.message);
    }
    setMeeting({ agendada_para: "", local: "", link: "", notas: "", format: "escritorio" });
    toast.success(meeting.format === "ligacao" ? "Ligação agendada" : "Reunião agendada");
    load();
  };

  const saveMeetingEdit = async () => {
    if (!editingMeeting) return;
    if (editingMeeting.__isLigacao) {
      const dur = 30;
      const { error } = await supabase.from("ligacoes").update({
        data: new Date(editingMeeting.agendada_para).toISOString(),
        duracao_seg: dur * 60,
        resultado: editingMeeting.status,
        notas: editingMeeting.notas || null,
      }).eq("id", editingMeeting.id);
      if (error) return toast.error(error.message);
    } else {
      const tipo = editingMeeting.format === "ligacao" ? "ligacao" : editingMeeting.format === "virtual" ? "videochamada" : "presencial";
      const duracao_min = editingMeeting.format === "ligacao" ? 30 : 60;
      const { error } = await supabase.from("reunioes").update({
        agendada_para: new Date(editingMeeting.agendada_para).toISOString(),
        tipo, duracao_min,
        local: editingMeeting.format === "virtual" ? null : (editingMeeting.local || null),
        link: editingMeeting.format === "virtual" ? (editingMeeting.link || null) : null,
        notas: editingMeeting.notas || null,
        status: editingMeeting.status,
      }).eq("id", editingMeeting.id);
      if (error) return toast.error(error.message);
    }
    setEditingMeeting(null);
    toast.success("Agendamento atualizado");
    load();
  };

  const openWhatsApp = () => {
    if (!lead?.telefone) return toast.error("Lead sem telefone cadastrado");
    const phone = normalizePhone(lead.telefone);
    if (phone.length < 12) return toast.error("Telefone inválido");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const openConvert = async () => {
    const { data: existing } = await supabase.from("contas").select("id, nome").eq("lead_id_origem", lead.id).maybeSingle();
    if (existing) { toast.info(`Já convertido: ${existing.nome}`); navigate("/crm/contas"); return; }
    setConvertForm({
      nome: lead.nome, email: lead.email ?? "", telefone: lead.telefone ?? "",
      endereco: lead.regiao ?? "", tipo: "PF", documento: "", observacoes: lead.observacoes ?? "",
    });
    setConvertDups([]);
    setForceConvert(false);
    setConvertOpen(true);
  };

  // Verifica duplicidade enquanto edita o formulário de conversão
  useEffect(() => {
    if (!convertOpen || !convertForm) return;
    const t = setTimeout(async () => {
      const matches = await findDuplicates({
        email: convertForm.email,
        telefone: convertForm.telefone,
        documento: convertForm.documento,
      });
      const nome = (convertForm.nome || "").trim().toLowerCase();
      const telTail = onlyDigits(convertForm.telefone).slice(-8);
      let extra: DuplicateMatch[] = [];
      if (nome && telTail.length >= 8) {
        const { data } = await supabase
          .from("contas")
          .select("id,nome,email,telefone,documento")
          .ilike("nome", nome)
          .ilike("telefone", `%${telTail}%`);
        extra = (data ?? [])
          .filter((r: any) => onlyDigits(r.telefone).slice(-8) === telTail)
          .map((r: any) => ({
            table: "contas" as const,
            id: r.id, nome: r.nome, email: r.email, telefone: r.telefone, documento: r.documento,
            matchedBy: ["telefone" as const],
          }));
      }
      const map = new Map<string, DuplicateMatch>();
      [...matches, ...extra].forEach((m) => {
        const k = `${m.table}:${m.id}`;
        if (!map.has(k)) map.set(k, m);
      });
      setConvertDups(Array.from(map.values()));
      setForceConvert(false);
    }, 400);
    return () => clearTimeout(t);
  }, [convertOpen, convertForm?.nome, convertForm?.email, convertForm?.telefone, convertForm?.documento]);

  if (!lead) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  const confirmConvert = async () => {
    if (!convertForm.nome?.trim()) return toast.error("Nome obrigatório");
    if (convertDups.length && !forceConvert) {
      return toast.error("Conta já existe. Confirme abaixo para prosseguir mesmo assim.");
    }
    setConverting(true);

    const nome = convertForm.nome.trim();
    const email = normEmail(convertForm.email);
    const telTail = onlyDigits(convertForm.telefone).slice(-8);
    const docDigits = onlyDigits(convertForm.documento);
    let dupQ = supabase.from("contas").select("id,nome,telefone,email,documento");
    const orParts: string[] = [];
    if (email) orParts.push(`email.ilike.${email}`);
    if (docDigits) orParts.push(`documento.ilike.%${docDigits}%`);
    if (telTail.length >= 8) orParts.push(`telefone.ilike.%${telTail}%`);
    if (orParts.length && !forceConvert) {
      const { data: dups } = await dupQ.or(orParts.join(","));
      const real = (dups ?? []).filter((r: any) => {
        const tMatch = telTail && onlyDigits(r.telefone).slice(-8) === telTail;
        const eMatch = email && (r.email || "").toLowerCase() === email;
        const dMatch = docDigits && onlyDigits(r.documento).includes(docDigits);
        const nMatch = (r.nome || "").trim().toLowerCase() === nome.toLowerCase();
        return eMatch || dMatch || (tMatch && nMatch);
      });
      if (real.length) {
        setConverting(false);
        setConvertDups(
          real.map((r: any) => ({
            table: "contas" as const,
            id: r.id, nome: r.nome, email: r.email, telefone: r.telefone, documento: r.documento,
            matchedBy: ["telefone" as const],
          }))
        );
        return toast.error("Conta duplicada detectada. Confirme para prosseguir.");
      }
    }

    const { data: created, error } = await supabase.from("contas").insert({
      lead_id_origem: lead.id,
      nome,
      email: convertForm.email?.trim() || null,
      telefone: convertForm.telefone?.trim() || null,
      endereco: convertForm.endereco?.trim() || null,
      tipo: convertForm.tipo,
      documento: convertForm.documento?.trim() || null,
      observacoes: convertForm.observacoes?.trim() || null,
      created_by: user?.id,
      responsavel_id: user?.id,
    }).select("id").single();
    setConverting(false);
    if (error) return toast.error(error.message);
    setConvertOpen(false);
    toast.success("Lead convertido em conta!");
    navigate(created?.id ? `/crm/contas/${created.id}` : "/crm/contas");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/crm/leads"))}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      ><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-lg sm:text-xl font-semibold">{initials(lead.nome)}</div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold break-words">{lead.nome}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {lead.origem && <Badge variant="secondary">{SOURCES[lead.origem]?.emoji} {SOURCES[lead.origem]?.label || lead.origem}</Badge>}
              <Badge className={ageColor(ageInDays(lead.created_at)) + " border"}>📅 {ageLabel(ageInDays(lead.created_at))}</Badge>
              <Badge className={idleColor(idleDays(lead.ultima_interacao)) + " border"}>⏱️ {idleLabel(idleDays(lead.ultima_interacao))}</Badge>
              {lead.imovel_interesse && <Badge variant="outline">{INTERESTS[lead.imovel_interesse] || lead.imovel_interesse}</Badge>}
              {lead.temperatura && <Badge className={TEMPERATURES[lead.temperatura as Temperature].className + " border"}>{TEMPERATURES[lead.temperatura as Temperature].emoji} {TEMPERATURES[lead.temperatura as Temperature].label}</Badge>}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Entrou em <strong className="text-foreground/80">{formatDateBR(lead.created_at)}</strong>
              {" · "}
              Última interação: <strong className="text-foreground/80">{lead.ultima_interacao ? formatDateBR(lead.ultima_interacao) : "nunca"}</strong>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:items-center gap-2 w-full lg:w-auto">
          {conta ? (
            <Link to={`/crm/contas/${conta.id}`} className="w-full sm:w-auto">
              <Badge className="bg-success/15 text-success border-success/30 border gap-1 py-1.5 px-3 w-full sm:w-auto justify-center">
                <Building2 className="h-3.5 w-3.5" /> Convertido em conta
              </Badge>
            </Link>
          ) : (
            <Button size="sm" onClick={openConvert} className="bg-success hover:bg-success/90 text-success-foreground w-full sm:w-auto">
              <Building2 className="h-4 w-4 mr-1" /> Converter em conta
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditLead({
            nome: lead.nome ?? "",
            email: lead.email ?? "",
            telefone: lead.telefone ?? "",
            regiao: lead.regiao ?? "",
            imovel_interesse: lead.imovel_interesse ?? "",
            valor_estimado: lead.valor_estimado ?? "",
          })} className="w-full sm:w-auto">
            <Pencil className="h-4 w-4 mr-1" /> Editar lead
          </Button>
          <Select value={lead.temperatura ?? "none"} onValueChange={v => updateLead({ temperatura: v === "none" ? null : v })}>
            <SelectTrigger className="w-full sm:w-44 lg:w-40"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem temperatura</SelectItem>
              {(Object.keys(TEMPERATURES) as Temperature[]).map(t => (
                <SelectItem key={t} value={t}>{TEMPERATURES[t].emoji} {TEMPERATURES[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lead.etapa_funil} onValueChange={v => updateLead({ etapa_funil: v as Stage })}>
            <SelectTrigger className="w-full sm:w-52 lg:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Converter lead em conta</DialogTitle></DialogHeader>
          {convertForm && (
            <div className="space-y-3">
              <div><Label>Nome do cliente*</Label><Input value={convertForm.nome} onChange={e => setConvertForm({ ...convertForm, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={convertForm.telefone} onChange={e => setConvertForm({ ...convertForm, telefone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={convertForm.tipo} onValueChange={v => setConvertForm({ ...convertForm, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>CPF/CNPJ</Label><Input value={convertForm.documento} onChange={e => setConvertForm({ ...convertForm, documento: e.target.value })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={convertForm.endereco} onChange={e => setConvertForm({ ...convertForm, endereco: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea rows={3} value={convertForm.observacoes} onChange={e => setConvertForm({ ...convertForm, observacoes: e.target.value })} /></div>
              {convertDups.length > 0 && (
                <DuplicateAlert matches={convertDups} showActions onIgnore={() => setForceConvert(true)} />
              )}
              {forceConvert && (
                <p className="text-xs text-amber-600">Conta será criada mesmo com duplicidade detectada.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={converting}>Cancelar</Button>
            <Button
              onClick={confirmConvert}
              disabled={converting || (convertDups.length > 0 && !forceConvert)}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {converting ? "Convertendo…" : "Converter em conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLead} onOpenChange={(o) => !o && setEditLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar lead</DialogTitle></DialogHeader>
          {editLead && (
            <div className="space-y-3">
              <div><Label>Nome completo*</Label><Input value={editLead.nome} onChange={e => setEditLead({ ...editLead, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={editLead.telefone} onChange={e => setEditLead({ ...editLead, telefone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={editLead.email} onChange={e => setEditLead({ ...editLead, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Região</Label><Input value={editLead.regiao} onChange={e => setEditLead({ ...editLead, regiao: e.target.value })} /></div>
                <div><Label>Valor estimado</Label><Input type="number" value={editLead.valor_estimado} onChange={e => setEditLead({ ...editLead, valor_estimado: e.target.value })} /></div>
              </div>
              <div><Label>Interesse</Label>
                <Select value={editLead.imovel_interesse || "none"} onValueChange={v => setEditLead({ ...editLead, imovel_interesse: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {Object.entries(INTERESTS).map(([k, v]) => <SelectItem key={k} value={k}>{v as string}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLead(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editLead.nome?.trim()) return toast.error("Nome é obrigatório");
              await updateLead({
                nome: editLead.nome.trim(),
                email: editLead.email?.trim() || null,
                telefone: editLead.telefone?.trim() || null,
                regiao: editLead.regiao?.trim() || null,
                imovel_interesse: editLead.imovel_interesse || null,
                valor_estimado: editLead.valor_estimado === "" || editLead.valor_estimado == null ? null : Number(editLead.valor_estimado),
              });
              setEditLead(null);
              toast.success("Lead atualizado");
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold">Contato</h3>
          {lead.telefone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{lead.telefone}</div>}
          {lead.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{lead.email}</div>}
          {lead.regiao && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{lead.regiao}</div>}
          {lead.telefone && (
            <Button onClick={openWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white">
              <MessageSquare className="h-4 w-4 mr-2" /> Chamar no WhatsApp
            </Button>
          )}
          <div className="pt-2"><Label className="text-xs">Observações</Label>
            <Textarea defaultValue={lead.observacoes ?? ""} onBlur={e => e.target.value !== lead.observacoes && updateLead({ observacoes: e.target.value })} rows={4} />
          </div>
          {lead.meta_form_data?.respostas?.length > 0 && (
            <div className="pt-3 border-t">
              <Label className="text-xs">
                Respostas do formulário{lead.meta_form_data.form_nome ? ` · ${lead.meta_form_data.form_nome}` : ""}
              </Label>
              <dl className="mt-2 space-y-2 text-sm">
                {lead.meta_form_data.respostas.map((r: { campo: string; valor: string }, i: number) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
                    <dt className="text-muted-foreground capitalize truncate">{r.campo.replace(/_/g, " ")}</dt>
                    <dd className="break-words">{r.valor || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2 space-y-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Registrar interação</h3>
          <form onSubmit={addInteraction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={interaction.tipo} onValueChange={v => setInteraction({ ...interaction, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="videochamada">Videochamada</SelectItem>
                    <SelectItem value="mensagem">Mensagem</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="nota">Nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Resultado</Label>
                <Select value={interaction.resultado} onValueChange={v => setInteraction({ ...interaction, resultado: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendeu">Atendeu</SelectItem>
                    <SelectItem value="nao_atendeu">Não atendeu</SelectItem>
                    <SelectItem value="retornar">Retornar</SelectItem>
                    <SelectItem value="interessado">Interessado</SelectItem>
                    <SelectItem value="sem_interesse">Sem interesse</SelectItem>
                    <SelectItem value="agendou">Agendou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={interaction.descricao} onChange={e => setInteraction({ ...interaction, descricao: e.target.value })} rows={2} /></div>
            <div><Label>Próxima ação</Label><Input value={interaction.proxima_acao} onChange={e => setInteraction({ ...interaction, proxima_acao: e.target.value })} /></div>
            <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Registrar</Button>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Calendar className="h-5 w-5" />Agendar reunião / ligação</h3>
          <form onSubmit={addMeeting} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={meeting.format} onValueChange={(v: MeetingFormat) => setMeeting({ ...meeting, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escritorio">Reunião no escritório</SelectItem>
                    <SelectItem value="virtual">Reunião virtual</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora*</Label><Input type="datetime-local" value={meeting.agendada_para} onChange={e => setMeeting({ ...meeting, agendada_para: e.target.value })} required /></div>
            </div>
            {meeting.format === "escritorio" && <div><Label>Local</Label><Input value={meeting.local} onChange={e => setMeeting({ ...meeting, local: e.target.value })} placeholder="Endereço, sala…" /></div>}
            {meeting.format === "virtual" && <div><Label>Link</Label><Input value={meeting.link} onChange={e => setMeeting({ ...meeting, link: e.target.value })} placeholder="Meet, Zoom…" /></div>}
            <div><Label>Notas</Label><Textarea value={meeting.notas} onChange={e => setMeeting({ ...meeting, notas: e.target.value })} rows={2} /></div>
            <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Agendar</Button>
          </form>
          <div className="mt-4 space-y-2">
            {reunioes.map(m => {
              const fmt = inferFormat(m);
              return (
                <div key={m.id} className="text-sm border rounded-md p-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{format(new Date(m.agendada_para), "Pp", { locale: ptBR })}</div>
                    <div className="text-muted-foreground text-xs truncate">
                      <Badge variant="secondary" className="text-[10px] mr-1">{FORMAT_LABEL[fmt]}</Badge>
                      {m.local || m.link} · <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => setEditingMeeting({
                    __isLigacao: !!m.__isLigacao,
                    id: m.id,
                    agendada_para: format(new Date(m.agendada_para), "yyyy-MM-dd'T'HH:mm"),
                    format: fmt,
                    local: m.local ?? "",
                    link: m.link ?? "",
                    notas: m.notas ?? "",
                    status: m.status,
                  })}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}
          </div>

          <Dialog open={!!editingMeeting} onOpenChange={(o) => !o && setEditingMeeting(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar agendamento</DialogTitle></DialogHeader>
              {editingMeeting && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tipo</Label>
                      <Select value={editingMeeting.format} onValueChange={(v: MeetingFormat) => setEditingMeeting({ ...editingMeeting, format: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="escritorio">Reunião no escritório</SelectItem>
                          <SelectItem value="virtual">Reunião virtual</SelectItem>
                          <SelectItem value="ligacao">Ligação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Data e hora</Label><Input type="datetime-local" value={editingMeeting.agendada_para} onChange={e => setEditingMeeting({ ...editingMeeting, agendada_para: e.target.value })} /></div>
                  </div>
                  {editingMeeting.format === "escritorio" && <div><Label>Local</Label><Input value={editingMeeting.local} onChange={e => setEditingMeeting({ ...editingMeeting, local: e.target.value })} placeholder="Endereço, sala…" /></div>}
                  {editingMeeting.format === "virtual" && <div><Label>Link</Label><Input value={editingMeeting.link} onChange={e => setEditingMeeting({ ...editingMeeting, link: e.target.value })} placeholder="Meet, Zoom…" /></div>}
                  <div><Label>Status</Label>
                    <Select value={editingMeeting.status} onValueChange={v => setEditingMeeting({ ...editingMeeting, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="no_show">No-show</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notas</Label><Textarea value={editingMeeting.notas} onChange={e => setEditingMeeting({ ...editingMeeting, notas: e.target.value })} rows={2} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingMeeting(null)}>Cancelar</Button>
                <Button onClick={saveMeetingEdit}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-3">Histórico</h3>
          <div className="space-y-3 max-h-96 overflow-auto">
            {interacoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma interação ainda.</p>}
            {interacoes.map(i => (
              <div key={i.id} className="border-l-2 border-primary/30 pl-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px]">{INTERACTION_TYPE_LABEL[i.tipo] ?? i.tipo}</Badge>
                  {i.resultado && <span className="text-xs text-muted-foreground">{i.resultado}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(i.created_at), "Pp", { locale: ptBR })}</span>
                </div>
                {i.descricao && <p className="text-sm mt-1">{i.descricao}</p>}
                {i.proxima_acao && <p className="text-xs text-primary mt-1">→ {i.proxima_acao}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <FileSignature className="h-5 w-5" /> Documentos para assinatura
        </h3>
        <EntityDocumentsTab leadId={lead.id} defaultSigner={{ name: lead.nome, email: lead.email }} />
      </Card>
    </div>
  );
}
