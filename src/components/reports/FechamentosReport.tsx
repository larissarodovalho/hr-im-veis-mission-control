import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { Link } from "react-router-dom";

type Row = {
  id: string;
  conta_id: string;
  data_fechamento: string;
  valor: number | null;
  imovel_id: string | null;
  observacoes: string | null;
  created_by: string | null;
  conta_nome?: string | null;
  conta_responsavel_id?: string | null;
  imovel_codigo?: string | null;
  imovel_titulo?: string | null;
  responsavel_nome?: string | null;
};

export default function FechamentosReport() {
  const now = new Date();
  const [inicio, setInicio] = useState(format(startOfYear(now), "yyyy-MM-dd"));
  const [fim, setFim] = useState(format(endOfYear(now), "yyyy-MM-dd"));
  const [responsavelId, setResponsavelId] = useState<string>("todos");
  const [agrupamento, setAgrupamento] = useState<"mensal" | "anual">("mensal");
  const [rows, setRows] = useState<Row[]>([]);
  const [responsaveis, setResponsaveis] = useState<{ user_id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: profs }] = await Promise.all([
      supabase
        .from("conta_fechamentos" as any)
        .select("id, conta_id, data_fechamento, valor, imovel_id, observacoes, created_by")
        .gte("data_fechamento", inicio)
        .lte("data_fechamento", fim)
        .order("data_fechamento", { ascending: false }),
      supabase.from("profiles").select("user_id, nome"),
    ]);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data as any as Row[]) ?? [];
    const contaIds = Array.from(new Set(list.map((r) => r.conta_id).filter(Boolean)));
    const imovelIds = Array.from(new Set(list.map((r) => r.imovel_id).filter(Boolean) as string[]));
    const [{ data: contas }, { data: imoveis }] = await Promise.all([
      contaIds.length
        ? supabase.from("contas").select("id, nome, responsavel_id").in("id", contaIds)
        : Promise.resolve({ data: [] as any[] }),
      imovelIds.length
        ? supabase.from("imoveis").select("id, codigo, titulo").in("id", imovelIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const cMap = new Map((contas ?? []).map((c: any) => [c.id, c]));
    const iMap = new Map((imoveis ?? []).map((i: any) => [i.id, i]));
    const pMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.nome]));

    const enriched: Row[] = list.map((r) => {
      const c = cMap.get(r.conta_id) as any;
      const i = r.imovel_id ? (iMap.get(r.imovel_id) as any) : null;
      return {
        ...r,
        conta_nome: c?.nome ?? null,
        conta_responsavel_id: c?.responsavel_id ?? null,
        imovel_codigo: i?.codigo ?? null,
        imovel_titulo: i?.titulo ?? null,
        responsavel_nome: c?.responsavel_id ? pMap.get(c.responsavel_id) ?? null : null,
      };
    });

    const respSet = new Map<string, string>();
    enriched.forEach((r) => {
      if (r.conta_responsavel_id) respSet.set(r.conta_responsavel_id, r.responsavel_nome ?? "Sem nome");
    });
    setResponsaveis([...respSet.entries()].map(([user_id, nome]) => ({ user_id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)));
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim]);

  const filtered = useMemo(
    () => (responsavelId === "todos" ? rows : rows.filter((r) => r.conta_responsavel_id === responsavelId)),
    [rows, responsavelId],
  );

  const totalValor = filtered.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const ticket = filtered.length ? totalValor / filtered.length : 0;

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; label: string; quantidade: number; valor: number }>();
    filtered.forEach((r) => {
      const d = new Date(r.data_fechamento + "T00:00:00");
      const key = agrupamento === "mensal" ? format(d, "yyyy-MM") : format(d, "yyyy");
      const label = agrupamento === "mensal" ? format(d, "MMM/yy", { locale: ptBR }) : format(d, "yyyy");
      const cur = map.get(key) ?? { key, label, quantidade: 0, valor: 0 };
      cur.quantidade++;
      cur.valor += Number(r.valor) || 0;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered, agrupamento]);

  const filenameStamp = () => `${inicio}_a_${fim}`;

  const exportDetalhadoCSV = () => {
    const data = filtered.map((r) => ({
      "Data fechamento": r.data_fechamento,
      Cliente: r.conta_nome ?? "",
      "Imóvel código": r.imovel_codigo ?? "",
      "Imóvel título": r.imovel_titulo ?? "",
      "Valor (R$)": r.valor ?? "",
      Responsável: r.responsavel_nome ?? "",
      Observações: r.observacoes ?? "",
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fechamentos-detalhado-${filenameStamp()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} registros exportados`);
  };

  const exportXLSX = () => {
    const resumoData = grouped.map((g) => ({
      Período: g.label,
      Quantidade: g.quantidade,
      "Valor total (R$)": g.valor,
    }));
    resumoData.push({
      Período: "TOTAL" as any,
      Quantidade: filtered.length,
      "Valor total (R$)": totalValor,
    });
    const detalhado = filtered.map((r) => ({
      "Data fechamento": r.data_fechamento,
      Cliente: r.conta_nome ?? "",
      "Imóvel código": r.imovel_codigo ?? "",
      "Imóvel título": r.imovel_titulo ?? "",
      "Valor (R$)": Number(r.valor) || 0,
      Responsável: r.responsavel_nome ?? "",
      Observações: r.observacoes ?? "",
    }));
    const wb = XLSX.utils.book_new();
    const wsResumo = XLSX.utils.json_to_sheet(resumoData);
    const wsDetalhe = XLSX.utils.json_to_sheet(detalhado);
    XLSX.utils.book_append_sheet(wb, wsResumo, agrupamento === "mensal" ? "Resumo mensal" : "Resumo anual");
    XLSX.utils.book_append_sheet(wb, wsDetalhe, "Detalhado");
    XLSX.writeFile(wb, `fechamentos-${filenameStamp()}.xlsx`);
    toast.success("Excel gerado");
  };

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Negócios fechados
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportDetalhadoCSV} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={exportXLSX} disabled={!filtered.length}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel (.xlsx)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Início</Label>
          <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Fim</Label>
          <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Responsável</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
          >
            <option value="todos">Todos</option>
            {responsaveis.map((r) => (
              <option key={r.user_id} value={r.user_id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Agrupamento</Label>
          <Tabs value={agrupamento} onValueChange={(v) => setAgrupamento(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="mensal" className="flex-1">Mensal</TabsTrigger>
              <TabsTrigger value="anual" className="flex-1">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Negócios fechados</p>
          <p className="text-2xl font-semibold">{filtered.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Valor total</p>
          <p className="text-2xl font-semibold text-primary">{formatBRL(totalValor)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Ticket médio</p>
          <p className="text-2xl font-semibold">{formatBRL(ticket)}</p>
        </Card>
      </div>

      <div className="h-72">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Nenhum fechamento no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grouped}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatBRL(Number(v))} width={90} />
              <RTooltip
                formatter={(value: any, name: any) =>
                  name === "Valor (R$)" ? formatBRL(Number(value)) : value
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="quantidade" name="Quantidade" fill="hsl(var(--primary))" />
              <Bar yAxisId="right" dataKey="valor" name="Valor (R$)" fill="hsl(var(--muted-foreground))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(r.data_fechamento + "T00:00:00"), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {r.conta_nome ? (
                    <Link to={`/crm/contas/${r.conta_id}`} className="text-primary hover:underline">
                      {r.conta_nome}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {r.imovel_codigo || r.imovel_titulo
                    ? [r.imovel_codigo, r.imovel_titulo].filter(Boolean).join(" · ")
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {r.valor != null ? formatBRL(Number(r.valor)) : "—"}
                </TableCell>
                <TableCell className="text-sm">{r.responsavel_nome ?? "—"}</TableCell>
                <TableCell className="text-sm max-w-xs truncate" title={r.observacoes ?? ""}>
                  {r.observacoes ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhum registro no período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
