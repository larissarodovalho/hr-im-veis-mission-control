import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageCircle, Mic, Phone, Link2, CalendarClock, Compass, RotateCcw, XCircle, AlertTriangle,
} from "lucide-react";
import {
  ETAPAS, etapaLabel, etapaColor, isEtapaLegado, destinoLabel,
  DESTINOS_COMERCIAIS, DestinoComercial, EtapaFunil,
} from "@/lib/contasFunil";
import ContaCancelarDialog, { CancelamentoData } from "@/components/contas/ContaCancelarDialog";

interface Props {
  conta: any;
  corretores: { user_id: string; nome: string | null }[];
  onChanged: () => void;
}

const RESULTADOS_CONTATO = [
  { id: "sem_resposta", label: "Sem resposta" },
  { id: "respondeu", label: "Respondeu / conversou" },
  { id: "invalido", label: "Contato inválido" },
];

export default function ContaFluxoAtendimento({ conta, corretores, onChanged }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dlg, setDlg] = useState<null | "contato1" | "contato2" | "tentativa" | "link" | "retorno" | "destino" | "moverLegado">(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [legacyTarget, setLegacyTarget] = useState<EtapaFunil | "">("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const etapa = (conta.etapa_funil ?? "a_contatar") as string;
  const legado = isEtapaLegado(etapa);
  const nomeDe = (uid?: string | null) =>
    uid ? corretores.find((c) => c.user_id === uid)?.nome ?? "—" : "—";
  const destinoAtual = destinoLabel(conta.destino_comercial);

  const registrar = async (tipo: string, descricao: string, extra: Record<string, any> = {}) => {
    await supabase.from("interacoes").insert({
      conta_id: conta.id, tipo, descricao, created_by: userId, ...extra,
    } as any);
  };

  const moverPara = async (nova: EtapaFunil, extra: Record<string, any> = {}, msg?: string) => {
    setSaving(true);
    const patch: Record<string, any> = { etapa_funil: nova, ...extra };
    // Saindo do cancelamento: limpa os campos de cancelamento
    if (etapa === "contato_cancelado" && nova !== "contato_cancelado") {
      patch.motivo_cancelamento = null;
      patch.cancelado_em = null;
      patch.cancelado_por = null;
    }
    const { error } = await supabase.from("contas").update(patch as any).eq("id", conta.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(msg ?? `Movida para ${etapaLabel(nova)}`);
    onChanged();
  };

  const confirmarCancelamento = async ({ motivo, agradecimento }: CancelamentoData) => {
    const { error } = await supabase.from("contas").update({
      etapa_funil: "contato_cancelado",
      motivo_cancelamento: motivo,
      cancelado_em: new Date().toISOString(),
      cancelado_por: userId,
    } as any).eq("id", conta.id);
    if (error) { toast.error(error.message); return; }
    await registrar(
      "nota",
      `Contato cancelado. Motivo: ${motivo}.${agradecimento ? ` Mensagem de agradecimento registrada: "${agradecimento}"` : ""}`,
      { resultado: "cancelado" }
    );
    toast.success("Atendimento encerrado — cadastro e histórico preservados");
    onChanged();
  };

  // ---- Ações de cada etapa ----
  const salvarContato1 = async () => {
    const canal = form.canal || "WhatsApp";
    const resultado = form.resultado || "sem_resposta";
    setSaving(true);
    await registrar("mensagem",
      `1º contato (mensagem) via ${canal}. Resultado: ${RESULTADOS_CONTATO.find(r => r.id === resultado)?.label}.${form.obs ? ` Obs: ${form.obs}` : ""}`,
      { resultado });
    await moverPara("contatado", {}, "1º contato registrado — movida para Contatado");
    setSaving(false);
    setDlg(null);
  };

  const salvarContato2 = async () => {
    const tipo = form.tipo || "audio";
    const resultado = form.resultado;
    if (!resultado) return toast.error("Selecione o resultado");
    setSaving(true);
    await registrar(tipo === "audio" ? "audio" : "ligacao",
      `2º contato (${tipo === "audio" ? "áudio" : "ligação"}). Resultado: ${RESULTADOS_CONTATO.find(r => r.id === resultado)?.label}.${form.obs ? ` Obs: ${form.obs}` : ""}`,
      { resultado });
    setSaving(false);
    setDlg(null);
    if (resultado === "respondeu") await moverPara("contato_estabelecido");
    else if (resultado === "sem_resposta") await moverPara("sem_retorno");
    else setCancelOpen(true); // inválido → cancelamento com motivo
  };

  const salvarTentativa = async () => {
    const tipo = form.tipo || "mensagem";
    const tipoLabel = tipo === "mensagem" ? "mensagem" : tipo === "audio" ? "áudio" : "ligação";
    setSaving(true);
    await registrar(tipo,
      `Nova tentativa de contato (${tipoLabel}) na etapa Sem retorno.${form.obs ? ` Obs: ${form.obs}` : ""}`,
      { resultado: form.resultado || null });
    setSaving(false);
    setDlg(null);
    toast.success("Tentativa registrada");
    onChanged();
  };

  const salvarLink = async () => {
    if (!form.link?.trim()) return toast.error("Informe o link enviado");
    setSaving(true);
    await registrar("mensagem", `Link enviado: ${form.link.trim()}${form.obs ? `. Obs: ${form.obs}` : ""}`, { resultado: "link_enviado" });
    setSaving(false);
    setDlg(null);
    toast.success("Envio de link registrado");
    onChanged();
  };

  const salvarRetorno = async () => {
    if (!form.prazo) return toast.error("Informe a próxima data de contato");
    setSaving(true);
    const prazoIso = new Date(form.prazo).toISOString();
    const { error } = await supabase.from("tarefas").insert({
      conta_id: conta.id,
      titulo: `Retornar contato com ${conta.nome}`,
      descricao: form.obs?.trim() || null,
      prazo: prazoIso,
      prioridade: "Média",
      status: "A fazer",
      responsavel_id: conta.responsavel_id ?? userId,
      created_by: userId,
    } as any);
    if (error) { setSaving(false); return toast.error(error.message); }
    await registrar("nota",
      `Tarefa de retorno criada para ${format(new Date(prazoIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.${form.obs ? ` Obs: ${form.obs}` : ""}`,
      { proxima_acao: "Retorno agendado", agendado_para: prazoIso });
    setSaving(false);
    setDlg(null);
    toast.success("Tarefa de retorno criada");
    onChanged();
  };

  const salvarDestino = async () => {
    if (!form.destino) return toast.error("Selecione o destino comercial");
    const label = destinoLabel(form.destino);
    setSaving(true);
    const { error } = await supabase.from("contas").update({ destino_comercial: form.destino } as any).eq("id", conta.id);
    if (error) { setSaving(false); return toast.error(error.message); }
    await registrar("nota", `Destino comercial definido: ${label}.`, { resultado: "destino_comercial" });
    setSaving(false);
    setDlg(null);
    toast.success(`Destino comercial: ${label}`);
    onChanged();
  };

  const openDlg = (which: NonNullable<typeof dlg>, initial: any = {}) => {
    setForm(initial);
    setDlg(which);
  };

  const dialogComum = (
    title: string, desc: string, children: React.ReactNode, onSave: () => void, saveLabel = "Registrar"
  ) => (
    <Dialog open onOpenChange={(o) => !o && setDlg(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDlg(null)} disabled={saving}>Voltar</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Salvando…" : saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" /> Fluxo de atendimento
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`${etapaColor(etapa)} text-xs`}>
            {etapaLabel(etapa)}{legado ? " (legado)" : ""}
          </Badge>
          {destinoAtual && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              Destino: {destinoAtual}
            </Badge>
          )}
        </div>
      </div>

      {/* Etapa legada */}
      {legado && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
          <p className="text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            Esta conta está na etapa legada <strong>{etapaLabel(etapa)}</strong>, preservada até a criação do
            módulo de Oportunidades. Você pode trazê-la para o fluxo de atendimento atual:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={legacyTarget} onValueChange={(v) => setLegacyTarget(v as EtapaFunil)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Mover para…" /></SelectTrigger>
              <SelectContent>
                {ETAPAS.filter((e) => e.id !== "contato_cancelado").map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!legacyTarget || saving}
              onClick={() => legacyTarget && moverPara(legacyTarget as EtapaFunil)}
            >
              Mover
            </Button>
          </div>
        </div>
      )}

      {/* A CONTATAR */}
      {!legado && etapa === "a_contatar" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Primeira etapa do funil. A ação prevista é o <strong>1º contato: mensagem</strong>.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => openDlg("contato1", { canal: "WhatsApp", resultado: "sem_resposta" })}>
              <MessageCircle className="h-4 w-4 mr-1" /> Registrar 1º contato (mensagem)
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar contato
            </Button>
          </div>
        </div>
      )}

      {/* CONTATADO */}
      {!legado && etapa === "contatado" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Primeira abordagem feita. Agora realize o <strong>2º contato: áudio ou ligação</strong>.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => openDlg("contato2", { tipo: "audio" })}>
              <Mic className="h-4 w-4 mr-1" /> Registrar 2º contato (áudio/ligação)
            </Button>
            <Button size="sm" variant="outline" onClick={() => moverPara("sem_retorno")}>
              Mover para Sem retorno
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar contato
            </Button>
          </div>
        </div>
      )}

      {/* SEM RETORNO */}
      {!legado && etapa === "sem_retorno" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            A conta não respondeu às tentativas — mas não é uma perda definitiva. Continue as ações de retorno:
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => openDlg("tentativa", { tipo: "mensagem" })}>
              <Phone className="h-4 w-4 mr-1" /> Registrar nova tentativa
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDlg("link")}>
              <Link2 className="h-4 w-4 mr-1" /> Registrar envio de link
            </Button>
            <Button size="sm" variant="outline" onClick={() => openDlg("retorno")}>
              <CalendarClock className="h-4 w-4 mr-1" /> Criar tarefa de retorno
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            <Button size="sm" variant="ghost" onClick={() => moverPara("contatado")}>Voltar para Contatado</Button>
            <Button size="sm" variant="ghost" onClick={() => moverPara("contato_estabelecido")}>Mover para Contato estabelecido</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar contato
            </Button>
          </div>
        </div>
      )}

      {/* CONTATO ESTABELECIDO */}
      {!legado && etapa === "contato_estabelecido" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Conversa efetiva em andamento. Defina o <strong>destino comercial</strong> desta conta
            (a criação de oportunidades virá na próxima etapa da reestruturação).
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => openDlg("destino", { destino: conta.destino_comercial ?? "" })}>
              <Compass className="h-4 w-4 mr-1" /> {destinoAtual ? "Alterar destino comercial" : "Definir destino comercial"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Cancelar contato
            </Button>
          </div>
        </div>
      )}

      {/* CONTATO CANCELADO */}
      {!legado && etapa === "contato_cancelado" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" /> Atendimento encerrado
          </p>
          <p className="text-sm text-muted-foreground">
            Motivo: <span className="text-foreground">{conta.motivo_cancelamento ?? conta.motivo_desclassificacao ?? "—"}</span>
          </p>
          {conta.cancelado_em && (
            <p className="text-xs text-muted-foreground">
              Em {format(new Date(conta.cancelado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {conta.cancelado_por ? ` · por ${nomeDe(conta.cancelado_por)}` : ""}
            </p>
          )}
          <div className="pt-1">
            <Button size="sm" variant="outline" onClick={() => moverPara("a_contatar", {}, "Atendimento reaberto em A contatar")}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reabrir atendimento
            </Button>
          </div>
        </div>
      )}

      {/* Diálogos */}
      {dlg === "contato1" && dialogComum(
        "Registrar 1º contato (mensagem)",
        "A conta será movida para Contatado e a atividade vai para o histórico.",
        <>
          <div>
            <Label>Canal</Label>
            <Select value={form.canal ?? "WhatsApp"} onValueChange={(v) => setForm({ ...form, canal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resultado</Label>
            <Select value={form.resultado ?? "sem_resposta"} onValueChange={(v) => setForm({ ...form, resultado: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_resposta">Mensagem enviada — aguardando</SelectItem>
                <SelectItem value="respondeu">Respondeu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </div>
        </>,
        salvarContato1
      )}

      {dlg === "contato2" && dialogComum(
        "Registrar 2º contato (áudio ou ligação)",
        "O resultado define a próxima etapa da conta automaticamente.",
        <>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo ?? "audio"} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="audio">Áudio</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resultado *</Label>
            <Select value={form.resultado ?? ""} onValueChange={(v) => setForm({ ...form, resultado: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="respondeu">Respondeu — conversa efetiva → Contato estabelecido</SelectItem>
                <SelectItem value="sem_resposta">Sem resposta → Sem retorno</SelectItem>
                <SelectItem value="invalido">Contato inválido → Contato cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </div>
        </>,
        salvarContato2
      )}

      {dlg === "tentativa" && dialogComum(
        "Registrar nova tentativa",
        "A conta permanece em Sem retorno e a tentativa entra no histórico.",
        <>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo ?? "mensagem"} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensagem">Mensagem</SelectItem>
                <SelectItem value="audio">Áudio</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resultado</Label>
            <Select value={form.resultado ?? "sem_resposta"} onValueChange={(v) => setForm({ ...form, resultado: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_resposta">Sem resposta</SelectItem>
                <SelectItem value="respondeu">Respondeu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </div>
        </>,
        salvarTentativa
      )}

      {dlg === "link" && dialogComum(
        "Registrar envio de link",
        "O link enviado fica registrado na linha do tempo da conta.",
        <>
          <div>
            <Label>Link enviado *</Label>
            <Input placeholder="https://…" value={form.link ?? ""} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </div>
        </>,
        salvarLink
      )}

      {dlg === "retorno" && dialogComum(
        "Criar tarefa de retorno",
        "Define a próxima data de contato e cria uma tarefa para o responsável.",
        <>
          <div>
            <Label>Próxima data de contato *</Label>
            <Input type="datetime-local" value={form.prazo ?? ""} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => setForm({ ...form, obs: e.target.value })} />
          </div>
        </>,
        salvarRetorno,
        "Criar tarefa"
      )}

      {dlg === "destino" && dialogComum(
        "Definir destino comercial",
        "A escolha fica salva na conta e registrada no histórico. A categoria (Carteira/Marketing) não muda.",
        <RadioGroup value={form.destino ?? ""} onValueChange={(v) => setForm({ ...form, destino: v as DestinoComercial })} className="space-y-2">
          {DESTINOS_COMERCIAIS.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-3 hover:bg-muted/40">
              <RadioGroupItem value={d.id} /> {d.label}
            </label>
          ))}
        </RadioGroup>,
        salvarDestino,
        "Salvar destino"
      )}

      <ContaCancelarDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        contaNome={conta.nome}
        onConfirm={confirmarCancelamento}
      />
    </Card>
  );
}
