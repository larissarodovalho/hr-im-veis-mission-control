import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowRight, CalendarClock, ExternalLink, HandCoins, History, XCircle } from "lucide-react";
import { MOTIVOS_CANCELAMENTO, CATEGORIA_LABEL, categoriaDe, qualificacaoInfo } from "@/lib/contasFunil";
import { TEMPERATURAS } from "@/lib/contasTemperatura";
import { estagioLabel } from "@/lib/oportunidadesFunil";
import { formatBRL } from "@/lib/format";

type Resultado = "agora" | "futura" | "nao_qualificado";
type OpAtiva = { id: string; titulo: string; estagio: string; valor_alvo: number | null; corretor_id: string | null };

const RESULTADOS: { id: Resultado; label: string; desc: string }[] = [
  { id: "agora", label: "Gerar oportunidade agora", desc: "Cria a oportunidade na etapa Nova do funil de Oportunidades de Negócio." },
  { id: "futura", label: "Oportunidade futura", desc: "Mantém a conta em Contato estabelecido e agenda a próxima ação." },
  { id: "nao_qualificado", label: "Não qualificado", desc: "Move a conta para Contato cancelado (motivo obrigatório)." },
];

const PRIORIDADES = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Média" },
  { id: "baixa", label: "Baixa" },
];

/**
 * Modal de qualificação da conta (etapa "Contato estabelecido") que gera a
 * Oportunidade de Negócio de forma integrada, idempotente e à prova de duplicidade.
 */
export default function QualificacaoOportunidadeDialog({
  open,
  onOpenChange,
  conta,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conta: any | null;
  onDone?: (resultado: "criada" | "futura" | "nao_qualificado", oportunidadeId?: string) => void;
}) {
  const { user } = useAuth();
  const [chave, setChave] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [opsAtivas, setOpsAtivas] = useState<OpAtiva[]>([]);
  const [leadInfo, setLeadInfo] = useState<{ nome: string; origem: string | null } | null>(null);
  const [ultimas, setUltimas] = useState<{ created_at: string; descricao: string | null; resultado: string | null }[]>([]);
  const [confirmarOutra, setConfirmarOutra] = useState(false);
  const [resultado, setResultado] = useState<Resultado>("agora");

  const [form, setForm] = useState<any>({});
  const [futura, setFutura] = useState<{ proximaData: string; temperatura: string }>({ proximaData: "", temperatura: "" });
  const [nq, setNq] = useState<{ motivo: string; outro: string; obs: string }>({ motivo: "", outro: "", obs: "" });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!open || !conta) return;
    setChave(crypto.randomUUID());
    setResultado("agora");
    setConfirmarOutra(false);
    setSaving(false);
    setForm({
      titulo: "",
      descricao_busca: conta.interesse ?? "",
      tipo_imovel: "",
      cidade: "",
      bairro: "",
      valor_alvo: "",
      prioridade: "media",
      corretor_id: conta.responsavel_id ?? "",
      forma_pagamento: "",
      prazo_pretendido: "",
      possibilidade_financiamento: false,
      possui_permuta: false,
      imovel_permuta: "",
      valor_estimado_permuta: "",
      caracteristicas_indispensaveis: "",
      observacoes: "",
    });
    setFutura({ proximaData: "", temperatura: conta.temperatura ?? "" });
    setNq({ motivo: "", outro: "", obs: "" });

    const loadAux = async () => {
      setLoading(true);
      const [{ data: profs }, { data: ops }, { data: ints }] = await Promise.all([
        supabase.from("profiles").select("user_id,nome"),
        supabase
          .from("oportunidades")
          .select("id,titulo,estagio,valor_alvo,corretor_id")
          .eq("conta_id", conta.id)
          .in("estagio", ["nova", "buscando", "visita", "proposta"]),
        supabase
          .from("interacoes")
          .select("created_at,descricao,resultado")
          .eq("conta_id", conta.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      const seen = new Set<string>();
      setCorretores(
        (profs ?? [])
          .filter((p: any) => p.user_id && !seen.has(p.user_id) && seen.add(p.user_id))
          .map((p: any) => ({ id: p.user_id, nome: p.nome }))
      );
      setOpsAtivas((ops ?? []) as OpAtiva[]);
      setUltimas(ints ?? []);
      if (conta.lead_id_origem) {
        const { data: l } = await supabase
          .from("leads")
          .select("nome,origem")
          .eq("id", conta.lead_id_origem)
          .maybeSingle();
        setLeadInfo(l ?? null);
      } else {
        setLeadInfo(null);
      }
      setLoading(false);
    };
    loadAux();
  }, [open, conta?.id]);

  const pendencias = useMemo(() => {
    const p: string[] = [];
    if (!form.titulo?.trim()) p.push("Título");
    if (!form.descricao_busca?.trim()) p.push("Descrição da busca");
    if (!form.tipo_imovel?.trim()) p.push("Tipo de imóvel");
    if (!form.cidade?.trim() && !form.bairro?.trim()) p.push("Cidade ou região");
    if (!form.valor_alvo) p.push("Valor-alvo");
    if (!form.corretor_id) p.push("Corretor responsável");
    return p;
  }, [form]);

  const dupBlock = opsAtivas.length > 0 && !confirmarOutra;
  const canGerar = pendencias.length === 0 && !dupBlock && !saving && !loading;

  const gerarAgora = async () => {
    if (!canGerar) return;
    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      descricao_busca: form.descricao_busca.trim(),
      tipo_imovel: form.tipo_imovel.trim(),
      cidade: form.cidade.trim(),
      bairro: form.bairro.trim(),
      valor_alvo: form.valor_alvo ? Number(form.valor_alvo) : null,
      prioridade: form.prioridade,
      corretor_id: form.corretor_id || null,
      forma_pagamento: form.forma_pagamento?.trim() ?? "",
      prazo_pretendido: form.prazo_pretendido?.trim() ?? "",
      possibilidade_financiamento: !!form.possibilidade_financiamento,
      possui_permuta: !!form.possui_permuta,
      imovel_permuta: form.imovel_permuta?.trim() ?? "",
      valor_estimado_permuta: form.valor_estimado_permuta ? Number(form.valor_estimado_permuta) : null,
      caracteristicas_indispensaveis: form.caracteristicas_indispensaveis?.trim() ?? "",
      observacoes: form.observacoes?.trim() ?? "",
    };
    const { data, error } = await supabase.rpc("criar_oportunidade_qualificada" as any, {
      p_conta_id: conta.id,
      p_payload: payload,
      p_chave: chave,
    });
    setSaving(false);
    if (error) return toast.error("Erro ao criar oportunidade: " + error.message);
    const opId = (data as any)?.oportunidade_id as string | undefined;
    if ((data as any)?.ja_existia) {
      toast.info("Esta oportunidade já havia sido criada (reenvio detectado, sem duplicar).");
    } else {
      toast.success("Oportunidade criada em Oportunidades de Negócio > Nova");
    }
    onDone?.("criada", opId);
    onOpenChange(false);
  };

  const salvarFutura = async () => {
    if (!futura.proximaData) return toast.error("Informe a data/hora da próxima ação");
    if (saving) return;
    setSaving(true);
    const proxIso = new Date(futura.proximaData).toISOString();
    const patch: any = {
      qualificacao_status: "oportunidade_futura",
      qualificacao_em: new Date().toISOString(),
      qualificacao_por: user?.id ?? null,
      proxima_acao_em: proxIso,
      destino_comercial: "oportunidade_futura",
    };
    if (futura.temperatura) patch.temperatura = futura.temperatura;
    const { error } = await supabase.from("contas").update(patch).eq("id", conta.id);
    if (error) {
      setSaving(false);
      return toast.error("Erro ao salvar: " + error.message);
    }
    await supabase.from("tarefas").insert({
      conta_id: conta.id,
      titulo: `Retomar qualificação — ${conta.nome}`,
      descricao: "Conta qualificada como oportunidade futura. Retomar o contato para gerar a oportunidade de negócio.",
      status: "A fazer",
      prioridade: "Média",
      prazo: proxIso,
      created_by: user?.id,
    } as any);
    await supabase.from("interacoes").insert({
      conta_id: conta.id,
      tipo: "nota",
      descricao: `Qualificação: oportunidade futura. Próxima ação em ${format(new Date(proxIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`,
      resultado: "qualificacao_futura",
      created_by: user?.id,
    } as any);
    setSaving(false);
    toast.success("Conta marcada como oportunidade futura");
    onDone?.("futura");
    onOpenChange(false);
  };

  const salvarNaoQualificado = async () => {
    if (!nq.motivo) return toast.error("Selecione o motivo");
    if (nq.motivo === "Outro" && !nq.outro.trim()) return toast.error("Descreva o motivo");
    if (saving) return;
    setSaving(true);
    const motivoFinal = nq.motivo === "Outro" ? `Outro: ${nq.outro.trim()}` : nq.motivo;
    const { error } = await supabase
      .from("contas")
      .update({
        etapa_funil: "contato_cancelado",
        motivo_cancelamento: motivoFinal,
        cancelado_em: new Date().toISOString(),
        cancelado_por: user?.id ?? null,
        qualificacao_status: "nao_qualificado",
        qualificacao_em: new Date().toISOString(),
        qualificacao_por: user?.id ?? null,
      } as any)
      .eq("id", conta.id);
    if (error) {
      setSaving(false);
      return toast.error("Erro ao salvar: " + error.message);
    }
    await supabase.from("interacoes").insert({
      conta_id: conta.id,
      tipo: "nota",
      descricao: `Qualificação: não qualificado → Contato cancelado. Motivo: ${motivoFinal}.${nq.obs.trim() ? ` ${nq.obs.trim()}` : ""}`,
      resultado: "qualificacao_nao_qualificado",
      created_by: user?.id,
    } as any);
    setSaving(false);
    toast.success("Conta movida para Contato cancelado");
    onDone?.("nao_qualificado");
    onOpenChange(false);
  };

  const submit = () => {
    if (resultado === "agora") return gerarAgora();
    if (resultado === "futura") return salvarFutura();
    return salvarNaoQualificado();
  };

  if (!conta) return null;
  const categoria = categoriaDe(conta);
  const qInfo = qualificacaoInfo(conta.qualificacao_status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary" /> Qualificação da oportunidade
          </DialogTitle>
        </DialogHeader>

        {/* Resumo da conta */}
        <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{conta.nome}</span>
            {categoria && (
              <Badge variant="outline" className="text-[10px]">{CATEGORIA_LABEL[categoria]}</Badge>
            )}
            {qInfo && (
              <Badge variant="outline" className={`text-[10px] ${qInfo.badge}`}>{qInfo.label}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {[conta.telefone, conta.email].filter(Boolean).join(" · ") || "Sem contato cadastrado"}
          </p>
          <p className="text-xs text-muted-foreground">
            Origem: {conta.origem ?? leadInfo?.origem ?? "—"}
            {leadInfo && ` · Lead de origem: ${leadInfo.nome}`}
          </p>
          {ultimas.length > 0 && (
            <div className="pt-1 space-y-1">
              <p className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
                <History className="h-3 w-3" /> Últimas interações
              </p>
              {ultimas.map((i, idx) => (
                <p key={idx} className="text-[11px] text-muted-foreground truncate">
                  {format(new Date(i.created_at), "dd/MM HH:mm")} — {i.descricao ?? ""}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Prevenção de duplicidade */}
        {opsAtivas.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Esta conta já possui {opsAtivas.length === 1 ? "uma oportunidade ativa" : `${opsAtivas.length} oportunidades ativas`}
            </p>
            {opsAtivas.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {estagioLabel(o.estagio)}{o.valor_alvo ? ` · ${formatBRL(o.valor_alvo)}` : ""}
                  </p>
                </div>
                <Link
                  to={`/crm/oportunidades?op=${o.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                  onClick={() => onOpenChange(false)}
                >
                  Abrir <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
            <label className="flex items-start gap-2 text-sm cursor-pointer pt-1">
              <Checkbox checked={confirmarOutra} onCheckedChange={(v) => setConfirmarOutra(!!v)} className="mt-0.5" />
              <span>É uma busca realmente diferente — quero criar outra oportunidade para esta conta.</span>
            </label>
          </div>
        )}

        {/* Resultado da qualificação */}
        <div className="space-y-2">
          <Label>Resultado da qualificação *</Label>
          <RadioGroup value={resultado} onValueChange={(v) => setResultado(v as Resultado)} className="space-y-2">
            {RESULTADOS.map((r) => (
              <label
                key={r.id}
                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                  resultado === r.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                }`}
              >
                <RadioGroupItem value={r.id} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.desc}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Dados da oportunidade (resultado: gerar agora) */}
        {resultado === "agora" && (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-semibold">Dados da busca do cliente</p>
            <div className="space-y-1.5">
              <Label>Título da oportunidade *</Label>
              <Input
                value={form.titulo ?? ""}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="Ex.: Casa até R$ 1,5 mi no Alameda"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição da busca *</Label>
              <Textarea
                value={form.descricao_busca ?? ""}
                onChange={(e) => set("descricao_busca", e.target.value)}
                placeholder="O que o cliente procura, perfil, exigências..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de imóvel *</Label>
                <Input
                  value={form.tipo_imovel ?? ""}
                  onChange={(e) => set("tipo_imovel", e.target.value)}
                  placeholder="Casa, apartamento, terreno..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor-alvo *</Label>
                <CurrencyInput
                  value={form.valor_alvo ?? ""}
                  onChange={(v) => set("valor_alvo", v)}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade *</Label>
                <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} placeholder="Sinop" />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro / região</Label>
                <Input value={form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} placeholder="Alameda, Jardim..." />
              </div>
              <div className="space-y-1.5">
                <Label>Corretor responsável *</Label>
                <Select value={form.corretor_id ?? ""} onValueChange={(v) => set("corretor_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {corretores.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select value={form.prioridade ?? "media"} onValueChange={(v) => set("prioridade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Input
                  value={form.forma_pagamento ?? ""}
                  onChange={(e) => set("forma_pagamento", e.target.value)}
                  placeholder="À vista, financiamento..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo pretendido</Label>
                <Input
                  value={form.prazo_pretendido ?? ""}
                  onChange={(e) => set("prazo_pretendido", e.target.value)}
                  placeholder="Ex.: 3 meses, imediato..."
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!form.possibilidade_financiamento}
                onCheckedChange={(v) => set("possibilidade_financiamento", !!v)}
              />
              Possibilidade de financiamento
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={!!form.possui_permuta} onCheckedChange={(v) => set("possui_permuta", !!v)} />
                Possui permuta
              </label>
              {form.possui_permuta && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1.5">
                    <Label>Imóvel da permuta</Label>
                    <Input
                      value={form.imovel_permuta ?? ""}
                      onChange={(e) => set("imovel_permuta", e.target.value)}
                      placeholder="Descreva o imóvel oferecido"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor estimado da permuta</Label>
                    <CurrencyInput
                      value={form.valor_estimado_permuta ?? ""}
                      onChange={(v) => set("valor_estimado_permuta", v)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Características indispensáveis</Label>
              <Textarea
                value={form.caracteristicas_indispensaveis ?? ""}
                onChange={(e) => set("caracteristicas_indispensaveis", e.target.value)}
                placeholder="Ex.: 3 suítes, quintal, aceita pets..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes ?? ""}
                onChange={(e) => set("observacoes", e.target.value)}
                rows={2}
              />
            </div>
            {pendencias.length > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Preencha: {pendencias.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Oportunidade futura */}
        {resultado === "futura" && (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" /> Próxima ação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data/hora da próxima ação *</Label>
                <Input
                  type="datetime-local"
                  value={futura.proximaData}
                  onChange={(e) => setFutura({ ...futura, proximaData: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temperatura</Label>
                <Select value={futura.temperatura} onValueChange={(v) => setFutura({ ...futura, temperatura: v })}>
                  <SelectTrigger><SelectValue placeholder="Manter atual" /></SelectTrigger>
                  <SelectContent>
                    {TEMPERATURAS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Uma tarefa de retomada será criada e a conta permanecerá em Contato estabelecido.
            </p>
          </div>
        )}

        {/* Não qualificado */}
        {resultado === "nao_qualificado" && (
          <div className="space-y-3 rounded-md border border-destructive/30 p-3">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-destructive" /> Motivo do cancelamento
            </p>
            <div className="space-y-1.5">
              <Label>Motivo *</Label>
              <Select value={nq.motivo} onValueChange={(v) => setNq({ ...nq, motivo: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CANCELAMENTO.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {nq.motivo === "Outro" && (
              <div className="space-y-1.5">
                <Label>Descreva o motivo *</Label>
                <Input value={nq.outro} onChange={(e) => setNq({ ...nq, outro: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observação</Label>
              <Textarea value={nq.obs} onChange={(e) => setNq({ ...nq, obs: e.target.value })} rows={2} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving || (resultado === "agora" && !canGerar)}
            variant={resultado === "nao_qualificado" ? "destructive" : "default"}
          >
            {resultado === "agora" && (
              <><ArrowRight className="h-4 w-4 mr-1" /> {saving ? "Gerando..." : "Gerar oportunidade agora"}</>
            )}
            {resultado === "futura" && (saving ? "Salvando..." : "Salvar como oportunidade futura")}
            {resultado === "nao_qualificado" && (saving ? "Salvando..." : "Confirmar não qualificado")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
