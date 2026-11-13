import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function ParceiroRapidoDialog({
  open, onOpenChange, existentes, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existentes: { id: string; nome: string }[];
  onCreated: (p: { id: string; nome: string }, novo: boolean) => void;
}) {
  const { user } = useAuth();
  const [f, setF] = useState({ nome: "", telefone: "", creci: "", comissao: "" });
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    const nome = f.nome.trim();
    if (!nome) return toast.error("Informe o nome do parceiro");
    const dup = existentes.find((p) => p.nome.trim().toLowerCase() === nome.toLowerCase());
    if (dup) {
      toast.info("Parceiro já cadastrado — selecionado na venda");
      onCreated(dup, false);
      onOpenChange(false);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("corretores_parceiros").insert({
      nome,
      telefone: f.telefone.trim() || null,
      creci: f.creci.trim() || null,
      comissao_padrao: f.comissao ? parseFloat(f.comissao.replace(",", ".")) : null,
      ativo: true,
      created_by: user?.id ?? null,
    }).select("id,nome").single();
    setSaving(false);
    if (error || !data) return toast.error("Erro ao cadastrar parceiro: " + (error?.message ?? ""));
    toast.success("Parceiro cadastrado");
    onCreated(data, true);
    setF({ nome: "", telefone: "", creci: "", comissao: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo corretor parceiro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
            <div><Label>CRECI</Label><Input value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} /></div>
          </div>
          <div><Label>% comissão padrão</Label><Input inputMode="decimal" value={f.comissao} onChange={(e) => setF({ ...f, comissao: e.target.value })} placeholder="Ex.: 2" /></div>
          <p className="text-xs text-muted-foreground">Os demais dados podem ser completados depois em Imóveis → Parceiros.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Cadastrar e selecionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
