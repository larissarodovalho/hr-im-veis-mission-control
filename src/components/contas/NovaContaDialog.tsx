import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findDuplicates, DuplicateMatch } from "@/lib/duplicates";
import DuplicateAlert from "@/components/DuplicateAlert";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (newId?: string) => void;
  defaultTags?: string[];
}

export default function NovaContaDialog({ open, onOpenChange, onCreated, defaultTags }: Props) {
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [forceCreate, setForceCreate] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "PF",
    documento: "",
    email: "",
    telefone: "",
    endereco: "",
    ramo_atividade: "",
    temperatura: "",
    observacoes: "",
  });

  const update = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setForceCreate(false);
  };

  // Verifica duplicidade ao digitar (debounced)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!form.email && !form.telefone && !form.documento) {
        setDuplicates([]);
        return;
      }
      const m = await findDuplicates({ email: form.email, telefone: form.telefone, documento: form.documento });
      setDuplicates(m);
    }, 400);
    return () => clearTimeout(t);
  }, [form.email, form.telefone, form.documento, open]);

  useEffect(() => {
    if (!open) {
      setDuplicates([]);
      setForceCreate(false);
    }
  }, [open]);

  const submit = async () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (duplicates.length && !forceCreate) {
      return toast.error("Contato já cadastrado. Confirme abaixo para prosseguir.");
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("contas").insert({
      nome: form.nome.trim(),
      tipo: form.tipo,
      documento: form.documento || null,
      email: form.email || null,
      telefone: form.telefone || null,
      endereco: form.endereco || null,
      ramo_atividade: form.ramo_atividade || null,
      temperatura: form.temperatura || null,
      observacoes: form.observacoes || null,
      tags: defaultTags && defaultTags.length ? defaultTags : null,
      created_by: auth.user?.id,
      responsavel_id: auth.user?.id,
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada");
    setForm({ nome: "", tipo: "PF", documento: "", email: "", telefone: "", endereco: "", ramo_atividade: "", temperatura: "", observacoes: "" });
    setDuplicates([]);
    setForceCreate(false);
    onOpenChange(false);
    onCreated(inserted?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => update("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{form.tipo === "PJ" ? "CNPJ" : "CPF"}</Label>
              <Input value={form.documento} onChange={(e) => update("documento", e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ramo de atividade</Label>
              <Input
                placeholder="Ex: Agronegócio, Construção…"
                value={form.ramo_atividade}
                onChange={(e) => update("ramo_atividade", e.target.value)}
              />
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={form.temperatura || "none"} onValueChange={(v) => update("temperatura", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definida</SelectItem>
                  <SelectItem value="quente">🔥 Quente</SelectItem>
                  <SelectItem value="morno">🌤️ Morno</SelectItem>
                  <SelectItem value="frio">❄️ Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} />
          </div>
          {duplicates.length > 0 && (
            <DuplicateAlert
              matches={duplicates}
              showActions
              onIgnore={() => setForceCreate(true)}
            />
          )}
          {forceCreate && (
            <p className="text-xs text-amber-600">Cadastro será criado mesmo com duplicidade detectada.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || (duplicates.length > 0 && !forceCreate)}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
