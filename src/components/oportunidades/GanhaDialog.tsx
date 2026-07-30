import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { statusPropostaLabel } from "@/lib/oportunidadesFunil";
import { formatBRL } from "@/lib/format";

/**
 * Modal obrigatório de fechamento — a oportunidade nunca vai para "Ganha" por drag simples.
 * Cria o registro correspondente em conta_fechamentos (fluxo de fechamento já existente)
 * e pergunta explicitamente sobre a disponibilidade do imóvel.
 */
export default function GanhaDialog({
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
  const [conta, setConta] = useState<any | null>(null);
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !oportunidade) return;
    setForm({
      imovel_id: oportunidade.imovel_fechamento_id || "none",
      proposta_aceita_id: oportunidade.proposta_aceita_id || "none",
      valor_final: oportunidade.valor_final ?? "",
      data_fechamento: new Date().toISOString().slice(0, 10),
      forma_pagamento: oportunidade.forma_pagamento || "",
      corretor_id: oportunidade.corretor_id || "none",
      comissao_prevista: "",
      observacoes: "",
      marcarVendido: false,
    });
    const contaId = oportunidade.conta_id || (oportunidade.cliente_tipo === "conta" ? oportunidade.cliente_id : null);
    if (contaId) supabase.from("contas").select("id,nome").eq("id", contaId).maybeSingle().then(({ data }) => setConta(data));
    else setConta(null);
    supabase.from("oportunidade_imoveis").select("*").eq("oportunidade_id", oportunidade.id).then(({ data }) => setVinculos(data ?? []));
    supabase.from("imoveis").select("id,titulo,codigo,valor").order("created_at", { ascending: false }).then(({ data }) => setImoveis(data ?? []));
    supabase.from("oportunidade_propostas").select("*").eq("oportunidade_id", oportunidade.id).order("created_at", { ascending: false }).then(({ data }) => setPropostas((data ?? []) as any[]));
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
    });
  }, [open, oportunidade]);

  const propostasAceitas = propostas.filter((p) => p.status === "aceita");
  const propostasSelecionaveis = propostasAceitas.length ? propostasAceitas : propostas;

  const imovelOptions = vinculos.length
    ? vinculos.map((v) => {
        const im = imoveis.find((i) => i.id === v.imovel_id);
        return { id: v.imovel_id, nome: im ? `${im.codigo ? im.codigo + " · " : ""}${im.titulo}` : v.imovel_id };
      })
    : imoveis.map((i) => ({ id: i.id, nome: `${i.codigo ? i.codigo + " · " : ""}${i.titulo}` }));

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const onSelectProposta = (id: string) => {
    const p = propostas.find((x) => x.id === id);
    const patch: any = { proposta_aceita_id: id };
    if (p) {
      if (p.valor_proposto) patch.valor_final = p.valor_proposto;
      if (p.forma_pagamento) patch.forma_pagamento = p.forma_pagamento;
      if (p.imovel_id) patch.imovel_id = p.imovel_id;
    }
    setForm({ ...form, ...patch });
  };

  const confirmar = async () => {
    const contaId = oportunidade.conta_id || (oportunidade.cliente_tipo === "conta" ? oportunidade.cliente_id : null);
    if (!contaId) return toast.error("Vincule uma conta à oportunidade antes de fechar");
    if (!form.imovel_id || form.imovel_id === "none") return toast.error("Selecione o imóvel negociado");
    if (!form.valor_final) return toast.error("Informe o valor final");
    if (!form.corretor_id || form.corretor_id === "none") return toast.error("Selecione o corretor responsável");
    if (!form.data_fechamento) return toast.error("Informe a data do fechamento");
    setSaving(true);

    const { error } = await supabase.from("oportunidades").update({
      estagio: "ganha",
      valor_final: Number(form.valor_final),
      data_fechamento: form.data_fechamento,
      imovel_fechamento_id: form.imovel_id,
      proposta_aceita_id: form.proposta_aceita_id === "none" ? null : form.proposta_aceita_id,
      forma_pagamento: form.forma_pagamento?.trim() || null,
      corretor_id: form.corretor_id,
      encerrada_em: new Date().toISOString(),
      encerrada_por: user?.id,
    } as any).eq("id", oportunidade.id);
    if (error) { setSaving(false); return toast.error(error.message); }

    // Registro no fluxo de fechamento existente (sem sistema paralelo)
    const obsParts = [`Fechamento da oportunidade "${oportunidade.titulo}".`];
    if (form.comissao_prevista) obsParts.push(`Comissão prevista: ${formatBRL(Number(form.comissao_prevista))}.`);
    if (form.observacoes?.trim()) obsParts.push(form.observacoes.trim());
    await supabase.from("conta_fechamentos").insert({
      conta_id: contaId,
      oportunidade_id: oportunidade.id,
      imovel_id: form.imovel_id,
      data_fechamento: form.data_fechamento,
      valor: Number(form.valor_final),
      observacoes: obsParts.join(" "),
      created_by: user?.id,
    } as any);

    // Disponibilidade do imóvel: somente com confirmação explícita
    if (form.marcarVendido) {
      await supabase.from("imoveis").update({ status: "Vendido" } as any).eq("id", form.imovel_id);
    }

    await supabase.from("interacoes").insert({
      conta_id: contaId, oportunidade_id: oportunidade.id, tipo: "nota",
      descricao: `Oportunidade marcada como GANHA. Valor final: ${formatBRL(Number(form.valor_final))}. Fechamento registrado na conta.${form.marcarVendido ? " Imóvel marcado como Vendido." : ""}`,
      created_by: user?.id,
    } as any);

    setSaving(false);
    toast.success("Oportunidade ganha — fechamento registrado");
    onOpenChange(false);
    onSaved();
  };

  if (!oportunidade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" /> Marcar como Ganha
          </DialogTitle>
          <DialogDescription>
            Confirmação de fechamento de "{oportunidade.titulo}". Um registro será criado no fechamento da conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Conta compradora: </span>
            <span className="font-medium">{conta?.nome ?? "—"}</span>
          </div>

          <div>
            <Label>Imóvel negociado *</Label>
            <Select value={form.imovel_id ?? "none"} onValueChange={(v) => set("imovel_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {imovelOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {propostas.length > 0 && (
            <div>
              <Label>Proposta aceita</Label>
              <Select value={form.proposta_aceita_id ?? "none"} onValueChange={onSelectProposta}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {propostasSelecionaveis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {statusPropostaLabel(p.status)} — {p.valor_proposto ? formatBRL(p.valor_proposto) : "sem valor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor final (R$) *</Label>
              <Input type="number" value={form.valor_final ?? ""} onChange={(e) => set("valor_final", e.target.value)} />
            </div>
            <div>
              <Label>Data do fechamento *</Label>
              <Input type="date" value={form.data_fechamento ?? ""} onChange={(e) => set("data_fechamento", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Forma de pagamento</Label>
              <Input value={form.forma_pagamento ?? ""} onChange={(e) => set("forma_pagamento", e.target.value)} />
            </div>
            <div>
              <Label>Comissão prevista (R$)</Label>
              <Input type="number" value={form.comissao_prevista ?? ""} onChange={(e) => set("comissao_prevista", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Corretor responsável *</Label>
            <Select value={form.corretor_id ?? "none"} onValueChange={(v) => set("corretor_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {corretores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
          </div>

          <label className="flex items-start gap-2 text-sm rounded-md border p-3">
            <Checkbox checked={!!form.marcarVendido} onCheckedChange={(v) => set("marcarVendido", !!v)} className="mt-0.5" />
            <span>
              Marcar o imóvel como <strong>Vendido</strong> (sai do site e da lista de disponíveis).
              <span className="block text-xs text-muted-foreground">Sem essa confirmação, a disponibilidade não é alterada.</span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={confirmar} disabled={saving}>{saving ? "Confirmando…" : "Confirmar ganho"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
