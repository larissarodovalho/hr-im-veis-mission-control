import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MOTIVOS_PERDA, DESTINOS_CONTA_PERDA } from "@/lib/oportunidadesFunil";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Modal obrigatório de perda — define o destino da Conta.
 * A conta nunca é excluída nem duplicada: ela retorna/permanece no relacionamento
 * da categoria original (Carteira ou Marketing).
 */
export default function PerdidaDialog({
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
  const { user } = useAuth();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !oportunidade) return;
    setForm({
      motivo: "",
      obs: "",
      destino: "oportunidade_futura",
      proxima_data: "",
      proxima_acao: "",
      motivo_cancelamento: "",
    });
  }, [open, oportunidade]);

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const confirmar = async () => {
    if (!form.motivo) return toast.error("Selecione o motivo da perda");
    if (form.motivo === "Outro" && !form.obs?.trim()) return toast.error("Descreva o motivo em Observação");
    if (form.destino === "oportunidade_futura" && !form.proxima_data) return toast.error("Informe a data do próximo contato");
    if (form.destino === "continuar_relacionamento" && !form.proxima_data) return toast.error("Informe a data da próxima ação");
    if (form.destino === "contato_cancelado" && !form.motivo_cancelamento?.trim()) return toast.error("Informe o motivo do cancelamento da conta");
    setSaving(true);

    const contaId = oportunidade.conta_id || (oportunidade.cliente_tipo === "conta" ? oportunidade.cliente_id : null);

    const { error } = await supabase.from("oportunidades").update({
      estagio: "perdida",
      motivo_perda: form.motivo,
      obs_perda: form.obs?.trim() || null,
      destino_conta_perda: form.destino,
      encerrada_em: new Date().toISOString(),
      encerrada_por: user?.id,
    } as any).eq("id", oportunidade.id);
    if (error) { setSaving(false); return toast.error(error.message); }

    // Destino da conta (categoria original preservada em todos os casos)
    if (contaId) {
      if (form.destino === "oportunidade_futura") {
        await supabase.from("contas").update({ destino_comercial: "oportunidade_futura" } as any).eq("id", contaId);
      } else if (form.destino === "continuar_relacionamento") {
        await supabase.from("contas").update({ etapa_funil: "contato_estabelecido", destino_comercial: null } as any).eq("id", contaId);
      } else if (form.destino === "contato_cancelado") {
        await supabase.from("contas").update({
          etapa_funil: "contato_cancelado",
          motivo_cancelamento: form.motivo_cancelamento.trim(),
          cancelado_em: new Date().toISOString(),
          cancelado_por: user?.id,
        } as any).eq("id", contaId);
      }

      // Tarefa futura (Oportunidade futura / Continuar relacionamento)
      if ((form.destino === "oportunidade_futura" || form.destino === "continuar_relacionamento") && form.proxima_data) {
        const prazoIso = new Date(form.proxima_data).toISOString();
        const titulo = form.destino === "oportunidade_futura"
          ? `Retomar contato — oportunidade futura (${oportunidade.titulo})`
          : (form.proxima_acao?.trim() || `Próxima ação — ${oportunidade.titulo}`);
        await supabase.from("tarefas").insert({
          conta_id: contaId,
          titulo,
          descricao: `Origem: perda da oportunidade "${oportunidade.titulo}". Motivo: ${form.motivo}.`,
          prazo: prazoIso,
          prioridade: "Média",
          status: "A fazer",
          responsavel_id: oportunidade.corretor_id ?? user?.id,
          created_by: user?.id,
        } as any);
        await supabase.from("interacoes").insert({
          conta_id: contaId, tipo: "nota",
          descricao: `Tarefa de retorno criada para ${format(new Date(prazoIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} após perda da oportunidade.`,
          created_by: user?.id,
        } as any);
      }

      const destinoLabel = DESTINOS_CONTA_PERDA.find((d) => d.id === form.destino)?.label;
      await supabase.from("interacoes").insert({
        conta_id: contaId, oportunidade_id: oportunidade.id, tipo: "nota",
        descricao: `Oportunidade marcada como PERDIDA. Motivo: ${form.motivo}.${form.obs?.trim() ? ` Obs: ${form.obs.trim()}.` : ""} Destino da conta: ${destinoLabel}.`,
        created_by: user?.id,
      } as any);
    }

    setSaving(false);
    toast.success("Oportunidade encerrada como perdida");
    onOpenChange(false);
    onSaved();
  };

  if (!oportunidade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-zinc-500" /> Marcar como Perdida
          </DialogTitle>
          <DialogDescription>
            Encerramento de "{oportunidade.titulo}". A conta não é excluída — escolha para onde ela vai.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Motivo da perda *</Label>
            <Select value={form.motivo ?? ""} onValueChange={(v) => set("motivo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_PERDA.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observação {form.motivo === "Outro" && "*"}</Label>
            <Textarea rows={2} value={form.obs ?? ""} onChange={(e) => set("obs", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Destino da conta *</Label>
            <RadioGroup value={form.destino} onValueChange={(v) => set("destino", v)} className="space-y-2">
              {DESTINOS_CONTA_PERDA.map((d) => (
                <label key={d.id} className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value={d.id} className="mt-0.5" />
                  <span className="text-sm">
                    <span className="font-medium">{d.label}</span>
                    <span className="block text-xs text-muted-foreground">{d.desc}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {(form.destino === "oportunidade_futura" || form.destino === "continuar_relacionamento") && (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>{form.destino === "oportunidade_futura" ? "Data do próximo contato *" : "Data da próxima ação *"}</Label>
                <Input type="datetime-local" value={form.proxima_data ?? ""} onChange={(e) => set("proxima_data", e.target.value)} />
              </div>
              {form.destino === "continuar_relacionamento" && (
                <div>
                  <Label>Próxima ação</Label>
                  <Input value={form.proxima_acao ?? ""} onChange={(e) => set("proxima_acao", e.target.value)} placeholder="Ex: Enviar novidades do portfólio" />
                </div>
              )}
            </div>
          )}

          {form.destino === "contato_cancelado" && (
            <div>
              <Label>Motivo do cancelamento da conta *</Label>
              <Textarea rows={2} value={form.motivo_cancelamento ?? ""} onChange={(e) => set("motivo_cancelamento", e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button variant="destructive" onClick={confirmar} disabled={saving}>{saving ? "Confirmando…" : "Confirmar perda"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
