import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  ORIGENS as ORIGENS_NEGOCIO,
  NIVEIS,
  getSplit,
  DEFAULT_ORIGEM,
  DEFAULT_NIVEL,
  type OrigemNegocio,
  type NivelCorretor,
} from "@/lib/comissaoHR";

export type VendaRow = any;

const STATUS = ["Pagamento pendente", "Finalizada", "Cancelada"] as const;
const TIPOS = ["Venda", "Aluguel"] as const;
const ORIGENS = ["Site", "Indicação", "Tráfego pago", "WhatsApp", "Portal", "Outra"];

export default function NovaVendaDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<VendaRow> | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    imovel_id: "none",
    lead_id: "none",
    conta_id: "none",
    corretor_id: "none",
    corretor_vendedor_id: "none",
    corretor_captador_id: "none",
    corretor_parceiro_id: "none",
    cliente_nome: "",
    valor_venda: "",
    valor_comissao: "",
    percentual_comissao: "",
    origem_negocio: DEFAULT_ORIGEM as OrigemNegocio,
    nivel_corretor: DEFAULT_NIVEL as NivelCorretor,
    percent_vendedor: "2",
    percent_captador: "1",
    percent_hr: "2",
    tipo: "Venda",
    status_pagamento: "Pagamento pendente",
    origem: "",
    data_venda: new Date().toISOString().slice(0, 16),
    observacoes: "",
    proposta_id: null,
  });
  const [marcarVendido, setMarcarVendido] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("imoveis").select("id,titulo,codigo,valor,status").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo || ""} ${i.titulo}`.trim(), raw: i })));
    });
    supabase.from("leads").select("id,nome").order("nome").then(({ data }) => setLeads((data ?? []).map((l: any) => ({ id: l.id, nome: l.nome }))));
    supabase.from("contas").select("id,nome").order("nome").then(({ data }) => setContas((data ?? []).map((c: any) => ({ id: c.id, nome: c.nome }))));
    supabase.from("profiles").select("user_id,nome").then(({ data }) => setProfiles((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" }))));
    supabase.from("corretores_parceiros").select("id,nome").eq("ativo", true).order("nome").then(({ data }) => setParceiros(data ?? []));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setForm((f: any) => ({
      ...f,
      ...Object.fromEntries(Object.entries(initial || {}).map(([k, v]) => [k, v ?? f[k as keyof typeof f]])),
      imovel_id: initial?.imovel_id || "none",
      lead_id: initial?.lead_id || "none",
      conta_id: initial?.conta_id || "none",
      corretor_id: initial?.corretor_id || "none",
      corretor_vendedor_id: initial?.corretor_vendedor_id || "none",
      corretor_captador_id: initial?.corretor_captador_id || "none",
      corretor_parceiro_id: initial?.corretor_parceiro_id || "none",
      percent_vendedor: initial?.percent_vendedor != null ? String(initial.percent_vendedor) : "40",
      percent_captador: initial?.percent_captador != null ? String(initial.percent_captador) : "30",
      percent_hr: initial?.percent_hr != null ? String(initial.percent_hr) : "30",
      data_venda: initial?.data_venda ? new Date(initial.data_venda).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    }));
  }, [open, initial]);

  // Auto-fill cliente_nome quando seleciona lead/conta
  useEffect(() => {
    if (form.lead_id && form.lead_id !== "none" && !form.cliente_nome) {
      const l = leads.find((x) => x.id === form.lead_id);
      if (l) setForm((f: any) => ({ ...f, cliente_nome: l.nome }));
    }
  }, [form.lead_id, leads]);
  useEffect(() => {
    if (form.conta_id && form.conta_id !== "none" && !form.cliente_nome) {
      const c = contas.find((x) => x.id === form.conta_id);
      if (c) setForm((f: any) => ({ ...f, cliente_nome: c.nome }));
    }
  }, [form.conta_id, contas]);

  // Auto-cálculo comissão
  const onValor = (v: string) => {
    const n = parseFloat(v);
    setForm((f: any) => {
      const next = { ...f, valor_venda: v };
      if (!isNaN(n) && f.percentual_comissao) {
        const pct = parseFloat(f.percentual_comissao);
        if (!isNaN(pct)) next.valor_comissao = ((n * pct) / 100).toFixed(2);
      }
      return next;
    });
  };
  const onPct = (v: string) => {
    const pct = parseFloat(v);
    setForm((f: any) => {
      const next = { ...f, percentual_comissao: v };
      const n = parseFloat(f.valor_venda);
      if (!isNaN(n) && !isNaN(pct)) next.valor_comissao = ((n * pct) / 100).toFixed(2);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.cliente_nome) return toast.error("Informe o nome do cliente");
    if (!form.valor_venda) return toast.error("Informe o valor");
    setSaving(true);
    const payload: any = {
      imovel_id: form.imovel_id !== "none" ? form.imovel_id : null,
      lead_id: form.lead_id !== "none" ? form.lead_id : null,
      conta_id: form.conta_id !== "none" ? form.conta_id : null,
      corretor_id: form.corretor_id !== "none" ? form.corretor_id : null,
      corretor_vendedor_id: form.corretor_vendedor_id !== "none" ? form.corretor_vendedor_id : null,
      corretor_captador_id: form.corretor_captador_id !== "none" ? form.corretor_captador_id : null,
      corretor_parceiro_id: form.corretor_parceiro_id !== "none" ? form.corretor_parceiro_id : null,
      proposta_id: form.proposta_id || null,
      cliente_nome: form.cliente_nome,
      valor_venda: parseFloat(form.valor_venda) || 0,
      valor_comissao: parseFloat(form.valor_comissao) || 0,
      percentual_comissao: form.percentual_comissao ? parseFloat(form.percentual_comissao) : null,
      percent_vendedor: parseFloat(form.percent_vendedor) || 0,
      percent_captador: parseFloat(form.percent_captador) || 0,
      percent_hr: parseFloat(form.percent_hr) || 0,
      tipo: form.tipo,
      status_pagamento: form.status_pagamento,
      origem: form.origem || null,
      data_venda: new Date(form.data_venda).toISOString(),
      observacoes: form.observacoes || null,
      created_by: user?.id,
    };

    let error;
    if (initial?.id) {
      ({ error } = await supabase.from("vendas").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await supabase.from("vendas").insert(payload));
    }
    if (error) { setSaving(false); return toast.error(error.message); }

    if (marcarVendido && payload.imovel_id) {
      await supabase.from("imoveis").update({ status: "Vendido" }).eq("id", payload.imovel_id);
    }

    setSaving(false);
    toast.success(initial?.id ? "Venda atualizada" : "Venda registrada 🎉");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar venda" : "Nova venda"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Cliente *</Label>
            <Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
          </div>
          <div>
            <Label>Imóvel</Label>
            <SearchableSelect value={form.imovel_id} onChange={(v) => setForm({ ...form, imovel_id: v })} options={imoveis} placeholder="Buscar imóvel…" emptyLabel="—" />
          </div>
          <div>
            <Label>Corretor vendedor</Label>
            <SearchableSelect value={form.corretor_vendedor_id} onChange={(v) => setForm({ ...form, corretor_vendedor_id: v, corretor_id: v })} options={profiles} placeholder="Buscar corretor…" emptyLabel="—" />
          </div>
          <div>
            <Label>Corretor captador</Label>
            <SearchableSelect value={form.corretor_captador_id} onChange={(v) => setForm({ ...form, corretor_captador_id: v })} options={profiles} placeholder="Buscar corretor…" emptyLabel="—" />
          </div>
          <div>
            <Label>Corretor parceiro</Label>
            <SearchableSelect value={form.corretor_parceiro_id} onChange={(v) => setForm({ ...form, corretor_parceiro_id: v })} options={parceiros} placeholder="Buscar parceiro…" emptyLabel="—" />
          </div>
          <div>
            <Label>Lead (opcional)</Label>
            <SearchableSelect value={form.lead_id} onChange={(v) => setForm({ ...form, lead_id: v })} options={leads} placeholder="Buscar lead…" emptyLabel="—" />
          </div>
          <div>
            <Label>Conta (opcional)</Label>
            <SearchableSelect value={form.conta_id} onChange={(v) => setForm({ ...form, conta_id: v })} options={contas} placeholder="Buscar conta…" emptyLabel="—" />
          </div>
          <div>
            <Label>Valor da venda (R$) *</Label>
            <Input type="number" step="0.01" value={form.valor_venda} onChange={(e) => onValor(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Comissão %</Label>
              <Input type="number" step="0.01" value={form.percentual_comissao} onChange={(e) => onPct(e.target.value)} />
            </div>
            <div>
              <Label>Comissão R$</Label>
              <Input type="number" step="0.01" value={form.valor_comissao} onChange={(e) => setForm({ ...form, valor_comissao: e.target.value })} />
            </div>
          </div>
          {(() => {
            const sum = (parseFloat(form.percent_vendedor) || 0) + (parseFloat(form.percent_captador) || 0) + (parseFloat(form.percent_hr) || 0);
            const comissao = parseFloat(form.valor_comissao) || 0;
            const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return (
              <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Divisão da comissão (%)</Label>
                  <span className={`text-xs ${Math.abs(sum - 100) < 0.01 ? "text-emerald-600" : "text-destructive"}`}>Soma: {sum.toFixed(1)}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Vendedor</Label>
                    <Input type="number" step="0.1" value={form.percent_vendedor} onChange={(e) => setForm({ ...form, percent_vendedor: e.target.value })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(comissao * (parseFloat(form.percent_vendedor) || 0) / 100)}</div>
                  </div>
                  <div>
                    <Label className="text-xs">Captador</Label>
                    <Input type="number" step="0.1" value={form.percent_captador} onChange={(e) => setForm({ ...form, percent_captador: e.target.value })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(comissao * (parseFloat(form.percent_captador) || 0) / 100)}</div>
                  </div>
                  <div>
                    <Label className="text-xs">HR Imóveis</Label>
                    <Input type="number" step="0.1" value={form.percent_hr} onChange={(e) => setForm({ ...form, percent_hr: e.target.value })} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(comissao * (parseFloat(form.percent_hr) || 0) / 100)}</div>
                  </div>
                </div>
              </div>
            );
          })()}
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status do pagamento</Label>
            <Select value={form.status_pagamento} onValueChange={(v) => setForm({ ...form, status_pagamento: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={form.origem || "none"} onValueChange={(v) => setForm({ ...form, origem: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data da venda</Label>
            <Input type="datetime-local" value={form.data_venda} onChange={(e) => setForm({ ...form, data_venda: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          {form.imovel_id !== "none" && (
            <div className="md:col-span-2 flex items-center gap-2">
              <Checkbox id="marc" checked={marcarVendido} onCheckedChange={(v) => setMarcarVendido(!!v)} />
              <Label htmlFor="marc" className="cursor-pointer">Marcar imóvel como "Vendido"</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar venda"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
