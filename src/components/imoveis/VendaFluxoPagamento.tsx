import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { todayCRM } from "@/lib/datetime";
import { dividirValor, gerarVencimentos, isAtrasada, statusGeralComissao } from "@/lib/vendaParcelas";

type Fluxo = "imovel" | "comissao";
type Row = {
  id?: string; fluxo: Fluxo; beneficiario: string | null; numero: number; vencimento: string;
  valor: number; forma: string | null; status: string; pago_em: string | null; observacao: string | null;
};

const FORMAS = ["Pix", "Transferência", "Boleto", "Cheque", "Dinheiro", "Financiamento", "Safra", "Permuta", "Veículo", "Outro"];
const BENEF = [{ v: "hr", l: "HR Imóveis" }, { v: "vendedor", l: "Vendedor" }, { v: "captador", l: "Captador" }, { v: "parceiro", l: "Parceiro" }];
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function VendaFluxoPagamento({ vendaId, valorVenda, valorComissao, onStatusChange }: {
  vendaId: string; valorVenda: number; valorComissao: number; onStatusChange?: (s: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("venda_parcelas").select("*").eq("venda_id", vendaId).order("fluxo").order("numero");
    setRows((data ?? []) as any);
    setRemovidos([]);
  }, [vendaId]);
  useEffect(() => { load(); }, [load]);

  const hoje = todayCRM();
  const upd = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const del = (i: number) => setRows((r) => { const x = r[i]; if (x.id) setRemovidos((d) => [...d, x.id!]); return r.filter((_, j) => j !== i); });
  const add = (fluxo: Fluxo) => setRows((r) => [...r, {
    fluxo, beneficiario: fluxo === "comissao" ? "hr" : null, numero: r.filter((x) => x.fluxo === fluxo).length + 1,
    vencimento: hoje, valor: 0, forma: null, status: "pendente", pago_em: null, observacao: null,
  }]);

  const gerar = (fluxo: Fluxo, n: number, meses: number, inicio: string, total: number, benef: string | null) => {
    if (!n || n < 1 || !inicio) return toast.error("Informe quantidade e primeira data");
    const valores = dividirValor(total, n);
    const datas = gerarVencimentos(inicio, n, meses);
    setRows((r) => {
      const antigos = r.filter((x) => x.fluxo === fluxo && (fluxo === "imovel" || x.beneficiario === benef));
      antigos.forEach((x) => x.id && setRemovidos((d) => [...d, x.id!]));
      const resto = r.filter((x) => !antigos.includes(x));
      return [...resto, ...valores.map((v, i) => ({
        fluxo, beneficiario: benef, numero: i + 1, vencimento: datas[i], valor: v, forma: null,
        status: "pendente", pago_em: null, observacao: null,
      }))];
    });
  };

  const salvar = async () => {
    setSaving(true);
    try {
      if (removidos.length) {
        const { error } = await supabase.from("venda_parcelas").delete().in("id", removidos);
        if (error) throw error;
      }
      const payload = rows.map((r) => ({ ...r, venda_id: vendaId, pago_em: r.status === "paga" ? r.pago_em || hoje : null }));
      if (payload.length) {
        const { error } = await supabase.from("venda_parcelas").upsert(payload as any);
        if (error) throw error;
      }
      const st = statusGeralComissao(rows.filter((r) => r.fluxo === "comissao"));
      if (st) {
        await supabase.from("vendas").update({ status_pagamento: st }).eq("id", vendaId);
        onStatusChange?.(st);
      }
      toast.success("Fluxo de pagamento salvo");
      await load();
    } catch (e: any) {
      toast.error("Erro ao salvar parcelas: " + (e.message ?? e));
    } finally { setSaving(false); }
  };

  const bloco = (fluxo: Fluxo, titulo: string, total: number) => {
    const lista = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.fluxo === fluxo);
    const soma = lista.reduce((s, { r }) => s + (Number(r.valor) || 0), 0);
    const pago = lista.filter(({ r }) => r.status === "paga").reduce((s, { r }) => s + (Number(r.valor) || 0), 0);
    const diverge = lista.length > 0 && Math.abs(soma - total) > 0.01;
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-medium text-sm">{titulo}</div>
          <div className="text-xs text-muted-foreground">Recebido {fmt(pago)} · Falta {fmt(Math.max(0, soma - pago))} · Total {fmt(total)}</div>
        </div>
        <Gerador fluxo={fluxo} total={total} onGerar={gerar} />
        {diverge && <div className="text-xs text-destructive">A soma das parcelas ({fmt(soma)}) não bate com o total ({fmt(total)}).</div>}
        {lista.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma parcela lançada.</div>}
        {lista.map(({ r, i }) => {
          const atras = isAtrasada(r, hoje);
          return (
            <div key={r.id ?? `n${i}`} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end border-t pt-2">
              <div className="md:col-span-1"><Label className="text-[10px]">Nº</Label><Input type="number" value={r.numero} onChange={(e) => upd(i, { numero: Number(e.target.value) })} /></div>
              {fluxo === "comissao" && (
                <div className="md:col-span-2"><Label className="text-[10px]">Recebe</Label>
                  <Select value={r.beneficiario ?? "hr"} onValueChange={(v) => upd(i, { beneficiario: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BENEF.map((b) => <SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent>
                  </Select></div>
              )}
              <div className="md:col-span-2"><Label className="text-[10px]">Vencimento</Label><Input type="date" value={r.vencimento} onChange={(e) => upd(i, { vencimento: e.target.value })} /></div>
              <div className="md:col-span-2"><Label className="text-[10px]">Valor (R$)</Label><Input type="number" step="0.01" value={r.valor} onChange={(e) => upd(i, { valor: Number(e.target.value) })} /></div>
              <div className={fluxo === "comissao" ? "md:col-span-2" : "md:col-span-3"}><Label className="text-[10px]">Forma</Label>
                <Select value={r.forma ?? "none"} onValueChange={(v) => upd(i, { forma: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="md:col-span-2 flex flex-col gap-1">
                {r.status === "paga"
                  ? <><Badge variant="secondary" className="w-fit">Paga</Badge><Input type="date" value={r.pago_em ?? hoje} onChange={(e) => upd(i, { pago_em: e.target.value })} /></>
                  : <><Badge variant={atras ? "destructive" : "outline"} className="w-fit">{atras ? "Atrasada" : "Pendente"}</Badge>
                    <Button type="button" size="sm" variant="outline" onClick={() => upd(i, { status: "paga", pago_em: hoje })}><Check className="h-3 w-3 mr-1" />Marcar paga</Button></>}
              </div>
              <div className="md:col-span-1 flex gap-1 justify-end">
                {r.status === "paga" && <Button type="button" size="sm" variant="ghost" title="Voltar para pendente" onClick={() => upd(i, { status: "pendente", pago_em: null })}>↺</Button>}
                <Button type="button" size="icon" variant="ghost" onClick={() => del(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
        <Button type="button" size="sm" variant="ghost" onClick={() => add(fluxo)}><Plus className="h-3 w-3 mr-1" />Adicionar parcela</Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {bloco("imovel", "Pagamento do imóvel", valorVenda)}
      {bloco("comissao", "Pagamento da comissão", valorComissao)}
      <div className="flex justify-end"><Button type="button" size="sm" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar fluxo de pagamento"}</Button></div>
    </div>
  );
}

function Gerador({ fluxo, total, onGerar }: { fluxo: Fluxo; total: number; onGerar: (f: Fluxo, n: number, meses: number, inicio: string, total: number, b: string | null) => void }) {
  const [aberto, setAberto] = useState(false);
  const [n, setN] = useState("1");
  const [meses, setMeses] = useState("1");
  const [inicio, setInicio] = useState(todayCRM());
  const [valor, setValor] = useState(String(total || ""));
  const [benef, setBenef] = useState("hr");
  if (!aberto) return <Button type="button" size="sm" variant="outline" onClick={() => { setValor(String(total || "")); setAberto(true); }}><Wand2 className="h-3 w-3 mr-1" />Gerar parcelas</Button>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end rounded bg-muted/40 p-2">
      <div><Label className="text-[10px]">Quantidade</Label><Input type="number" min={1} value={n} onChange={(e) => setN(e.target.value)} /></div>
      <div><Label className="text-[10px]">Intervalo</Label>
        <Select value={meses} onValueChange={setMeses}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="1">Mensal</SelectItem><SelectItem value="3">Trimestral</SelectItem><SelectItem value="6">Semestral</SelectItem><SelectItem value="12">Anual</SelectItem></SelectContent>
        </Select></div>
      <div><Label className="text-[10px]">1ª data</Label><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
      <div><Label className="text-[10px]">Valor total</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
      {fluxo === "comissao" ? (
        <div><Label className="text-[10px]">Recebe</Label>
          <Select value={benef} onValueChange={setBenef}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BENEF.map((b) => <SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent>
          </Select></div>
      ) : <div />}
      <div className="flex gap-1">
        <Button type="button" size="sm" onClick={() => { onGerar(fluxo, Number(n), Number(meses), inicio, Number(valor) || 0, fluxo === "comissao" ? benef : null); setAberto(false); }}>Gerar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>×</Button>
      </div>
    </div>
  );
}
