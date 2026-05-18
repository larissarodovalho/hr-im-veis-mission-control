import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: any | null;
  onCreated: () => void;
};

const MAX_BYTES = 20 * 1024 * 1024;

export default function NovaPropostaDialog({ open, onOpenChange, imovel, onCreated }: Props) {
  const [leads, setLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState("");
  const [valor, setValor] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("leads").select("id,nome,telefone").order("nome").then(({ data }) => setLeads(data ?? []));
    setLeadId(""); setValor(imovel?.valor ? String(imovel.valor) : ""); setCondicoes(""); setObservacoes(""); setFile(null);
  }, [open, imovel]);

  const onFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (f.type !== "application/pdf") { toast.error("Envie um arquivo PDF"); return; }
    if (f.size > MAX_BYTES) { toast.error("Arquivo maior que 20MB"); return; }
    setFile(f);
  };

  const save = async () => {
    if (!imovel || !leadId) { toast.error("Selecione um lead"); return; }
    if (!file) { toast.error("Anexe o PDF da proposta assinada"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${imovel.id}/${Date.now()}-${safeName}`;
      const up = await supabase.storage.from("propostas").upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (up.error) throw up.error;

      const { error } = await supabase.from("propostas").insert({
        imovel_id: imovel.id,
        lead_id: leadId,
        corretor_id: imovel.corretor_id || user?.id,
        created_by: user?.id,
        valor: valor ? Number(valor) : null,
        condicoes: condicoes || null,
        observacoes: observacoes || null,
        status: "Em análise",
        documento_url: path,
        documento_nome: file.name,
      });
      if (error) throw error;
      toast.success("Proposta criada com documento anexado");
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao criar proposta: " + (err.message || err));
    } finally {
      setSaving(false);
    }
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
          <div className="space-y-1.5">
            <Label>Proposta assinada (PDF) <span className="text-destructive">*</span></Label>
            <label className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition">
              {file ? <FileCheck2 className="h-4 w-4 text-emerald-600" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs truncate flex-1">
                {file ? file.name : "Clique para selecionar o PDF assinado (até 20MB)"}
              </span>
              <input type="file" accept="application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !leadId || !file}>{saving ? "Salvando…" : "Criar proposta"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
