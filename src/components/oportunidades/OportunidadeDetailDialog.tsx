import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle, Trash2, CheckCircle2, Circle, CalendarCheck, FileText, Home as HomeIcon,
  ClipboardList, History as HistoryIcon, ListChecks, Trophy, XCircle, Building2, ExternalLink, Save,
} from "lucide-react";
import {
  ESTAGIOS, estagioLabel, isEstagioFinal, diagnosticoPendencias, categoriaLabel,
  STATUS_VISITA, statusVisitaLabel, STATUS_PROPOSTA, statusPropostaLabel, PRIO_COLORS,
} from "@/lib/oportunidadesFunil";
import { formatBRL } from "@/lib/format";
import GanhaDialog from "@/components/oportunidades/GanhaDialog";
import PerdidaDialog from "@/components/oportunidades/PerdidaDialog";

const fmtDt = (iso?: string | null) => (iso ? format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—");
const fmtD = (iso?: string | null) => (iso ? format(new Date(iso), "dd/MM/yyyy") : "—");

/**
 * Detalhe completo da oportunidade: diagnóstico, imóveis, visitas, propostas, tarefas e histórico.
 */
export default function OportunidadeDetailDialog({
  open,
  onOpenChange,
  oportunidade,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  oportunidade: any;
  onSaved: () => void;
}) {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState("diagnostico");
  const [op, setOp] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [conta, setConta] = useState<any | null>(null);
  const [leadNome, setLeadNome] = useState<string>("");
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [imoveis, setImoveis] = useState<{ id: string; nome: string }[]>([]);
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // auxiliares de UI
  const [novoImovel, setNovoImovel] = useState("none");
  const [rejeitandoId, setRejeitandoId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [visitaForm, setVisitaForm] = useState<any | null>(null);
  const [resultadoForm, setResultadoForm] = useState<Record<string, any>>({});
  const [propostaForm, setPropostaForm] = useState<any | null>(null);
  const [tarefaForm, setTarefaForm] = useState<any | null>(null);
  const [vincularContaId, setVincularContaId] = useState("none");
  const [contasMin, setContasMin] = useState<{ id: string; nome: string }[]>([]);
  const [ganhaOpen, setGanhaOpen] = useState(false);
  const [perdidaOpen, setPerdidaOpen] = useState(false);

  const nomeDe = (uid?: string | null) => (uid ? profiles[uid] ?? "—" : "—");

  const reload = async (id: string) => {
    const [{ data: o }, { data: vi }, { data: vs }, { data: pr }, { data: ta }, { data: hi }] = await Promise.all([
      supabase.from("oportunidades").select("*").eq("id", id).single(),
      supabase.from("oportunidade_imoveis").select("*").eq("oportunidade_id", id).order("created_at"),
      supabase.from("oportunidade_visitas").select("*").eq("oportunidade_id", id).order("data_visita", { ascending: false }),
      supabase.from("oportunidade_propostas").select("*").eq("oportunidade_id", id).order("created_at", { ascending: false }),
      supabase.from("tarefas").select("*").eq("oportunidade_id", id).order("prazo", { ascending: true }),
      supabase.from("interacoes").select("*").eq("oportunidade_id", id).order("created_at", { ascending: false }).limit(100),
    ]);
    if (o) { setOp(o); setForm(o); }
    setVinculos(vi ?? []);
    setVisitas((vs ?? []) as any[]);
    setPropostas((pr ?? []) as any[]);
    setTarefas((ta ?? []) as any[]);
    setHistorico((hi ?? []) as any[]);
    const contaId = o?.conta_id || (o?.cliente_tipo === "conta" ? o?.cliente_id : null);
    if (contaId) {
      const { data: c } = await supabase.from("contas").select("id,nome,categoria,origem,telefone,email").eq("id", contaId).maybeSingle();
      setConta(c);
    } else setConta(null);
    const leadId = o?.lead_id_origem || (o?.cliente_tipo === "lead" ? o?.cliente_id : null);
    if (leadId) {
      const { data: l } = await supabase.from("leads").select("nome").eq("id", leadId).maybeSingle();
      setLeadNome(l?.nome ?? "");
    } else setLeadNome("");
  };

  useEffect(() => {
    if (!open || !oportunidade) return;
    setTab("diagnostico");
    setPropostaForm(null); setVisitaForm(null); setTarefaForm(null); setVincularContaId("none");
    reload(oportunidade.id);
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) m[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(m);
    });
    supabase.from("imoveis").select("id,titulo,codigo").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo ? i.codigo + " · " : ""}${i.titulo}` })));
    });
    supabase.rpc("list_contas_min").then(({ data }) => {
      setContasMin(((data ?? []) as any[]).map((r) => ({ id: r.id, nome: r.nome || "Sem nome" })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, oportunidade]);

  const pendencias = useMemo(() => diagnosticoPendencias(form), [form]);
  const finalizada = isEstagioFinal(op?.estagio);

  const registrar = async (descricao: string) => {
    await supabase.from("interacoes").insert({
      conta_id: op?.conta_id ?? null, oportunidade_id: op?.id, tipo: "nota", descricao, created_by: user?.id,
    } as any);
  };

  // ---------- Diagnóstico ----------
  const salvarDiagnostico = async () => {
    if (!form.titulo?.trim()) return toast.error("Informe um título");
    setSaving(true);
    const { error } = await supabase.from("oportunidades").update({
      titulo: form.titulo.trim(),
      descricao_busca: form.descricao_busca || null,
      valor_alvo: form.valor_alvo ? Number(form.valor_alvo) : null,
      tipo_imovel: form.tipo_imovel || null,
      cidade: form.cidade || null,
      bairro: form.bairro || null,
      prioridade: form.prioridade || "media",
      corretor_id: form.corretor_id === "none" ? null : form.corretor_id || null,
      forma_pagamento: form.forma_pagamento || null,
      prazo_pretendido: form.prazo_pretendido || null,
      possui_permuta: !!form.possui_permuta,
      imovel_permuta: form.possui_permuta ? form.imovel_permuta || null : null,
      valor_estimado_permuta: form.possui_permuta && form.valor_estimado_permuta ? Number(form.valor_estimado_permuta) : null,
      caracteristicas_indispensaveis: form.caracteristicas_indispensaveis || null,
      observacoes: form.observacoes || null,
    } as any).eq("id", op.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Diagnóstico salvo");
    reload(op.id);
    onSaved();
  };

  const concluirDiagnostico = async () => {
    const p = diagnosticoPendencias(form);
    if (p.length) return toast.error(`Pendências: ${p.join(", ")}`);
    setSaving(true);
    const { error } = await supabase.from("oportunidades").update({
      data_diagnostico: new Date().toISOString(),
      diagnostico_por: user?.id,
      estagio: "buscando",
    } as any).eq("id", op.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await registrar("Diagnóstico da oportunidade concluído — avançou para Buscando imóvel.");
    toast.success("Diagnóstico concluído — etapa Buscando imóvel");
    reload(op.id);
    onSaved();
  };

  const moverEstagio = async (novo: string) => {
    if (novo === "ganha") { setGanhaOpen(true); return; }
    if (novo === "perdida") { setPerdidaOpen(true); return; }
    if (op.estagio === "nova" && novo === "buscando") { concluirDiagnostico(); return; }
    const { error } = await supabase.from("oportunidades").update({ estagio: novo } as any).eq("id", op.id);
    if (error) return toast.error(error.message);
    toast.success(`Movida para ${estagioLabel(novo)}`);
    reload(op.id);
    onSaved();
  };

  const vincularConta = async () => {
    if (vincularContaId === "none") return toast.error("Selecione a conta");
    const { data: c } = await supabase.from("contas").select("id,categoria,origem,lead_id_origem").eq("id", vincularContaId).single();
    if (!c) return toast.error("Conta não encontrada");
    const { error } = await supabase.from("oportunidades").update({
      conta_id: c.id,
      cliente_tipo: "conta",
      cliente_id: c.id,
      lead_id_origem: op.lead_id_origem ?? c.lead_id_origem ?? null,
      categoria_origem: ["carteira", "marketing"].includes(c.categoria) ? c.categoria : null,
      origem: op.origem ?? c.origem ?? null,
    } as any).eq("id", op.id);
    if (error) return toast.error(error.message);
    await registrar("Oportunidade vinculada a uma conta (revisão de vínculo legado).");
    toast.success("Conta vinculada");
    reload(op.id);
    onSaved();
  };

  // ---------- Imóveis ----------
  const addImovel = async (imovel_id: string) => {
    if (imovel_id === "none" || vinculos.find((v) => v.imovel_id === imovel_id)) return;
    await supabase.from("oportunidade_imoveis").insert({ oportunidade_id: op.id, imovel_id, created_by: user?.id } as any);
    const nome = imoveis.find((i) => i.id === imovel_id)?.nome ?? "Imóvel";
    await registrar(`Imóvel vinculado: ${nome}.`);
    setNovoImovel("none");
    reload(op.id);
  };
  const removeVinculo = async (id: string) => {
    await supabase.from("oportunidade_imoveis").delete().eq("id", id);
    reload(op.id);
  };
  const updateVinculo = async (id: string, patch: any) => {
    await supabase.from("oportunidade_imoveis").update(patch).eq("id", id);
    setVinculos(vinculos.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };
  const marcarApresentado = async (v: any) => {
    await updateVinculo(v.id, { status: "apresentado", apresentado_em: new Date().toISOString(), apresentado_por: user?.id });
    const nome = imoveis.find((i) => i.id === v.imovel_id)?.nome ?? "Imóvel";
    await registrar(`Imóvel apresentado ao cliente: ${nome}.`);
    reload(op.id);
  };
  const rejeitar = async () => {
    if (!rejeitandoId) return;
    if (!motivoRejeicao.trim()) return toast.error("Informe o motivo da rejeição");
    await updateVinculo(rejeitandoId, { status: "rejeitado", motivo_rejeicao: motivoRejeicao.trim() });
    const v = vinculos.find((x) => x.id === rejeitandoId);
    const nome = imoveis.find((i) => i.id === v?.imovel_id)?.nome ?? "Imóvel";
    await registrar(`Imóvel rejeitado pelo cliente: ${nome}. Motivo: ${motivoRejeicao.trim()}.`);
    setRejeitandoId(null); setMotivoRejeicao("");
    reload(op.id);
  };

  // ---------- Visitas ----------
  const salvarVisita = async () => {
    if (!visitaForm?.data_visita) return toast.error("Informe data e horário");
    setSaving(true);
    const { error } = await supabase.from("oportunidade_visitas").insert({
      oportunidade_id: op.id,
      conta_id: op.conta_id ?? null,
      imovel_id: visitaForm.imovel_id === "none" ? null : visitaForm.imovel_id,
      data_visita: new Date(visitaForm.data_visita).toISOString(),
      corretor_id: visitaForm.corretor_id === "none" ? op.corretor_id ?? user?.id : visitaForm.corretor_id,
      local: visitaForm.local || null,
      observacao: visitaForm.observacao || null,
      status: "agendada",
      created_by: user?.id,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    await registrar(`Visita agendada para ${fmtDt(new Date(visitaForm.data_visita).toISOString())}.`);
    setVisitaForm(null);
    toast.success("Visita agendada");
    if (!isEstagioFinal(op.estagio) && op.estagio !== "visita") moverEstagio("visita");
    else reload(op.id);
  };
  const updateVisita = async (id: string, patch: any, log?: string) => {
    await supabase.from("oportunidade_visitas").update(patch).eq("id", id);
    if (log) await registrar(log);
    reload(op.id);
  };
  const salvarResultadoVisita = async (v: any) => {
    const patch = resultadoForm[v.id];
    setSaving(true);
    if (patch && Object.keys(patch).length) {
      const { error } = await supabase.from("oportunidade_visitas").update(patch).eq("id", v.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    await registrar(`Resultado da visita de ${fmtD(v.data_visita)} registrado.`);
    setSaving(false);
    setResultadoForm((prev) => { const n = { ...prev }; delete n[v.id]; return n; });
    toast.success("Resultado da visita salvo");
    reload(op.id);
  };

  // ---------- Propostas ----------
  const salvarProposta = async () => {
    if (!propostaForm) return;
    setSaving(true);
    const { error } = await supabase.from("oportunidade_propostas").insert({
      oportunidade_id: op.id,
      conta_id: op.conta_id ?? null,
      imovel_id: propostaForm.imovel_id === "none" ? null : propostaForm.imovel_id,
      valor_pedido: propostaForm.valor_pedido ? Number(propostaForm.valor_pedido) : null,
      valor_proposto: propostaForm.valor_proposto ? Number(propostaForm.valor_proposto) : null,
      forma_pagamento: propostaForm.forma_pagamento || null,
      entrada: propostaForm.entrada ? Number(propostaForm.entrada) : null,
      parcelamento: propostaForm.parcelamento || null,
      financiamento: propostaForm.financiamento || null,
      prazos: propostaForm.prazos || null,
      condicoes: propostaForm.condicoes || null,
      validade: propostaForm.validade || null,
      possui_permuta: !!propostaForm.possui_permuta,
      imovel_permuta: propostaForm.possui_permuta ? propostaForm.imovel_permuta || null : null,
      valor_estimado_permuta: propostaForm.possui_permuta && propostaForm.valor_estimado_permuta ? Number(propostaForm.valor_estimado_permuta) : null,
      observacoes: propostaForm.observacoes || null,
      status: "em_preparacao",
      created_by: user?.id,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    await registrar(`Proposta registrada${propostaForm.valor_proposto ? ` — ${formatBRL(Number(propostaForm.valor_proposto))}` : ""}.`);
    setPropostaForm(null);
    toast.success("Proposta registrada");
    if (op.estagio !== "proposta" && !finalizada) moverEstagio("proposta");
    else reload(op.id);
  };
  const updatePropostaStatus = async (p: any, status: string) => {
    await supabase.from("oportunidade_propostas").update({ status } as any).eq("id", p.id);
    await registrar(`Proposta de ${formatBRL(p.valor_proposto)} atualizada para "${statusPropostaLabel(status)}".`);
    reload(op.id);
  };

  // ---------- Tarefas ----------
  const salvarTarefa = async () => {
    if (!tarefaForm?.titulo?.trim()) return toast.error("Informe o título");
    if (!tarefaForm?.prazo) return toast.error("Informe a data");
    const { error } = await supabase.from("tarefas").insert({
      conta_id: op.conta_id ?? null,
      oportunidade_id: op.id,
      titulo: tarefaForm.titulo.trim(),
      descricao: tarefaForm.descricao?.trim() || null,
      prazo: new Date(tarefaForm.prazo).toISOString(),
      prioridade: tarefaForm.prioridade || "Média",
      status: "A fazer",
      responsavel_id: tarefaForm.responsavel_id === "none" ? op.corretor_id ?? user?.id : tarefaForm.responsavel_id,
      created_by: user?.id,
    } as any);
    if (error) return toast.error(error.message);
    setTarefaForm(null);
    toast.success("Tarefa criada");
    reload(op.id);
  };
  const concluirTarefa = async (id: string) => {
    await supabase.from("tarefas").update({ status: "Concluída" } as any).eq("id", id);
    reload(op.id);
  };

  const excluir = async () => {
    if (!confirm("Excluir esta oportunidade? O histórico vinculado também será removido.")) return;
    await supabase.from("oportunidade_imoveis").delete().eq("oportunidade_id", op.id);
    const { error } = await supabase.from("oportunidades").delete().eq("id", op.id);
    if (error) return toast.error(error.message);
    toast.success("Oportunidade excluída");
    onOpenChange(false);
    onSaved();
  };

  if (!open || !op) return null;
  const f = (k: string) => form[k] ?? "";
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  const imovelNome = (id?: string | null) => imoveis.find((i) => i.id === id)?.nome ?? "—";

  const CHECKLIST = [
    { label: "Conta vinculada", ok: !!form.conta_id },
    { label: "Descrição da busca", ok: !!form.descricao_busca?.trim() },
    { label: "Tipo de imóvel", ok: !!form.tipo_imovel?.trim() },
    { label: "Cidade ou região", ok: !!(form.cidade?.trim() || form.bairro?.trim()) },
    { label: "Valor-alvo", ok: !!form.valor_alvo },
    { label: "Corretor responsável", ok: !!form.corretor_id && form.corretor_id !== "none" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {op.titulo}
            {categoriaLabel(op.categoria_origem ?? conta?.categoria) && (
              <Badge variant="outline" className="text-[10px]">{categoriaLabel(op.categoria_origem ?? conta?.categoria)}</Badge>
            )}
            {op.possui_permuta && <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/30">Permuta</Badge>}
          </DialogTitle>
        </DialogHeader>

        {/* Conta + etapa */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {conta ? (
            <Link to={`/crm/contas/${conta.id}`} className="flex items-center gap-1 text-primary hover:underline">
              <Building2 className="h-4 w-4" /> {conta.nome}
            </Link>
          ) : leadNome ? (
            <span className="text-muted-foreground">Lead de origem: {leadNome}</span>
          ) : null}
          <div className="flex items-center gap-2 ml-auto">
            <Select value={op.estagio} onValueChange={moverEstagio} disabled={finalizada}>
              <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTAGIOS.map((e) => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vínculo pendente */}
        {!op.conta_id && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
              Vínculo pendente de revisão — esta oportunidade legada ainda não está ligada a uma Conta.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="min-w-[240px] flex-1">
                <SearchableSelect value={vincularContaId} onChange={setVincularContaId} options={contasMin} placeholder="Buscar conta..." emptyLabel="Selecione a conta" />
              </div>
              <Button size="sm" onClick={vincularConta}>Vincular conta</Button>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="diagnostico"><ClipboardList className="h-3.5 w-3.5 mr-1" />Diagnóstico</TabsTrigger>
            <TabsTrigger value="imoveis"><HomeIcon className="h-3.5 w-3.5 mr-1" />Imóveis <Badge variant="secondary" className="ml-1 text-[10px]">{vinculos.length}</Badge></TabsTrigger>
            <TabsTrigger value="visitas"><CalendarCheck className="h-3.5 w-3.5 mr-1" />Visitas <Badge variant="secondary" className="ml-1 text-[10px]">{visitas.length}</Badge></TabsTrigger>
            <TabsTrigger value="propostas"><FileText className="h-3.5 w-3.5 mr-1" />Propostas <Badge variant="secondary" className="ml-1 text-[10px]">{propostas.length}</Badge></TabsTrigger>
            <TabsTrigger value="tarefas"><ListChecks className="h-3.5 w-3.5 mr-1" />Tarefas</TabsTrigger>
            <TabsTrigger value="historico"><HistoryIcon className="h-3.5 w-3.5 mr-1" />Histórico</TabsTrigger>
          </TabsList>

          {/* ================= DIAGNÓSTICO ================= */}
          <TabsContent value="diagnostico" className="mt-4">
            <div className="grid md:grid-cols-[1fr_240px] gap-4">
              <div className="space-y-3">
                <div>
                  <Label>Título *</Label>
                  <Input value={f("titulo")} onChange={(e) => set("titulo", e.target.value)} />
                </div>
                <div>
                  <Label>O que o cliente busca</Label>
                  <Textarea rows={3} value={f("descricao_busca")} onChange={(e) => set("descricao_busca", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Valor alvo (R$)</Label>
                    <Input type="number" value={f("valor_alvo")} onChange={(e) => set("valor_alvo", e.target.value)} />
                  </div>
                  <div>
                    <Label>Tipo de imóvel</Label>
                    <Input value={f("tipo_imovel")} onChange={(e) => set("tipo_imovel", e.target.value)} />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={f("prioridade") || "media"} onValueChange={(v) => set("prioridade", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cidade</Label>
                    <Input value={f("cidade")} onChange={(e) => set("cidade", e.target.value)} />
                  </div>
                  <div>
                    <Label>Bairro, região ou condomínio</Label>
                    <Input value={f("bairro")} onChange={(e) => set("bairro", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Input value={f("forma_pagamento")} onChange={(e) => set("forma_pagamento", e.target.value)} />
                  </div>
                  <div>
                    <Label>Prazo pretendido</Label>
                    <Input value={f("prazo_pretendido")} onChange={(e) => set("prazo_pretendido", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!form.possui_permuta} onCheckedChange={(v) => set("possui_permuta", !!v)} />
                    Cliente tem imóvel para permuta
                  </label>
                  {form.possui_permuta && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div>
                        <Label>Imóvel oferecido</Label>
                        <Input value={f("imovel_permuta")} onChange={(e) => set("imovel_permuta", e.target.value)} />
                      </div>
                      <div>
                        <Label>Valor estimado (R$)</Label>
                        <Input type="number" value={f("valor_estimado_permuta")} onChange={(e) => set("valor_estimado_permuta", e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Características indispensáveis</Label>
                  <Textarea rows={2} value={f("caracteristicas_indispensaveis")} onChange={(e) => set("caracteristicas_indispensaveis", e.target.value)} />
                </div>
                <div>
                  <Label>Corretor responsável</Label>
                  <SearchableSelect value={f("corretor_id") || "none"} onChange={(v) => set("corretor_id", v)} options={corretores} placeholder="Buscar..." emptyLabel="Sem responsável" />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={f("observacoes")} onChange={(e) => set("observacoes", e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={salvarDiagnostico} disabled={saving}>{saving ? "Salvando…" : "Salvar diagnóstico"}</Button>
                  {op.estagio === "nova" && (
                    <Button variant="secondary" onClick={concluirDiagnostico} disabled={saving || pendencias.length > 0}>
                      Concluir diagnóstico → Buscando imóvel
                    </Button>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <Card className="p-3 h-fit space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnóstico da oportunidade</p>
                {CHECKLIST.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                  </div>
                ))}
                {op.data_diagnostico && (
                  <p className="text-[11px] text-muted-foreground pt-1 border-t">
                    Diagnóstico concluído em {fmtDt(op.data_diagnostico)}{op.diagnostico_por ? ` por ${nomeDe(op.diagnostico_por)}` : ""}
                  </p>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ================= IMÓVEIS ================= */}
          <TabsContent value="imoveis" className="mt-4 space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Vincular imóvel</Label>
                <SearchableSelect value={novoImovel} onChange={addImovel} options={imoveis.filter((i) => !vinculos.find((v) => v.imovel_id === i.id))} placeholder="Buscar imóvel..." emptyLabel="Adicionar imóvel" />
              </div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{vinculos.length} vinculados</span>
              <span>{vinculos.filter((v) => v.status === "apresentado").length} apresentados</span>
              <span>{vinculos.filter((v) => v.interesse === "alto").length} interesse alto</span>
            </div>
            {vinculos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum imóvel vinculado.</p>}
            <div className="space-y-2">
              {vinculos.map((v) => (
                <Card key={v.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] truncate max-w-[280px]">{imovelNome(v.imovel_id)}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{v.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to="/crm/imoveis" className="text-muted-foreground hover:text-primary" title="Abrir ficha em Imóveis">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeVinculo(v.id)} title="Remover vínculo (não exclui o imóvel)">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Select value={v.interesse || "medio"} onValueChange={(val) => updateVinculo(v.id, { interesse: val })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Interesse baixo</SelectItem>
                        <SelectItem value="medio">Interesse médio</SelectItem>
                        <SelectItem value="alto">Interesse alto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" disabled={v.status === "apresentado"} onClick={() => marcarApresentado(v)}>
                      Marcar apresentado
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setVisitaForm({ imovel_id: v.imovel_id, corretor_id: "none" }); setTab("visitas"); }}>
                      Agendar visita
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-destructive" disabled={v.status === "rejeitado"} onClick={() => { setRejeitandoId(v.id); setMotivoRejeicao(""); }}>
                      Rejeitar
                    </Button>
                  </div>
                  {v.apresentado_em && <p className="text-[11px] text-muted-foreground">Apresentado em {fmtDt(v.apresentado_em)}{v.apresentado_por ? ` por ${nomeDe(v.apresentado_por)}` : ""}</p>}
                  {v.motivo_rejeicao && <p className="text-[11px] text-destructive">Rejeitado: {v.motivo_rejeicao}</p>}
                  <Textarea
                    rows={1}
                    placeholder="Feedback do cliente..."
                    defaultValue={v.feedback_cliente || ""}
                    onBlur={(e) => { if (e.target.value !== (v.feedback_cliente || "")) updateVinculo(v.id, { feedback_cliente: e.target.value }); }}
                    className="text-xs"
                  />
                </Card>
              ))}
            </div>
            {rejeitandoId && (
              <div className="rounded-md border p-3 space-y-2">
                <Label>Motivo da rejeição *</Label>
                <div className="flex gap-2">
                  <Input value={motivoRejeicao} onChange={(e) => setMotivoRejeicao(e.target.value)} placeholder="Ex: Não gostou do bairro" />
                  <Button size="sm" onClick={rejeitar}>Confirmar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejeitandoId(null)}>Cancelar</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================= VISITAS ================= */}
          <TabsContent value="visitas" className="mt-4 space-y-3">
            {visitaForm ? (
              <Card className="p-3 space-y-3">
                <p className="text-sm font-medium">Agendar visita</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Imóvel</Label>
                    <Select value={visitaForm.imovel_id ?? "none"} onValueChange={(v) => setVisitaForm({ ...visitaForm, imovel_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem imóvel específico</SelectItem>
                        {vinculos.map((v) => <SelectItem key={v.imovel_id} value={v.imovel_id}>{imovelNome(v.imovel_id)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data e horário *</Label>
                    <Input type="datetime-local" value={visitaForm.data_visita ?? ""} onChange={(e) => setVisitaForm({ ...visitaForm, data_visita: e.target.value })} />
                  </div>
                  <div>
                    <Label>Corretor</Label>
                    <Select value={visitaForm.corretor_id ?? "none"} onValueChange={(v) => setVisitaForm({ ...visitaForm, corretor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Responsável da oportunidade" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Responsável da oportunidade</SelectItem>
                        {corretores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Local</Label>
                    <Input value={visitaForm.local ?? ""} onChange={(e) => setVisitaForm({ ...visitaForm, local: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Observação</Label>
                  <Textarea rows={2} value={visitaForm.observacao ?? ""} onChange={(e) => setVisitaForm({ ...visitaForm, observacao: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={salvarVisita} disabled={saving}>
                    <CalendarCheck className="h-4 w-4 mr-1" /> Agendar e mover p/ Visita agendada
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setVisitaForm(null)}>Cancelar</Button>
                </div>
              </Card>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setVisitaForm({ imovel_id: "none", corretor_id: "none" })}>
                <CalendarCheck className="h-4 w-4 mr-1" /> Agendar visita
              </Button>
            )}

            {visitas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>}
            <div className="space-y-2">
              {visitas.map((v) => (
                <Card key={v.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-sm">
                      <span className="font-medium">{imovelNome(v.imovel_id)}</span>
                      <span className="text-muted-foreground"> · {fmtDt(v.data_visita)} · {nomeDe(v.corretor_id)}</span>
                    </div>
                    <Select value={v.status} onValueChange={(val) => updateVisita(v.id, { status: val }, `Visita de ${fmtD(v.data_visita)} atualizada para "${statusVisitaLabel(val)}".`)}>
                      <SelectTrigger className="w-[190px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_VISITA.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {v.observacao && <p className="text-xs text-muted-foreground">{v.observacao}</p>}
                  {v.status === "realizada" && (() => {
                    const draft = resultadoForm[v.id] ?? {};
                    const setDraft = (patch: any) => setResultadoForm((prev) => ({ ...prev, [v.id]: { ...(prev[v.id] ?? {}), ...patch } }));
                    const interesse = draft.interesse_cliente ?? v.interesse_cliente ?? "";
                    const podeAvancar = !!interesse;
                    return (
                    <div className="border-t pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={interesse} onValueChange={(val) => setDraft({ interesse_cliente: val })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Interesse do cliente" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixo">Interesse baixo</SelectItem>
                            <SelectItem value="medio">Interesse médio</SelectItem>
                            <SelectItem value="alto">Interesse alto</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input className="h-8 text-xs" placeholder="Próxima ação" defaultValue={v.proxima_acao || ""} onChange={(e) => setDraft({ proxima_acao: e.target.value })} onBlur={(e) => e.target.value !== (v.proxima_acao || "") && updateVisita(v.id, { proxima_acao: e.target.value })} />
                      </div>
                      <Textarea rows={1} className="text-xs" placeholder="Feedback" defaultValue={v.feedback || ""} onChange={(e) => setDraft({ feedback: e.target.value })} onBlur={(e) => e.target.value !== (v.feedback || "") && updateVisita(v.id, { feedback: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Textarea rows={1} className="text-xs" placeholder="Pontos positivos" defaultValue={v.pontos_positivos || ""} onChange={(e) => setDraft({ pontos_positivos: e.target.value })} onBlur={(e) => e.target.value !== (v.pontos_positivos || "") && updateVisita(v.id, { pontos_positivos: e.target.value })} />
                        <Textarea rows={1} className="text-xs" placeholder="Objeções" defaultValue={v.objeções || ""} onChange={(e) => setDraft({ objeções: e.target.value })} onBlur={(e) => e.target.value !== (v.objeções || "") && updateVisita(v.id, { objeções: e.target.value })} />
                      </div>
                      {!finalizada && (
                        <div className="flex gap-2 flex-wrap items-center">
                          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => salvarResultadoVisita(v)} disabled={saving}>
                            Salvar resultado da visita
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => moverEstagio("buscando")}>Voltar p/ Buscando imóvel</Button>
                          <Button size="sm" className="h-8 text-xs" onClick={() => moverEstagio("proposta")} disabled={!podeAvancar} title={podeAvancar ? undefined : "Registre o interesse do cliente na visita realizada antes de avançar"}>Avançar p/ Proposta</Button>
                          {!podeAvancar && <span className="text-[11px] text-muted-foreground">Registre o resultado da visita para avançar.</span>}
                        </div>
                      )}
                    </div>
                    );
                  })()}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ================= PROPOSTAS ================= */}
          <TabsContent value="propostas" className="mt-4 space-y-3">
            {propostaForm ? (
              <Card className="p-3 space-y-3">
                <p className="text-sm font-medium">Nova proposta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Imóvel da proposta</Label>
                    <Select value={propostaForm.imovel_id ?? "none"} onValueChange={(v) => setPropostaForm({ ...propostaForm, imovel_id: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        {(vinculos.length ? vinculos.map((v) => ({ id: v.imovel_id, nome: imovelNome(v.imovel_id) })) : imoveis).map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Validade</Label>
                    <Input type="date" value={propostaForm.validade ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, validade: e.target.value })} />
                  </div>
                  <div>
                    <Label>Valor pedido (R$)</Label>
                    <Input type="number" value={propostaForm.valor_pedido ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, valor_pedido: e.target.value })} />
                  </div>
                  <div>
                    <Label>Valor proposto (R$)</Label>
                    <Input type="number" value={propostaForm.valor_proposto ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, valor_proposto: e.target.value })} />
                  </div>
                  <div>
                    <Label>Forma de pagamento</Label>
                    <Input value={propostaForm.forma_pagamento ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, forma_pagamento: e.target.value })} />
                  </div>
                  <div>
                    <Label>Entrada (R$)</Label>
                    <Input type="number" value={propostaForm.entrada ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, entrada: e.target.value })} />
                  </div>
                  <div>
                    <Label>Parcelamento</Label>
                    <Input value={propostaForm.parcelamento ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, parcelamento: e.target.value })} />
                  </div>
                  <div>
                    <Label>Financiamento</Label>
                    <Input value={propostaForm.financiamento ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, financiamento: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Prazos</Label>
                    <Input value={propostaForm.prazos ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, prazos: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Condições</Label>
                    <Textarea rows={2} value={propostaForm.condicoes ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, condicoes: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!propostaForm.possui_permuta} onCheckedChange={(v) => setPropostaForm({ ...propostaForm, possui_permuta: !!v })} />
                  Inclui permuta
                </label>
                {propostaForm.possui_permuta && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <Label>Imóvel oferecido em permuta</Label>
                      <Input value={propostaForm.imovel_permuta ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, imovel_permuta: e.target.value })} />
                    </div>
                    <div>
                      <Label>Valor estimado (R$)</Label>
                      <Input type="number" value={propostaForm.valor_estimado_permuta ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, valor_estimado_permuta: e.target.value })} />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={propostaForm.observacoes ?? ""} onChange={(e) => setPropostaForm({ ...propostaForm, observacoes: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={salvarProposta} disabled={saving}>Registrar proposta</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPropostaForm(null)}>Cancelar</Button>
                </div>
              </Card>
            ) : (
              !finalizada && (
                <Button size="sm" variant="outline" onClick={() => setPropostaForm({ imovel_id: "none" })}>
                  <FileText className="h-4 w-4 mr-1" /> Registrar proposta
                </Button>
              )
            )}

            {propostas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma proposta registrada.</p>}
            <div className="space-y-2">
              {propostas.map((p) => (
                <Card key={p.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-sm">
                      <span className="font-medium">{p.imovel_id ? imovelNome(p.imovel_id) : "Proposta"}</span>
                      <span className="text-muted-foreground"> · {fmtD(p.created_at)} · {nomeDe(p.created_by)}</span>
                      {p.possui_permuta && <Badge variant="outline" className="ml-2 text-[10px] bg-orange-500/10 text-orange-600 border-orange-500/30">Permuta</Badge>}
                    </div>
                    <Select value={p.status} onValueChange={(val) => updatePropostaStatus(p, val)}>
                      <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_PROPOSTA.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    {p.valor_pedido != null && <span>Pedido: {formatBRL(p.valor_pedido)}</span>}
                    {p.valor_proposto != null && <span className="text-foreground font-medium">Proposto: {formatBRL(p.valor_proposto)}</span>}
                    {p.forma_pagamento && <span>{p.forma_pagamento}</span>}
                    {p.validade && <span>Validade: {fmtD(p.validade)}</span>}
                  </div>
                  {p.condicoes && <p className="text-xs text-muted-foreground">{p.condicoes}</p>}
                  {p.status === "aceita" && !finalizada && (
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setGanhaOpen(true)}>
                      <Trophy className="h-3.5 w-3.5 mr-1" /> Marcar como Ganha
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ================= TAREFAS ================= */}
          <TabsContent value="tarefas" className="mt-4 space-y-3">
            {tarefaForm ? (
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Título *</Label>
                    <Input value={tarefaForm.titulo ?? ""} onChange={(e) => setTarefaForm({ ...tarefaForm, titulo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Data e hora *</Label>
                    <Input type="datetime-local" value={tarefaForm.prazo ?? ""} onChange={(e) => setTarefaForm({ ...tarefaForm, prazo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Select value={tarefaForm.responsavel_id ?? "none"} onValueChange={(v) => setTarefaForm({ ...tarefaForm, responsavel_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Responsável da oportunidade" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Responsável da oportunidade</SelectItem>
                        {corretores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={salvarTarefa}>Criar tarefa</Button>
                  <Button size="sm" variant="ghost" onClick={() => setTarefaForm(null)}>Cancelar</Button>
                </div>
              </Card>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setTarefaForm({ responsavel_id: "none" })}>Nova tarefa / próxima ação</Button>
            )}
            <div className="space-y-2">
              {tarefas.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 border rounded-md p-2.5 text-sm">
                  <div className="min-w-0">
                    <p className={t.status === "Concluída" ? "line-through text-muted-foreground" : ""}>{t.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDt(t.prazo)} · {nomeDe(t.responsavel_id)}</p>
                  </div>
                  {t.status !== "Concluída" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => concluirTarefa(t.id)}>Concluir</Button>
                  )}
                </div>
              ))}
              {tarefas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa. Defina a próxima ação.</p>}
            </div>
          </TabsContent>

          {/* ================= HISTÓRICO ================= */}
          <TabsContent value="historico" className="mt-4">
            <div className="space-y-2">
              {historico.map((h) => (
                <div key={h.id} className="border-l-2 border-border pl-3 py-1">
                  <p className="text-sm">{h.descricao}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDt(h.created_at)} · {nomeDe(h.created_by)}</p>
                </div>
              ))}
              {historico.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          {isAdmin && <Button variant="destructive" onClick={excluir} className="mr-auto">Excluir</Button>}
          {!finalizada && (
            <>
              <Button variant="secondary" onClick={salvarDiagnostico} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
              <Button variant="outline" className="text-zinc-600" onClick={() => setPerdidaOpen(true)}>
                <XCircle className="h-4 w-4 mr-1" /> Perdida
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setGanhaOpen(true)}>
                <Trophy className="h-4 w-4 mr-1" /> Ganha
              </Button>
            </>
          )}
        </DialogFooter>

        <GanhaDialog open={ganhaOpen} onOpenChange={setGanhaOpen} oportunidade={op} onSaved={() => { reload(op.id); onSaved(); }} />
        <PerdidaDialog open={perdidaOpen} onOpenChange={setPerdidaOpen} oportunidade={op} onSaved={() => { reload(op.id); onSaved(); }} />
      </DialogContent>
    </Dialog>
  );
}
