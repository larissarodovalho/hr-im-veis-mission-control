import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function NovoCorretorParceiroDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: any | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({
    nome: "", telefone: "", email: "", documento: "", creci: "",
    cidade: "", estado: "", comissao_padrao: "", dados_bancarios: "",
    observacoes: "", ativo: true,
  });
  const [saving, setSaving] = useState(false);
  const [vinculadas, setVinculadas] = useState<any[]>([]);
  const [contasDisponiveis, setContasDisponiveis] = useState<any[]>([]);
  const [vincSel, setVincSel] = useState("none");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        nome: initial.nome || "", telefone: initial.telefone || "", email: initial.email || "",
        documento: initial.documento || "", creci: initial.creci || "",
        cidade: initial.cidade || "", estado: initial.estado || "",
        comissao_padrao: initial.comissao_padrao ?? "", dados_bancarios: initial.dados_bancarios || "",
        observacoes: initial.observacoes || "", ativo: initial.ativo ?? true,
      });
    } else {
      setForm({ nome: "", telefone: "", email: "", documento: "", creci: "", cidade: "", estado: "",
        comissao_padrao: "", dados_bancarios: "", observacoes: "", ativo: true });
    }
  }, [open, initial]);

  const loadContas = async () => {
    if (!initial?.id) { setVinculadas([]); setContasDisponiveis([]); return; }
    const [vRes, dRes] = await Promise.all([
      supabase.from("contas").select("id,nome,tipo,etapa_funil").eq("parceiro_origem_id", initial.id).order("nome"),
      supabase.from("contas").select("id,nome").is("parceiro_origem_id", null).order("nome").limit(500),
    ]);
    setVinculadas(vRes.data ?? []);
    setContasDisponiveis((dRes.data ?? []).map((c: any) => ({ id: c.id, nome: c.nome })));
  };
  useEffect(() => { if (open) loadContas(); }, [open, initial?.id]);

  const vincular = async () => {
    if (vincSel === "none" || !initial?.id) return;
    const { error } = await supabase.from("contas").update({ parceiro_origem_id: initial.id }).eq("id", vincSel);
    if (error) return toast.error(error.message);
    setVincSel("none");
    toast.success("Conta vinculada");
    loadContas();
  };

  const desvincular = async (contaId: string) => {
    const { error } = await supabase.from("contas").update({ parceiro_origem_id: null }).eq("id", contaId);
    if (error) return toast.error(error.message);
    toast.success("Vínculo removido");
    loadContas();
  };

  const handleSave = async () => {
    if (!form.nome) return toast.error("Informe o nome");
    setSaving(true);
    const payload: any = {
      nome: form.nome, telefone: form.telefone || null, email: form.email || null,
      documento: form.documento || null, creci: form.creci || null,
      cidade: form.cidade || null, estado: form.estado || null,
      comissao_padrao: form.comissao_padrao ? parseFloat(form.comissao_padrao) : null,
      dados_bancarios: form.dados_bancarios || null, observacoes: form.observacoes || null,
      ativo: form.ativo,
    };
    let error;
    if (initial?.id) {
      ({ error } = await supabase.from("corretores_parceiros").update(payload).eq("id", initial.id));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("corretores_parceiros").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial?.id ? "Parceiro atualizado" : "Parceiro cadastrado");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar parceiro" : "Novo corretor parceiro"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>CPF/CNPJ</Label><Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
          <div><Label>CRECI</Label><Input value={form.creci} onChange={(e) => setForm({ ...form, creci: e.target.value })} /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
          <div><Label>Estado</Label><Input value={form.estado} maxLength={2} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} /></div>
          <div><Label>Comissão padrão (%)</Label><Input type="number" step="0.01" value={form.comissao_padrao} onChange={(e) => setForm({ ...form, comissao_padrao: e.target.value })} /></div>
          <div className="flex items-end gap-2 pb-2">
            <Checkbox id="ativo" checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: !!v })} />
            <Label htmlFor="ativo" className="cursor-pointer">Ativo</Label>
          </div>
          <div className="md:col-span-2"><Label>Dados bancários / Pix</Label><Textarea rows={2} value={form.dados_bancarios} onChange={(e) => setForm({ ...form, dados_bancarios: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>

          {initial?.id && (
            <div className="md:col-span-2 border-t pt-4 mt-2 space-y-2">
              <Label className="text-sm font-semibold">Clientes vinculados ({vinculadas.length})</Label>
              {vinculadas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma conta vinculada ainda.</p>}
              <div className="flex flex-wrap gap-2">
                {vinculadas.map((c) => (
                  <Badge key={c.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                    {c.nome} <span className="text-muted-foreground text-[10px]">({c.tipo})</span>
                    <button onClick={() => desvincular(c.id)} className="ml-1 hover:bg-destructive/20 rounded p-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <div className="flex-1">
                  <SearchableSelect value={vincSel} onChange={setVincSel} options={contasDisponiveis} placeholder="Buscar conta…" emptyLabel="Selecione uma conta" />
                </div>
                <Button type="button" variant="outline" onClick={vincular} disabled={vincSel === "none"}>Vincular</Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
