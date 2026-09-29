import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";

type Linha = { key: string; tipo: "corretor" | "vaga" | "hrx"; id?: string; label: string; peso: number; valor: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

export default function MetasVgvDialog({ corretores, anoInicial }: { corretores: Array<{ user_id: string; nome: string }>; anoInicial: number }) {
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [total, setTotal] = useState(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("metas_vgv").select("corretor_id, meta_vgv, peso").eq("ano", ano),
      supabase.from("metas_institucionais").select("meta_vgv, peso").eq("entidade", "hrx_producoes").eq("ano", ano).maybeSingle(),
      supabase.from("metas_vgv_vagas").select("id, rotulo, peso, meta_vgv").eq("ano", ano).order("created_at"),
      supabase.from("metas_vgv_ano").select("meta_total").eq("ano", ano).maybeSingle(),
    ]).then(([{ data: metas }, { data: hrx }, { data: vagas }, { data: anoRow }]) => {
      const m = new Map((metas ?? []).map((x: any) => [x.corretor_id, x]));
      const ls: Linha[] = corretores.map((c) => {
        const x: any = m.get(c.user_id);
        return { key: c.user_id, tipo: "corretor", id: c.user_id, label: c.nome, peso: Number(x?.peso) || 0, valor: Number(x?.meta_vgv) || 0 };
      });
      (vagas ?? []).forEach((v: any) => ls.push({ key: v.id, tipo: "vaga", id: v.id, label: v.rotulo, peso: Number(v.peso) || 0, valor: Number(v.meta_vgv) || 0 }));
      ls.push({ key: "hrx", tipo: "hrx", label: "Carteira HRX (HRX Produções)", peso: Number(hrx?.peso) || 0, valor: Number(hrx?.meta_vgv) || 0 });
      ls.sort((a, b) => (a.tipo === "hrx" ? 1 : b.tipo === "hrx" ? -1 : b.peso - a.peso));
      setLinhas(ls);
      setTotal(Number(anoRow?.meta_total) || ls.reduce((s, l) => s + l.valor, 0));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ano, corretores.map((c) => c.user_id).join(",")]);

  const somaPesos = useMemo(() => linhas.reduce((s, l) => s + l.peso, 0), [linhas]);

  const distribuir = (ls: Linha[], t: number) => {
    const sp = ls.reduce((s, l) => s + l.peso, 0);
    return sp > 0 ? ls.map((l) => ({ ...l, valor: r2((t * l.peso) / sp) })) : ls;
  };
  const somar = (ls: Linha[]) => r2(ls.reduce((s, l) => s + l.valor, 0));

  const mudarTotal = (t: number) => { setTotal(t); setLinhas((ls) => distribuir(ls, t)); };
  const mudarPeso = (key: string, p: number) => setLinhas((ls) => distribuir(ls.map((l) => (l.key === key ? { ...l, peso: p } : l)), total));
  const mudarValor = (key: string, v: number) => setLinhas((ls) => { const n = ls.map((l) => (l.key === key ? { ...l, valor: v } : l)); setTotal(somar(n)); return n; });
  const mudarPct = (key: string, pct: number) => mudarValor(key, r2((total * pct) / 100));
  const mudarRotulo = (key: string, rotulo: string) => setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, label: rotulo } : l)));

  const salvar = async () => {
    setSalvando(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const pessoais = linhas.filter((l) => l.tipo === "corretor" && (l.peso > 0 || l.valor > 0))
      .map((l) => ({ corretor_id: l.id!, ano, meta_vgv: l.valor, peso: l.peso, created_by: uid }));
    const zerados = linhas.filter((l) => l.tipo === "corretor" && l.peso === 0 && l.valor === 0).map((l) => l.id!);
    const hrx = linhas.find((l) => l.tipo === "hrx")!;
    const vagas = linhas.filter((l) => l.tipo === "vaga");
    const res = await Promise.all([
      pessoais.length ? supabase.from("metas_vgv").upsert(pessoais, { onConflict: "corretor_id,ano" }) : Promise.resolve({ error: null }),
      zerados.length ? supabase.from("metas_vgv").delete().eq("ano", ano).in("corretor_id", zerados) : Promise.resolve({ error: null }),
      supabase.from("metas_institucionais").upsert({ entidade: "hrx_producoes", ano, meta_vgv: hrx.valor, peso: hrx.peso, created_by: uid }, { onConflict: "entidade,ano" }),
      supabase.from("metas_vgv_ano").upsert({ ano, meta_total: total }, { onConflict: "ano" }),
      ...vagas.map((v) => supabase.from("metas_vgv_vagas").update({ rotulo: v.label, peso: v.peso, meta_vgv: v.valor }).eq("id", v.id!)),
    ]);
    const error = res.find((r: any) => r.error)?.error;
    setSalvando(false);
    if (error) return toast.error("Erro ao salvar metas: " + error.message);
    toast.success("Metas salvas"); setOpen(false);
  };

  const anos = [anoInicial - 1, anoInicial, anoInicial + 1];
  const somaValores = somar(linhas);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Target className="h-4 w-4 mr-1" /> Metas de VGV</Button></DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Metas anuais de VGV</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <label className="text-sm font-medium">Meta total</label>
          <Input type="number" step="0.01" className="w-48 text-right" value={total || ""} onChange={(e) => mudarTotal(Number(e.target.value) || 0)} />
          <span className="text-xs text-muted-foreground">{formatBRL(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Alterar a meta total ou um peso redistribui os valores. Alterar % ou valor ajusta a linha e o total.</p>
        <div className="max-h-[55vh] overflow-y-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Canal / Corretor</TableHead>
              <TableHead className="w-20 text-right">Peso</TableHead>
              <TableHead className="w-24 text-right">% da meta</TableHead>
              <TableHead className="w-44 text-right">Meta {ano}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.key}>
                  <TableCell className="font-medium">
                    {l.tipo === "vaga"
                      ? <Input className="h-8" value={l.label} onChange={(e) => mudarRotulo(l.key, e.target.value)} />
                      : <>{l.label}{l.tipo === "hrx" && <p className="text-xs text-muted-foreground font-normal">Somente vendas de marketing</p>}</>}
                  </TableCell>
                  <TableCell><Input type="number" min={0} className="h-8 text-right" value={l.peso} onChange={(e) => mudarPeso(l.key, Number(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" step="0.01" className="h-8 text-right" value={total > 0 ? r2((l.valor / total) * 100) : 0} onChange={(e) => mudarPct(l.key, Number(e.target.value) || 0)} /></TableCell>
                  <TableCell>
                    <Input type="number" step="0.01" className="h-8 text-right" value={l.valor} onChange={(e) => mudarValor(l.key, Number(e.target.value) || 0)} />
                    <p className="text-[11px] text-right text-muted-foreground">{formatBRL(l.valor)}</p>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{somaPesos}</TableCell>
                <TableCell className="text-right">{total > 0 ? `${((somaValores / total) * 100).toFixed(0)}%` : "—"}</TableCell>
                <TableCell className="text-right">{formatBRL(somaValores)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <DialogFooter><Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
