import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: any | null;
  onCreated: () => void;
};

export default function NovaPropostaDialog({ open, onOpenChange, imovel, onCreated }: Props) {
  const [leads, setLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState("");
  const [valor, setValor] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("leads").select("id,nome,telefone").order("nome").then(({ data }) => setLeads(data ?? []));
    setLeadId(""); setValor(imovel?.valor ? String(imovel.valor) : ""); setCondicoes(""); setObservacoes("");
  }, [open, imovel]);

  const save = async () => {
    if (!imovel || !leadId) { toast.error("Selecione um lead"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("propostas").insert({
      imovel_id: imovel.id,
      lead_id: leadId,
      corretor_id: imovel.corretor_id || user?.id,
      created_by: user?.id,
      valor: valor ? Number(valor) : null,
      condicoes: condicoes || null,
      observacoes: observacoes || null,
      status: "Em análise",
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar proposta: " + error.message); return; }
    toast.success("Proposta criada");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar proposta {imovel?.titulo && `· ${imovel.titulo}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lead / Cliente</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger><SelectValue placeholder="Selecione um lead…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {leads.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}{l.telefone ? ` · ${l.telefone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor proposto (R$)</Label>
            <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Condições</Label>
            <Input value={condicoes} onChange={e => setCondicoes(e.target.value)} placeholder="Ex.: 30% entrada + financiamento" />
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !leadId}>{saving ? "Salvando…" : "Criar proposta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
