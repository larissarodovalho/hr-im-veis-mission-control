import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

type Linha = { key: string; tipo: "corretor" | "vaga" | "hrx"; id?: string; novo?: boolean; label: string; peso: number; valor: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number, dec = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const parseBR = (s: string) => {
  const t = s.replace(/[^\d,.-]/g, "");
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t.replace(/\.(?=\d{3}(\D|$))/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function NumInput({ value, onChange, dec = 2, className = "" }: { value: number; onChange: (n: number) => void; dec?: number; className?: string }) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <Input
      inputMode="decimal"
      className={`h-9 text-right tabular-nums ${className}`}
      value={txt ?? fmt(value, dec)}
      onFocus={(e) => { setTxt(fmt(value, dec)); requestAnimationFrame(() => e.target.select()); }}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => { if (txt != null) onChange(parseBR(txt)); setTxt(null); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

export default function MetasVgvDialog({ corretores, anoInicial }: { corretores: Array<{ user_id: string; nome: string }>; anoInicial: number }) {
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [total, setTotal] = useState(0);
  const [removidos, setRemovidos] = useState<Linha[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [addSel, setAddSel] = useState<string>("");

  const idsKey = corretores.map((c) => c.user_id).join(",");
  useEffect(() => {
    if (!open) return;
    setRemovidos([]);
    Promise.all([
      supabase.from("metas_vgv").select("corretor_id, meta_vgv, peso").eq("ano", ano),
      supabase.from("metas_institucionais").select("meta_vgv, peso").eq("entidade", "hrx_producoes").eq("ano", ano).maybeSingle(),
      supabase.from("metas_vgv_vagas").select("id, rotulo, peso, meta_vgv").eq("ano", ano).order("created_at"),
      supabase.from("metas_vgv_ano").select("meta_total").eq("ano", ano).maybeSingle(),
    ]).then(([{ data: metas }, { data: hrx }, { data: vagas }, { data: anoRow }]) => {
      const nomes = new Map(corretores.map((c) => [c.user_id, c.nome]));
      const ls: Linha[] = (metas ?? []).map((x: any) => ({
        key: x.corretor_id, tipo: "corretor", id: x.corretor_id, label: nomes.get(x.corretor_id) ?? "Corretor",
        peso: Number(x.peso) || 0, valor: Number(x.meta_vgv) || 0,
      }));
      ls.sort((a, b) => b.peso - a.peso);
      (vagas ?? []).forEach((v: any) => ls.push({ key: v.id, tipo: "vaga", id: v.id, label: v.rotulo, peso: Number(v.peso) || 0, valor: Number(v.meta_vgv) || 0 }));
      ls.push({ key: "hrx", tipo: "hrx", label: "Carteira HRX (HRX Produções)", peso: Number(hrx?.peso) || 0, valor: Number(hrx?.meta_vgv) || 0 });
      setLinhas(ls);
      setTotal(Number(anoRow?.meta_total) || r2(ls.reduce((s, l) => s + l.valor, 0)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ano, idsKey]);

  const somaPesos = useMemo(() => linhas.reduce((s, l) => s + l.peso, 0), [linhas]);
  const somar = (ls: Linha[]) => r2(ls.reduce((s, l) => s + l.valor, 0));
  const distribuir = (ls: Linha[], t: number) => {
    const sp = ls.reduce((s, l) => s + l.peso, 0);
    return sp > 0 ? ls.map((l) => ({ ...l, valor: r2((t * l.peso) / sp) })) : ls;
  };

  const mudarTotal = (t: number) => { setTotal(t); setLinhas((ls) => distribuir(ls, t)); };
  const mudarPeso = (key: string, p: number) => setLinhas((ls) => distribuir(ls.map((l) => (l.key === key ? { ...l, peso: p } : l)), total));
  const aplicar = (n: Linha[]) => { setLinhas(n); setTotal(somar(n)); };
  const mudarValor = (key: string, v: number) => aplicar(linhas.map((l) => (l.key === key ? { ...l, valor: v } : l)));
  const mudarPct = (key: string, pct: number) => mudarValor(key, r2((total * pct) / 100));
  const mudarRotulo = (key: string, rotulo: string) => setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, label: rotulo } : l)));

  const disponiveis = corretores.filter((c) => !linhas.some((l) => l.tipo === "corretor" && l.id === c.user_id));
  const adicionar = (v: string) => {
    if (!v) return;
    const nova: Linha = v === "__vaga"
      ? { key: `novo-${Date.now()}`, tipo: "vaga", novo: true, label: "Novo corretor", peso: 0, valor: 0 }
      : { key: v, tipo: "corretor", id: v, label: corretores.find((c) => c.user_id === v)?.nome ?? "Corretor", peso: 0, valor: 0 };
    const idxHrx = linhas.findIndex((l) => l.tipo === "hrx");
    const n = [...linhas]; n.splice(idxHrx < 0 ? n.length : idxHrx, 0, nova);
    setLinhas(n); setAddSel("");
  };
  const remover = (l: Linha) => {
    if (!l.novo) setRemovidos((r) => [...r, l]);
    aplicar(linhas.filter((x) => x.key !== l.key));
  };

  const salvar = async () => {
    setSalvando(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const pessoais = linhas.filter((l) => l.tipo === "corretor").map((l) => ({ corretor_id: l.id!, ano, meta_vgv: l.valor, peso: l.peso, created_by: uid }));
    const hrx = linhas.find((l) => l.tipo === "hrx")!;
    const vagasExist = linhas.filter((l) => l.tipo === "vaga" && !l.novo);
    const vagasNovas = linhas.filter((l) => l.tipo === "vaga" && l.novo).map((v) => ({ ano, rotulo: v.label, peso: v.peso, meta_vgv: v.valor }));
    const remCorr = removidos.filter((l) => l.tipo === "corretor").map((l) => l.id!);
    const remVagas = removidos.filter((l) => l.tipo === "vaga").map((l) => l.id!);
    const ok = { error: null };
    const res = await Promise.all([
      pessoais.length ? supabase.from("metas_vgv").upsert(pessoais, { onConflict: "corretor_id,ano" }) : Promise.resolve(ok),
      remCorr.length ? supabase.from("metas_vgv").delete().eq("ano", ano).in("corretor_id", remCorr) : Promise.resolve(ok),
      remVagas.length ? supabase.from("metas_vgv_vagas").delete().in("id", remVagas) : Promise.resolve(ok),
      vagasNovas.length ? supabase.from("metas_vgv_vagas").insert(vagasNovas) : Promise.resolve(ok),
      supabase.from("metas_institucionais").upsert({ entidade: "hrx_producoes", ano, meta_vgv: hrx.valor, peso: hrx.peso, created_by: uid }, { onConflict: "entidade,ano" }),
      supabase.from("metas_vgv_ano").upsert({ ano, meta_total: total }, { onConflict: "ano" }),
      ...vagasExist.map((v) => supabase.from("metas_vgv_vagas").update({ rotulo: v.label, peso: v.peso, meta_vgv: v.valor }).eq("id", v.id!)),
    ]);
    const error = res.find((r: any) => r.error)?.error;
    setSalvando(false);
    if (error) return toast.error("Erro ao salvar metas: " + error.message);
    toast.success("Metas salvas"); setOpen(false);
  };

  const anos = [anoInicial - 1, anoInicial, anoInicial + 1];
  const somaValores = somar(linhas);
  const grid = "grid grid-cols-[minmax(0,1fr)_80px_110px_190px_40px] items-center gap-3";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Target className="h-4 w-4 mr-1" /> Metas de VGV</Button></DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
        <DialogHeader><DialogTitle>Metas anuais de VGV</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <label className="text-sm font-medium">Meta total (R$)</label>
          <NumInput className="w-52" value={total} onChange={mudarTotal} />
        </div>
        <p className="text-xs text-muted-foreground">Alterar a meta total ou um peso redistribui os valores. Alterar % ou valor ajusta a linha e o total.</p>

        <div className={`${grid} text-xs font-medium text-muted-foreground border-b pb-2 px-1`}>
          <span>Canal / Corretor</span><span className="text-right">Peso</span><span className="text-right">% da meta</span><span className="text-right">Meta {ano} (R$)</span><span />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 px-1 min-h-0">
          {linhas.map((l) => (
            <div key={l.key} className={grid}>
              <div className="min-w-0">
                {l.tipo === "vaga"
                  ? <Input className="h-9" value={l.label} onChange={(e) => mudarRotulo(l.key, e.target.value)} />
                  : <><p className="text-sm font-medium truncate">{l.label}</p>{l.tipo === "hrx" && <p className="text-xs text-muted-foreground">Somente vendas de marketing</p>}</>}
              </div>
              <NumInput dec={0} value={l.peso} onChange={(n) => mudarPeso(l.key, n)} />
              <NumInput value={total > 0 ? r2((l.valor / total) * 100) : 0} onChange={(n) => mudarPct(l.key, n)} />
              <NumInput value={l.valor} onChange={(n) => mudarValor(l.key, n)} />
              {l.tipo === "hrx" ? <span /> : (
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" title="Remover" onClick={() => remover(l)}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
        </div>

        <div className={`${grid} border-t pt-2 px-1 text-sm font-semibold`}>
          <span>TOTAL</span>
          <span className="text-right tabular-nums">{fmt(somaPesos, 0)}</span>
          <span className="text-right tabular-nums">{total > 0 ? `${fmt((somaValores / total) * 100)}%` : "—"}</span>
          <span className="text-right tabular-nums">{formatBRL(somaValores)}</span>
          <span />
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Select value={addSel} onValueChange={adicionar}>
            <SelectTrigger className="w-[240px]"><Plus className="h-4 w-4 mr-1" /><SelectValue placeholder="Adicionar corretor" /></SelectTrigger>
            <SelectContent>
              {disponiveis.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>)}
              <SelectItem value="__vaga">Vaga (novo corretor)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
