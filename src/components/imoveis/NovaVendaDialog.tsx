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
  const [manualCliente, setManualCliente] = useState(false);
  const [manualImovel, setManualImovel] = useState(false);
  const [imovelManual, setImovelManual] = useState({
    titulo: "",
    tipo: "Casa",
    finalidade: "Venda",
    endereco: "",
    bairro: "",
    cidade: "",
    valor: "",
  });

  useEffect(() => {
    if (!open) return;
    supabase.from("imoveis").select("id,titulo,codigo,valor,status").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo || ""} ${i.titulo}`.trim(), raw: i })));
    });
    supabase.from("leads").select("id,nome").order("nome").then(({ data }) => setLeads((data ?? []).map((l: any) => ({ id: l.id, nome: l.nome }))));
    supabase.from("contas").select("id,nome,email,telefone").order("nome").then(({ data }) => setContas((data ?? []).map((c: any) => {
      const extra = [c.email, c.telefone].filter(Boolean).join(" · ");
      return { id: c.id, nome: extra ? `${c.nome} — ${extra}` : c.nome, rawNome: c.nome };
    })));
    supabase.from("profiles").select("user_id,nome,nivel").then(({ data }) => setProfiles((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome", nivel: p.nivel || "senior" }))));
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
      origem_negocio: (initial?.origem_negocio as OrigemNegocio) || DEFAULT_ORIGEM,
      nivel_corretor: (initial?.nivel_corretor as NivelCorretor) || DEFAULT_NIVEL,
      percent_vendedor: initial?.percent_vendedor != null ? String(initial.percent_vendedor) : "2",
      percent_captador: initial?.percent_captador != null ? String(initial.percent_captador) : "1",
      percent_hr: initial?.percent_hr != null ? String(initial.percent_hr) : "2",
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
    if (form.conta_id && form.conta_id !== "none") {
      const c = contas.find((x: any) => x.id === form.conta_id);
      if (c) setForm((f: any) => (f.cliente_nome === c.rawNome ? f : { ...f, cliente_nome: c.rawNome }));
    }
  }, [form.conta_id, contas]);

  useEffect(() => {
    if (!open) return;
    // Em edição: se já existe nome de cliente mas sem conta vinculada, abre em modo manual
    setManualCliente(!!initial?.cliente_nome && (!initial?.conta_id || initial.conta_id === "none"));
    setManualImovel(false);
    setImovelManual({ titulo: "", tipo: "Casa", finalidade: "Venda", endereco: "", bairro: "", cidade: "", valor: "" });
  }, [open, initial]);

  // Auto-preenche nível a partir do nível do corretor vendedor selecionado
  useEffect(() => {
    if (form.corretor_vendedor_id && form.corretor_vendedor_id !== "none") {
      const v = profiles.find((p) => p.id === form.corretor_vendedor_id);
      if (v?.nivel && (v.nivel === "junior" || v.nivel === "senior")) {
        setForm((f: any) => (f.nivel_corretor === v.nivel ? f : { ...f, nivel_corretor: v.nivel }));
      }
    }
  }, [form.corretor_vendedor_id, profiles]);

  // Aplica matriz HR quando origem/nível mudam
  const applyMatriz = (origem: OrigemNegocio, nivel: NivelCorretor) => {
    const s = getSplit(origem, nivel);
    setForm((f: any) => {
      const next = {
        ...f,
        origem_negocio: origem,
        nivel_corretor: nivel,
        percent_captador: String(s.captador),
        percent_vendedor: String(s.vendedor),
        percent_hr: String(s.hr),
      };
      const n = parseFloat(f.valor_venda);
      const soma = s.captador + s.vendedor + s.hr;
      if (!isNaN(n)) next.valor_comissao = ((n * soma) / 100).toFixed(2);
      return next;
    });
  };

  // Recalcula comissão R$ ao mudar valor da venda (com base na soma dos % do VGV)
  const onValor = (v: string) => {
    const n = parseFloat(v);
    setForm((f: any) => {
      const next = { ...f, valor_venda: v };
      const soma =
        (parseFloat(f.percent_captador) || 0) +
        (parseFloat(f.percent_vendedor) || 0) +
        (parseFloat(f.percent_hr) || 0);
      if (!isNaN(n)) next.valor_comissao = ((n * soma) / 100).toFixed(2);
      return next;
    });
  };

  // Edição manual de algum % → recalcula comissão R$
  const onPctPapel = (papel: "captador" | "vendedor" | "hr", v: string) => {
    setForm((f: any) => {
      const next = { ...f, [`percent_${papel}`]: v };
      const soma =
        (parseFloat(papel === "captador" ? v : f.percent_captador) || 0) +
        (parseFloat(papel === "vendedor" ? v : f.percent_vendedor) || 0) +
        (parseFloat(papel === "hr" ? v : f.percent_hr) || 0);
      const n = parseFloat(f.valor_venda);
      if (!isNaN(n)) next.valor_comissao = ((n * soma) / 100).toFixed(2);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.cliente_nome) return toast.error("Informe o nome do cliente");
    if (!form.valor_venda) return toast.error("Informe o valor");
    if (manualImovel && !imovelManual.titulo.trim()) return toast.error("Informe o título do imóvel manual");
    setSaving(true);

    let imovelIdFinal: string | null = form.imovel_id !== "none" ? form.imovel_id : null;

    // Cria imóvel não divulgado quando em modo manual
    if (manualImovel) {
      const valorImv = parseFloat(imovelManual.valor) || parseFloat(form.valor_venda) || null;
      const { data: imvIns, error: imvErr } = await supabase
        .from("imoveis")
        .insert({
          titulo: imovelManual.titulo.trim(),
          tipo: imovelManual.tipo,
          finalidade: imovelManual.finalidade,
          endereco: imovelManual.endereco || null,
          bairro: imovelManual.bairro || null,
          cidade: imovelManual.cidade || null,
          valor: valorImv,
          status: "Não divulgado",
          created_by: user?.id,
          corretor_id: form.corretor_vendedor_id !== "none" ? form.corretor_vendedor_id : null,
        })
        .select("id")
        .single();
      if (imvErr || !imvIns) { setSaving(false); return toast.error("Erro ao criar imóvel: " + (imvErr?.message || "")); }
      imovelIdFinal = imvIns.id;
    }

    const payload: any = {
      imovel_id: imovelIdFinal,
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
      origem_negocio: form.origem_negocio || null,
      nivel_corretor: form.nivel_corretor || null,
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
            {manualCliente ? (
              <>
                <Input
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value, conta_id: "none" })}
                  placeholder="Nome do cliente"
                />
                <button
                  type="button"
                  className="text-xs text-primary hover:underline mt-1"
                  onClick={() => { setManualCliente(false); setForm((f: any) => ({ ...f, cliente_nome: "", conta_id: "none" })); }}
                >
                  Selecionar uma conta existente
                </button>
              </>
            ) : (
              <>
                <SearchableSelect
                  value={form.conta_id}
                  onChange={(v) => setForm({ ...form, conta_id: v })}
                  options={contas}
                  placeholder="Buscar cliente nas contas…"
                  emptyLabel="—"
                />
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline mt-1"
                  onClick={() => { setManualCliente(true); setForm((f: any) => ({ ...f, conta_id: "none" })); }}
                >
                  Cliente não está nas contas? Digitar nome manualmente
                </button>
              </>
            )}
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
            <Label>Valor da venda (R$) *</Label>
            <Input type="number" step="0.01" value={form.valor_venda} onChange={(e) => onValor(e.target.value)} />
          </div>
          <div>
            <Label>Comissão R$ (auto)</Label>
            <Input type="number" step="0.01" value={form.valor_comissao} onChange={(e) => setForm({ ...form, valor_comissao: e.target.value })} />
          </div>
          {(() => {
            const sum = (parseFloat(form.percent_vendedor) || 0) + (parseFloat(form.percent_captador) || 0) + (parseFloat(form.percent_hr) || 0);
            const vgv = parseFloat(form.valor_venda) || 0;
            const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const matriz = getSplit(form.origem_negocio as OrigemNegocio, form.nivel_corretor as NivelCorretor);
            const foraDaTabela =
              Math.abs((parseFloat(form.percent_captador) || 0) - matriz.captador) > 0.001 ||
              Math.abs((parseFloat(form.percent_vendedor) || 0) - matriz.vendedor) > 0.001 ||
              Math.abs((parseFloat(form.percent_hr) || 0) - matriz.hr) > 0.001;
            return (
              <div className="md:col-span-2 rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Origem do Negócio</Label>
                    <Select
                      value={form.origem_negocio}
                      onValueChange={(v) => applyMatriz(v as OrigemNegocio, form.nivel_corretor)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORIGENS_NEGOCIO.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Nível do corretor</Label>
                    <Select
                      value={form.nivel_corretor}
                      onValueChange={(v) => applyMatriz(form.origem_negocio, v as NivelCorretor)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NIVEIS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Divisão da comissão (% do VGV)</Label>
                  <div className="flex items-center gap-2">
                    {foraDaTabela && <span className="text-[10px] text-amber-600">fora da tabela</span>}
                    <span className="text-xs text-muted-foreground">Total: {sum.toFixed(2)}% ({fmt(vgv * sum / 100)})</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Captador</Label>
                    <Input type="number" step="0.1" value={form.percent_captador} onChange={(e) => onPctPapel("captador", e.target.value)} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(vgv * (parseFloat(form.percent_captador) || 0) / 100)}</div>
                  </div>
                  <div>
                    <Label className="text-xs">Vendedor</Label>
                    <Input type="number" step="0.1" value={form.percent_vendedor} onChange={(e) => onPctPapel("vendedor", e.target.value)} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(vgv * (parseFloat(form.percent_vendedor) || 0) / 100)}</div>
                  </div>
                  <div>
                    <Label className="text-xs">HR Imóveis</Label>
                    <Input type="number" step="0.1" value={form.percent_hr} onChange={(e) => onPctPapel("hr", e.target.value)} />
                    <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(vgv * (parseFloat(form.percent_hr) || 0) / 100)}</div>
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
