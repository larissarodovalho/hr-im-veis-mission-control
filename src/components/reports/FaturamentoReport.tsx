import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchableSelect from "@/components/SearchableSelect";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingUp, Coins, Building2, BarChart3 } from "lucide-react";
import { ORIGENS, NIVEIS, origemLabel, nivelLabel, type OrigemNegocio, type NivelCorretor } from "@/lib/comissaoHR";
import * as XLSX from "xlsx";

type Venda = {
  id: string;
  data_venda: string;
  valor_venda: number | null;
  valor_comissao: number | null;
  corretor_vendedor_id: string | null;
  corretor_captador_id: string | null;
  corretor_parceiro_id: string | null;
  percent_vendedor: number | null;
  percent_captador: number | null;
  percent_hr: number | null;
  status_pagamento: string | null;
  cliente_nome: string | null;
  origem_negocio: string | null;
  nivel_corretor: string | null;
};

import { formatBRL } from "@/lib/format";
const fmtBRL = (n: number) => formatBRL(n || 0, { dash: false });

type Preset = "mes" | "trimestre" | "ano" | "custom";

function getRange(preset: Preset, from: string, to: string): { from: Date; to: Date } {
  const now = new Date();
  if (preset === "mes") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
  }
  if (preset === "trimestre") {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { from: d, to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
  }
  if (preset === "ano") {
    return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
  }
  return {
    from: from ? new Date(from + "T00:00:00") : new Date(now.getFullYear(), 0, 1),
    to: to ? new Date(to + "T23:59:59") : now,
  };
}

export default function FaturamentoReport() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<Preset>("ano");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [papel, setPapel] = useState<"todos" | "vendedor" | "captador" | "hr">("todos");
  const [corretorId, setCorretorId] = useState<string>("none");
  const [origem, setOrigem] = useState<"todos" | OrigemNegocio>("todos");
  const [nivel, setNivel] = useState<"todos" | NivelCorretor>("todos");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: v }, { data: p }] = await Promise.all([
        supabase.from("vendas").select("*").order("data_venda", { ascending: false }),
        supabase.from("profiles").select("user_id,nome"),
      ]);
      setVendas((v ?? []) as any);
      setProfiles((p ?? []).map((x: any) => ({ id: x.user_id, nome: x.nome || "Sem nome" })));
      setLoading(false);
    })();
  }, []);

  const nameOf = useMemo(() => {
    const m = new Map(profiles.map((p) => [p.id, p.nome]));
    return (id?: string | null) => (id ? m.get(id) || "—" : "—");
  }, [profiles]);

  const range = useMemo(() => getRange(preset, from, to), [preset, from, to]);

  const filtered = useMemo(() => {
    return vendas.filter((v) => {
      if (!v.data_venda) return false;
      const d = new Date(v.data_venda);
      if (d < range.from || d > range.to) return false;
      if (origem !== "todos" && v.origem_negocio !== origem) return false;
      if (nivel !== "todos" && v.nivel_corretor !== nivel) return false;
      if (corretorId !== "none") {
        const inRole =
          (papel === "todos" || papel === "vendedor") && v.corretor_vendedor_id === corretorId ||
          (papel === "todos" || papel === "captador") && v.corretor_captador_id === corretorId;
        if (!inRole) return false;
      }
      return true;
    });
  }, [vendas, range, papel, corretorId, origem, nivel]);

  // KPIs
  const kpis = useMemo(() => {
    let vgv = 0, comissao = 0, hr = 0;
    filtered.forEach((v) => {
      const val = v.valor_venda || 0;
      const com = v.valor_comissao || 0;
      vgv += val;
      comissao += com;
      hr += (v.valor_venda || 0) * ((v.percent_hr ?? 0) / 100);
    });
    return { vgv, comissao, hr, count: filtered.length };
  }, [filtered]);

  // Ranking
  type Row = {
    corretor_id: string;
    nome: string;
    vgv_vendedor: number; vgv_captador: number;
    com_vendedor: number; com_captador: number;
    vendas_vendedor: number; vendas_captador: number;
  };
  const ranking = useMemo(() => {
    const map = new Map<string, Row>();
    const ensure = (id: string): Row => {
      let r = map.get(id);
      if (!r) {
        r = { corretor_id: id, nome: nameOf(id), vgv_vendedor: 0, vgv_captador: 0, com_vendedor: 0, com_captador: 0, vendas_vendedor: 0, vendas_captador: 0 };
        map.set(id, r);
      }
      return r;
    };
    filtered.forEach((v) => {
      const val = v.valor_venda || 0;
      const com = v.valor_comissao || 0;
      if (v.corretor_vendedor_id && (papel === "todos" || papel === "vendedor")) {
        const r = ensure(v.corretor_vendedor_id);
        r.vgv_vendedor += val;
        r.com_vendedor += val * ((v.percent_vendedor ?? 0) / 100);
        r.vendas_vendedor++;
      }
      if (v.corretor_captador_id && (papel === "todos" || papel === "captador")) {
        const r = ensure(v.corretor_captador_id);
        r.vgv_captador += val;
        r.com_captador += val * ((v.percent_captador ?? 0) / 100);
        r.vendas_captador++;
      }
    });
    return [...map.values()].sort((a, b) =>
      (b.vgv_vendedor + b.vgv_captador) - (a.vgv_vendedor + a.vgv_captador)
    );
  }, [filtered, papel, nameOf]);

  // Evolução mensal
  const [chartMode, setChartMode] = useState<"vgv" | "comissao">("vgv");
  const chartData = useMemo(() => {
    const buckets = new Map<string, { mes: string; Vendedor: number; Captador: number; HR: number }>();
    filtered.forEach((v) => {
      const d = new Date(v.data_venda);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let b = buckets.get(key);
      if (!b) { b = { mes: key, Vendedor: 0, Captador: 0, HR: 0 }; buckets.set(key, b); }
      const val = v.valor_venda || 0;
      const com = v.valor_comissao || 0;
      if (chartMode === "vgv") {
        if (v.corretor_vendedor_id) b.Vendedor += val;
        if (v.corretor_captador_id) b.Captador += val;
        b.HR += val; // a casa participa de toda venda
      } else {
        b.Vendedor += val * ((v.percent_vendedor ?? 0) / 100);
        b.Captador += val * ((v.percent_captador ?? 0) / 100);
        b.HR += val * ((v.percent_hr ?? 0) / 100);
      }
    });
    return [...buckets.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filtered, chartMode]);

  const exportRanking = () => {
    const rows = ranking.map((r) => ({
      Corretor: r.nome,
      "VGV Vendedor": r.vgv_vendedor,
      "VGV Captador": r.vgv_captador,
      "VGV Total": r.vgv_vendedor + r.vgv_captador,
      "Comissão Vendedor": r.com_vendedor,
      "Comissão Captador": r.com_captador,
      "Comissão Total": r.com_vendedor + r.com_captador,
      "Nº Vendas (Vendedor)": r.vendas_vendedor,
      "Nº Vendas (Captador)": r.vendas_captador,
    }));
    rows.push({
      Corretor: "HR Imóveis (casa)",
      "VGV Vendedor": 0, "VGV Captador": 0, "VGV Total": kpis.vgv,
      "Comissão Vendedor": 0, "Comissão Captador": 0, "Comissão Total": kpis.hr,
      "Nº Vendas (Vendedor)": 0, "Nº Vendas (Captador)": kpis.count,
    } as any);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faturamento");
    XLSX.writeFile(wb, `faturamento-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const showVendedor = papel === "todos" || papel === "vendedor";
  const showCaptador = papel === "todos" || papel === "captador";

  return (
    <Card className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Faturamento</h2>
          <p className="text-sm text-muted-foreground">VGV e comissão por corretor responsável.</p>
        </div>
        <Button variant="outline" onClick={exportRanking} disabled={loading}>
          <Download className="h-4 w-4 mr-2" /> Exportar ranking
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <Label className="text-xs">Período</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Mês atual</SelectItem>
              <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
              <SelectItem value="ano">Ano atual</SelectItem>
              <SelectItem value="custom">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {preset === "custom" && (
          <>
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <Label className="text-xs">Papel</Label>
          <Select value={papel} onValueChange={(v) => setPapel(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="vendedor">Vendedor</SelectItem>
              <SelectItem value="captador">Captador</SelectItem>
              <SelectItem value="hr">HR Imóveis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Origem</Label>
          <Select value={origem} onValueChange={(v) => setOrigem(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {ORIGENS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Nível</Label>
          <Select value={nivel} onValueChange={(v) => setNivel(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {NIVEIS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Corretor</Label>
          <SearchableSelect
            value={corretorId}
            onChange={setCorretorId}
            options={profiles}
            placeholder="Todos…"
            emptyLabel="Todos"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> VGV total</div>
          <div className="text-2xl font-semibold mt-1">{fmtBRL(kpis.vgv)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3 w-3" /> Comissão total</div>
          <div className="text-2xl font-semibold mt-1">{fmtBRL(kpis.comissao)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> HR Imóveis (casa)</div>
          <div className="text-2xl font-semibold mt-1">{fmtBRL(kpis.hr)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Nº de vendas</div>
          <div className="text-2xl font-semibold mt-1">{kpis.count}</div>
        </Card>
      </div>

      {/* Gráfico */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Evolução mensal</h3>
          <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="vgv" className="text-xs">VGV</TabsTrigger>
              <TabsTrigger value="comissao" className="text-xs">Comissão</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-muted-foreground text-sm">Sem dados no período.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend />
                <Bar dataKey="Vendedor" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="Captador" stackId="a" fill="hsl(var(--accent))" />
                <Bar dataKey="HR" stackId="a" fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Ranking */}
      <Card className="p-4 overflow-x-auto">
        <h3 className="font-semibold text-sm mb-3">Ranking por corretor</h3>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        ) : ranking.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem vendas no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                {showVendedor && <TableHead className="text-right">VGV vendedor</TableHead>}
                {showCaptador && <TableHead className="text-right">VGV captador</TableHead>}
                <TableHead className="text-right">VGV total</TableHead>
                {showVendedor && <TableHead className="text-right">Comissão vendedor</TableHead>}
                {showCaptador && <TableHead className="text-right">Comissão captador</TableHead>}
                <TableHead className="text-right">Comissão total</TableHead>
                <TableHead className="text-right">Nº vendas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((r) => (
                <TableRow key={r.corretor_id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  {showVendedor && <TableCell className="text-right">{fmtBRL(r.vgv_vendedor)}</TableCell>}
                  {showCaptador && <TableCell className="text-right">{fmtBRL(r.vgv_captador)}</TableCell>}
                  <TableCell className="text-right font-semibold">{fmtBRL(r.vgv_vendedor + r.vgv_captador)}</TableCell>
                  {showVendedor && <TableCell className="text-right">{fmtBRL(r.com_vendedor)}</TableCell>}
                  {showCaptador && <TableCell className="text-right">{fmtBRL(r.com_captador)}</TableCell>}
                  <TableCell className="text-right font-semibold">{fmtBRL(r.com_vendedor + r.com_captador)}</TableCell>
                  <TableCell className="text-right">{Math.max(r.vendas_vendedor, r.vendas_captador)}</TableCell>
                </TableRow>
              ))}
              {(papel === "todos" || papel === "hr") && (
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">HR Imóveis (casa)</TableCell>
                  {showVendedor && <TableCell className="text-right">—</TableCell>}
                  {showCaptador && <TableCell className="text-right">—</TableCell>}
                  <TableCell className="text-right font-semibold">{fmtBRL(kpis.vgv)}</TableCell>
                  {showVendedor && <TableCell className="text-right">—</TableCell>}
                  {showCaptador && <TableCell className="text-right">—</TableCell>}
                  <TableCell className="text-right font-semibold">{fmtBRL(kpis.hr)}</TableCell>
                  <TableCell className="text-right">{kpis.count}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </Card>
  );
}
