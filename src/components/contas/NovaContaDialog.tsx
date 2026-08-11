import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findDuplicates, DuplicateMatch, isStrongMatch } from "@/lib/duplicates";
import DuplicateAlert from "@/components/DuplicateAlert";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ORIGENS_CARTEIRA } from "@/lib/contasFunil";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (newId?: string) => void;
  defaultTags?: string[];
  defaultCategoria?: "carteira" | "marketing" | null;
}

export default function NovaContaDialog({ open, onOpenChange, onCreated, defaultTags, defaultCategoria }: Props) {
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
    interesse: "",
    observacoes: "",
    parceiro_origem_id: "none",
    origem: "",
    data_entrada: "",
  });
  const [parceiros, setParceiros] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase.from("corretores_parceiros").select("id,nome").eq("ativo", true).order("nome").then(({ data }) => setParceiros(data ?? []));
  }, [open]);

  const update = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setForceCreate(false);
  };

  // Verifica duplicidade ao digitar (debounced)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!form.email && !form.telefone && !form.documento && form.nome.trim().length < 4) {
        setDuplicates([]);
        return;
      }
      const m = await findDuplicates({ email: form.email, telefone: form.telefone, documento: form.documento, nome: form.nome });
      setDuplicates(m);
    }, 400);
    return () => clearTimeout(t);
  }, [form.email, form.telefone, form.documento, form.nome, open]);


  useEffect(() => {
    if (!open) {
      setDuplicates([]);
      setForceCreate(false);
    }
  }, [open]);

  const bloqueantes = duplicates.filter(isStrongMatch);

  const submit = async () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (bloqueantes.length && !forceCreate) {
      return toast.error("Contato já cadastrado. Confirme abaixo para prosseguir.");
    }

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const tags = new Set(defaultTags ?? []);
    if (defaultCategoria) tags.add(defaultCategoria);
    const { data: inserted, error } = await supabase.from("contas").insert({
      nome: form.nome.trim(),
      tipo: form.tipo,
      documento: form.documento || null,
      email: form.email || null,
      telefone: form.telefone || null,
      endereco: form.endereco || null,
      ramo_atividade: form.ramo_atividade || null,
      temperatura: form.temperatura || null,
      interesse: form.interesse || null,
      observacoes: form.observacoes || null,
      parceiro_origem_id: form.parceiro_origem_id !== "none" ? form.parceiro_origem_id : null,
      categoria: defaultCategoria ?? null,
      origem: defaultCategoria === "carteira" ? (form.origem || null) : null,
      data_entrada_carteira: defaultCategoria === "carteira" && form.data_entrada ? form.data_entrada : null,
      tags: tags.size ? Array.from(tags) : null,
      created_by: auth.user?.id,
      responsavel_id: auth.user?.id,
    } as any).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada");
    setForm({ nome: "", tipo: "PF", documento: "", email: "", telefone: "", endereco: "", ramo_atividade: "", temperatura: "", interesse: "", observacoes: "", parceiro_origem_id: "none", origem: "", data_entrada: "" });
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
            <Label>Interesse</Label>
            <Select value={form.interesse || "none"} onValueChange={(v) => update("interesse", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definido</SelectItem>
                <SelectItem value="Comprar">Comprar</SelectItem>
                <SelectItem value="Vender">Vender</SelectItem>
                <SelectItem value="Alugar">Alugar</SelectItem>
                <SelectItem value="Incorporar">Incorporar</SelectItem>
                <SelectItem value="Investimento">Investimento</SelectItem>
                <SelectItem value="Ocasião de oportunidade">Ocasião de oportunidade</SelectItem>
                <SelectItem value="Permuta">Permuta</SelectItem>
                <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                <SelectItem value="Construtor">Construtor</SelectItem>
                <SelectItem value="Corretor parceiro">Corretor parceiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trazido pelo parceiro</Label>
            <SearchableSelect
              value={form.parceiro_origem_id}
              onChange={(v) => update("parceiro_origem_id", v)}
              options={parceiros}
              placeholder="Buscar corretor parceiro…"
              emptyLabel="Nenhum"
            />
          </div>
          {defaultCategoria === "carteira" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origem</Label>
                <Select value={form.origem || "none"} onValueChange={(v) => update("origem", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definida</SelectItem>
                    {ORIGENS_CARTEIRA.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de entrada na carteira</Label>
                <Input type="date" value={form.data_entrada} onChange={(e) => update("data_entrada", e.target.value)} />
              </div>
            </div>
          )}
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
