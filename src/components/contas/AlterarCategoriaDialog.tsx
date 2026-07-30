import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CategoriaConta, CATEGORIA_LABEL } from "@/lib/contasFunil";

export interface CategoriaData {
  nova: CategoriaConta;
  motivo: string;
  reiniciar: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contaNome?: string;
  categoriaAtual: CategoriaConta | null;
  onConfirm: (d: CategoriaData) => Promise<void> | void;
}

export default function AlterarCategoriaDialog({ open, onOpenChange, contaNome, categoriaAtual, onConfirm }: Props) {
  const [nova, setNova] = useState<CategoriaConta | "">("");
  const [motivo, setMotivo] = useState("");
  const [reiniciar, setReiniciar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNova(categoriaAtual === "carteira" ? "marketing" : "carteira");
      setMotivo("");
      setReiniciar(false);
      setSaving(false);
    }
  }, [open, categoriaAtual]);

  const confirm = async () => {
    if (!nova) return toast.error("Selecione a nova categoria");
    if (nova === categoriaAtual) return toast.error("A conta já está nesta categoria");
    if (!motivo.trim()) return toast.error("Informe o motivo da transferência");
    setSaving(true);
    try {
      await onConfirm({ nova: nova as CategoriaConta, motivo: motivo.trim(), reiniciar });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar categoria da conta</DialogTitle>
          <DialogDescription>
            {contaNome ? <><strong>{contaNome}</strong> · </> : null}
            Categoria atual: <strong>{categoriaAtual ? CATEGORIA_LABEL[categoriaAtual] : "Pendente de revisão"}</strong>.
            A conta não será duplicada e todo o histórico será preservado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Nova categoria *</Label>
            <Select value={nova} onValueChange={(v) => setNova(v as CategoriaConta)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carteira">Carteira</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Motivo da transferência *</Label>
            <Textarea
              rows={2}
              placeholder="Ex.: cliente da carteira do corretor, transferência autorizada…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={reiniciar} onCheckedChange={(v) => setReiniciar(!!v)} />
            Reiniciar atendimento em "A contatar" (padrão: manter a etapa atual)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={confirm} disabled={saving}>{saving ? "Salvando…" : "Confirmar transferência"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
