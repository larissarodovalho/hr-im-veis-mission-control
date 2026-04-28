import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Signer = { name: string; email: string; cpf: string; role: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  contaId?: string | null;
  defaultSigner?: { name?: string; email?: string; cpf?: string };
  onCreated?: () => void;
}

export default function SendDocumentDialog({ open, onOpenChange, leadId, contaId, defaultSigner, onCreated }: Props) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [deadline, setDeadline] = useState("");
  const [signers, setSigners] = useState<Signer[]>([
    { name: defaultSigner?.name || "", email: defaultSigner?.email || "", cpf: defaultSigner?.cpf || "", role: "parte" },
  ]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setFile(null); setMessage(""); setDeadline("");
    setSigners([{ name: defaultSigner?.name || "", email: defaultSigner?.email || "", cpf: defaultSigner?.cpf || "", role: "parte" }]);
  };

  const updateSigner = (i: number, patch: Partial<Signer>) => {
    setSigners((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  };

  const addSigner = () => setSigners((s) => [...s, { name: "", email: "", cpf: "", role: "parte" }]);
  const removeSigner = (i: number) => setSigners((s) => s.filter((_, idx) => idx !== i));

  const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });

  const submit = async () => {
    if (!name.trim()) return toast.error("Informe o nome do documento");
    if (!file) return toast.error("Selecione o PDF");
    if (file.type !== "application/pdf") return toast.error("Apenas PDF é aceito");
    if (file.size > 15 * 1024 * 1024) return toast.error("PDF deve ter no máximo 15MB");
    for (const s of signers) {
      if (!s.name.trim() || !s.email.trim()) return toast.error("Todos os signatários precisam de nome e e-mail");
      const parts = s.name.trim().split(/\s+/).filter((p) => p.length >= 2);
      if (parts.length < 2) return toast.error(`"${s.name}" precisa ter nome e sobrenome (ex: João Silva)`);
    }
    setLoading(true);
    try {
      const dataUri = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("clicksign-create-document", {
        body: {
          name: name.trim(),
          file_base64: dataUri,
          file_mime: file.type,
          signers,
          message: message.trim() || undefined,
          deadline_at: deadline ? new Date(deadline).toISOString() : null,
          lead_id: leadId || null,
          conta_id: contaId || null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Documento enviado para assinatura!");
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar documento para assinatura</DialogTitle>
          <DialogDescription>Os signatários receberão um e-mail da Clicksign com o link para assinar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome do documento</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Contrato de venda — Apto 302" />
          </div>

          <div>
            <Label>Arquivo PDF</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Prazo para assinatura (opcional)</Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Mensagem para os signatários (opcional)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Olá, segue o contrato para sua assinatura..." />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Signatários</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSigner}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            {signers.map((s, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Signatário {i + 1}</span>
                  {signers.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSigner(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Nome completo" value={s.name} onChange={(e) => updateSigner(i, { name: e.target.value })} />
                  <Input placeholder="E-mail" type="email" value={s.email} onChange={(e) => updateSigner(i, { email: e.target.value })} />
                  <Input placeholder="CPF (opcional)" value={s.cpf} onChange={(e) => updateSigner(i, { cpf: e.target.value })} />
                  <Select value={s.role} onValueChange={(v) => updateSigner(i, { role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parte">Parte</SelectItem>
                      <SelectItem value="comprador">Comprador</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="imobiliaria">Imobiliária</SelectItem>
                      <SelectItem value="testemunha">Testemunha</SelectItem>
                      <SelectItem value="conjuge">Cônjuge</SelectItem>
                      <SelectItem value="avalista">Avalista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            <Upload className="h-4 w-4 mr-1" /> {loading ? "Enviando..." : "Enviar para assinatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
