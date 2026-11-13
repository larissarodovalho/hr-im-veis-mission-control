import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Shield } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { safeRows } from "@/lib/csvSafe";
import { formatBRL } from "@/lib/format";
import { fmtDate, todayCRM } from "@/lib/datetime";
import { isAtrasada } from "@/lib/vendaParcelas";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { podeVerFluxoPagamento } from "@/lib/acessoFluxoPagamento";
import NovaVendaDialog from "@/components/imoveis/NovaVendaDialog";

const fmt = (n: number) => formatBRL(n || 0, { dash: false });
const BENEF: Record<string, string> = { hr: "HR Imóveis", vendedor: "Vendedor", captador: "Captador", parceiro: "Parceiro" };
type St = "paga" | "pendente" | "atrasada";
const ST_LABEL: Record<St, string> = { paga: "Paga", pendente: "Pendente", atrasada: "Atrasada" };

function addDays(d: string, n: number) {
  const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10);
}

export default function FluxoPagamentoReport() {
  const { isAdmin, isGestor, loading: roleLoading } = useRole();
  const { user } = useAuth();
  const can = (isAdmin || isGestor) && podeVerFluxoPagamento(user?.id);
  const hoje = todayCRM();
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [vendas, setVendas] = useState<Record<string, any>>({});
  const [imoveis, setImoveis] = useState<Record<string, any>>({});
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [parceiros, setParceiros] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [de, setDe] = useState(""); const [ate, setAte] = useState("");
  const [fluxo, setFluxo] = useState("todos"); const [status, setStatus] = useState("todos");
  const [benef, setBenef] = useState("todos"); const [corretor, setCorretor] = useState("todos");
  const [aberta, setAberta] = useState<any | null>(null);

  const load = useCallback(async () => {
    const all: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase.from("venda_parcelas").select("*").order("vencimento").range(from, from + 999);
      all.push(...(data ?? [])); if (!data || data.length < 1000) break;
    }
    const ids = [...new Set(all.map((p) => p.venda_id))];
    const vs: any[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await supabase.from("vendas").select("*").in("id", ids.slice(i, i + 200)); vs.push(...(data ?? []));
    }
    const imIds = [...new Set(vs.map((v) => v.imovel_id).filter(Boolean))];
    const ims: any[] = [];
    for (let i = 0; i < imIds.length; i += 200) {
      const { data } = await supabase.from("imoveis").select("id,codigo,titulo").in("id", imIds.slice(i, i + 200)); ims.push(...(data ?? []));
    }
    const [{ data: profs }, { data: parcs }] = await Promise.all([
      supabase.from("profiles").select("user_id,nome"),
      supabase.from("corretores_parceiros").select("id,nome"),
    ]);
    setParcelas(all);
    setVendas(Object.fromEntries(vs.map((v) => [v.id, v])));
    setImoveis(Object.fromEntries(ims.map((m: any) => [m.id, m])));
    setNomes(Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p.nome])));
    setParceiros(Object.fromEntries((parcs ?? []).map((p: any) => [p.id, p.nome])));
    setLoading(false);
  }, []);

  useEffect(() => { if (can) load(); }, [can, load]);
  useEffect(() => {
    if (!can) return;
    let t: any;
    const ch = supabase.channel(`fluxo-pag-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "venda_parcelas" }, () => { clearTimeout(t); t = setTimeout(load, 1500); })
      .on("postgres_changes", { event: "*", schema: "public", table: "vendas" }, () => { clearTimeout(t); t = setTimeout(load, 1500); })
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [can, load]);

  const linhas = useMemo(() => parcelas.map((p) => {
    const v = vendas[p.venda_id] ?? {};
    const st: St = p.status === "paga" ? "paga" : isAtrasada(p, hoje) ? "atrasada" : "pendente";
    let recebe = p.fluxo === "comissao" ? BENEF[p.beneficiario ?? "hr"] ?? "—" : "HR / Vendedor do imóvel";
    if (p.fluxo === "comissao") {
      const id = p.beneficiario === "vendedor" ? v.corretor_vendedor_id : p.beneficiario === "captador" ? v.corretor_captador_id : null;
      if (id && nomes[id]) recebe += ` — ${nomes[id]}`;
      if (p.beneficiario === "parceiro" && parceiros[v.corretor_parceiro_id]) recebe += ` — ${parceiros[v.corretor_parceiro_id]}`;
    }
    const im = imoveis[v.imovel_id];
    return { p, v, st, recebe, imovel: im ? `${im.codigo ?? ""} ${im.titulo ?? ""}`.trim() : "—" };
  }), [parcelas, vendas, imoveis, nomes, parceiros, hoje]);

  const corretores = useMemo(() => {
    const s = new Set<string>();
    Object.values(vendas).forEach((v: any) => { if (v.corretor_vendedor_id) s.add(v.corretor_vendedor_id); if (v.corretor_captador_id) s.add(v.corretor_captador_id); });
    return [...s].map((id) => ({ id, nome: nomes[id] ?? "—" })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [vendas, nomes]);

  const filtradas = linhas.filter(({ p, v, st }) =>
    (!de || p.vencimento >= de) && (!ate || p.vencimento <= ate) &&
    (fluxo === "todos" || p.fluxo === fluxo) && (status === "todos" || st === status) &&
    (benef === "todos" || (p.fluxo === "comissao" && (p.beneficiario ?? "hr") === benef)) &&
    (corretor === "todos" || v.corretor_vendedor_id === corretor || v.corretor_captador_id === corretor));

  const resumo = (f: string) => {
    const r = { total: 0, paga: 0, pendente: 0, atrasada: 0 };
    filtradas.filter((l) => l.p.fluxo === f).forEach((l) => { r.total += Number(l.p.valor) || 0; r[l.st] += Number(l.p.valor) || 0; });
    return r;
  };
  const porBenef = Object.keys(BENEF).map((b) => {
    const ls = filtradas.filter((l) => l.p.fluxo === "comissao" && (l.p.beneficiario ?? "hr") === b);
    const rec = ls.filter((l) => l.st === "paga").reduce((s, l) => s + Number(l.p.valor), 0);
    const tot = ls.reduce((s, l) => s + Number(l.p.valor), 0);
    return { b, rec, falta: tot - rec, tot };
  }).filter((x) => x.tot > 0);
  const limite = addDays(hoje, 30);
  const proximas = filtradas.filter((l) => l.st === "atrasada" || (l.st === "pendente" && l.p.vencimento <= limite));

  const linhaExport = (l: any) => ({
    Tipo: l.p.fluxo === "comissao" ? "Comissão" : "Imóvel", Cliente: l.v.cliente_nome ?? "", Imóvel: l.imovel,
    Parcela: l.p.numero, Recebe: l.recebe, Vencimento: fmtDate(l.p.vencimento + "T12:00:00"),
    Valor: Number(l.p.valor), Status: ST_LABEL[l.st as St], "Pago em": l.p.pago_em ? fmtDate(l.p.pago_em + "T12:00:00") : "", Observação: l.p.observacao ?? "",
  });
  const csv = () => {
    const blob = new Blob(["\ufeff" + Papa.unparse(safeRows(filtradas.map(linhaExport)), { delimiter: ";" })], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `fluxo-pagamento-${hoje}.csv`; a.click();
  };
  const pdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const cols: [string, number][] = [["Tipo", 20], ["Cliente", 45], ["Imóvel", 50], ["Nº", 8], ["Recebe", 50], ["Venc.", 22], ["Valor", 28], ["Status", 20], ["Pago em", 22]];
    let y = 14;
    doc.setFontSize(14); doc.text("Fluxo de pagamento — HR Imóveis", 10, y); y += 6;
    doc.setFontSize(9);
    const c = resumo("comissao"), im = resumo("imovel");
    doc.text(`Comissões: total ${fmt(c.total)} | recebido ${fmt(c.paga)} | pendente ${fmt(c.pendente)} | atrasado ${fmt(c.atrasada)}`, 10, y); y += 5;
    doc.text(`Imóvel: total ${fmt(im.total)} | recebido ${fmt(im.paga)} | pendente ${fmt(im.pendente)} | atrasado ${fmt(im.atrasada)}`, 10, y); y += 7;
    const header = () => { doc.setFont("helvetica", "bold"); let x = 10; cols.forEach(([h, w]) => { doc.text(h, x, y); x += w; }); doc.setFont("helvetica", "normal"); y += 5; };
    header();
    filtradas.forEach((l) => {
      if (y > 195) { doc.addPage(); y = 14; header(); }
      const e = linhaExport(l); const vals = [e.Tipo, e.Cliente, e.Imóvel, String(e.Parcela), e.Recebe, e.Vencimento, fmt(e.Valor), e.Status, e["Pago em"]];
      let x = 10; vals.forEach((t, i) => { const w = cols[i][1]; doc.text(doc.splitTextToSize(String(t), w - 2)[0] ?? "", x, y); x += w; }); y += 5;
    });
    doc.save(`fluxo-pagamento-${hoje}.pdf`);
  };

  if (roleLoading) return null;
  if (!can) return <Card className="p-6 flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" />Relatório de acesso restrito.</Card>;

  const ResumoCard = ({ t, r }: { t: string; r: ReturnType<typeof resumo> }) => (
    <Card className="p-4 space-y-2">
      <div className="text-sm text-muted-foreground">{t}</div>
      <div className="text-2xl font-bold tabular-nums">{fmt(r.total)}</div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-success/10 p-2"><div className="text-muted-foreground">Recebido</div><div className="font-semibold text-success tabular-nums">{fmt(r.paga)}</div></div>
        <div className="rounded bg-warning/10 p-2"><div className="text-muted-foreground">Pendente</div><div className="font-semibold tabular-nums">{fmt(r.pendente)}</div></div>
        <div className="rounded bg-destructive/10 p-2"><div className="text-muted-foreground">Atrasado</div><div className="font-semibold text-destructive tabular-nums">{fmt(r.atrasada)}</div></div>
      </div>
    </Card>
  );
  const StBadge = ({ s }: { s: St }) => s === "paga" ? <Badge className="bg-success text-background hover:bg-success">Paga</Badge>
    : s === "atrasada" ? <Badge variant="destructive">Atrasada</Badge> : <Badge className="bg-warning text-foreground hover:bg-warning">Pendente</Badge>;
  const Tabela = ({ ls }: { ls: typeof filtradas }) => (
    <div className="overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead><TableHead>Imóvel</TableHead><TableHead>Nº</TableHead><TableHead>Recebe</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead><TableHead>Pago em</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
      <TableBody>{ls.map((l) => (
        <TableRow key={l.p.id} className="cursor-pointer" onClick={() => setAberta(l.v)}>
          <TableCell>{l.p.fluxo === "comissao" ? "Comissão" : "Imóvel"}</TableCell>
          <TableCell>{l.v.cliente_nome ?? "—"}</TableCell>
          <TableCell className="max-w-[220px] truncate">{l.imovel}</TableCell>
          <TableCell>{l.p.numero}</TableCell>
          <TableCell>{l.recebe}</TableCell>
          <TableCell>{fmtDate(l.p.vencimento + "T12:00:00")}</TableCell>
          <TableCell className="text-right tabular-nums font-medium">{fmt(Number(l.p.valor))}</TableCell>
          <TableCell><StBadge s={l.st} /></TableCell>
          <TableCell>{l.p.pago_em ? fmtDate(l.p.pago_em + "T12:00:00") : "—"}</TableCell>
          <TableCell className="max-w-[220px] truncate text-muted-foreground">{l.p.observacao ?? ""}</TableCell>
        </TableRow>))}
        {ls.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhuma parcela.</TableCell></TableRow>}
      </TableBody></Table></div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
        <div><Label className="text-xs">Vencimento de</Label><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></div>
        <div><Label className="text-xs">até</Label><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
        <div><Label className="text-xs">Tipo</Label><Select value={fluxo} onValueChange={setFluxo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Ambos</SelectItem><SelectItem value="comissao">Comissão</SelectItem><SelectItem value="imovel">Imóvel</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs">Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="paga">Pago</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="atrasada">Atrasado</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs">Quem recebe</Label><Select value={benef} onValueChange={setBenef}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(BENEF).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Corretor</Label><Select value={corretor} onValueChange={setCorretor}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{corretores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={csv}><FileSpreadsheet className="h-4 w-4 mr-1" />CSV</Button><Button variant="outline" size="sm" onClick={pdf}><FileText className="h-4 w-4 mr-1" />PDF</Button></div>
      </Card>

      {loading ? <Card className="p-6 text-muted-foreground">Carregando…</Card> : <>
        <div className="grid md:grid-cols-2 gap-4"><ResumoCard t="Comissões" r={resumo("comissao")} /><ResumoCard t="Pagamento dos imóveis" r={resumo("imovel")} /></div>
        {porBenef.length > 0 && <Card className="p-4"><h3 className="font-semibold mb-2">Comissões por quem recebe</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{porBenef.map((x) => (
            <div key={x.b} className="rounded border p-3"><div className="text-sm font-medium">{BENEF[x.b]}</div><div className="text-lg font-bold tabular-nums">{fmt(x.tot)}</div>
              <div className="text-xs"><span className="text-success">Recebido {fmt(x.rec)}</span> · <span className="text-muted-foreground">Falta {fmt(x.falta)}</span></div></div>))}</div></Card>}
        <Card className="p-4"><h3 className="font-semibold mb-2">Atrasadas e próximos 30 dias ({proximas.length})</h3><Tabela ls={proximas} /></Card>
        <Card className="p-4"><h3 className="font-semibold mb-2">Todas as parcelas ({filtradas.length})</h3><Tabela ls={filtradas} /></Card>
      </>}

      <NovaVendaDialog open={!!aberta} onOpenChange={(o) => { if (!o) setAberta(null); }} initial={aberta} onSaved={() => { setAberta(null); load(); }} />
    </div>
  );
}
