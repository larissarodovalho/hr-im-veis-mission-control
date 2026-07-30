import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MOTIVOS_CANCELAMENTO } from "@/lib/contasFunil";

export interface CancelamentoData {
  motivo: string;
  agradecimento: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contaNome?: string;
  onConfirm: (d: CancelamentoData) => Promise<void> | void;
}

export default function ContaCancelarDialog({ open, onOpenChange, contaNome, onConfirm }: Props) {
  const [motivo, setMotivo] = useState("");
  const [outro, setOutro] = useState("");
  const [agradecimento, setAgradecimento] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo("");
      setOutro("");
      setAgradecimento("");
      setSaving(false);
    }
  }, [open]);

  const confirm = async () => {
    if (!motivo) return toast.error("Selecione o motivo do cancelamento");
    if (motivo === "Outro" && !outro.trim()) return toast.error("Descreva o motivo");
    const motivoFinal = motivo === "Outro" ? `Outro: ${outro.trim()}` : motivo;
    setSaving(true);
    try {
      await onConfirm({ motivo: motivoFinal, agradecimento: agradecimento.trim() || null });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mover para Contato cancelado</DialogTitle>
          <DialogDescription>
            {contaNome ? (
              <>Encerrar o atendimento de <strong>{contaNome}</strong>. </>
            ) : null}
            O cadastro, o histórico e os vínculos serão preservados — nada será excluído.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Motivo do cancelamento *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_CANCELAMENTO.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {motivo === "Outro" && (
            <div>
              <Label>Descreva o motivo *</Label>
              <Textarea rows={2} value={outro} onChange={(e) => setOutro(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Mensagem de agradecimento (opcional)</Label>
            <Textarea
              rows={2}
              placeholder="Ex.: Agradecemos o contato! Ficamos à disposição para quando precisar."
              value={agradecimento}
              onChange={(e) => setAgradecimento(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Voltar</Button>
          <Button variant="destructive" onClick={confirm} disabled={saving}>
            {saving ? "Salvando…" : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
