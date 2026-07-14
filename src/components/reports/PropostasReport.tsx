import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { Link } from "react-router-dom";
import { useReportsPeriod } from "@/hooks/useReportsPeriod";

type Row = {
  id: string;
  conta_id: string;
  data_proposta: string;
  valor: number | null;
  status: string;
  descricao: string | null;
  corretor_id: string | null;
  created_by: string | null;
  imovel_id: string | null;
  conta_nome?: string | null;
  responsavel_nome?: string | null;
  responsavel_id?: string | null;
  imovel_codigo?: string | null;
  imovel_titulo?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aceita: "Aceita",
  recusada: "Recusada",
};

const STATUS_COLOR: Record<string, string> = {
  aceita: "hsl(142 76% 36%)",
  recusada: "hsl(0 72% 51%)",
  pendente: "hsl(45 93% 47%)",
};

export default function PropostasReport() {
  const { inicio, fim, label: periodoLabel } = useReportsPeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [responsaveis, setResponsaveis] = useState<{ user_id: string; nome: string }[]>([]);
  const [responsavelId, setResponsavelId] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: profs }] = await Promise.all([
      supabase
        .from("conta_propostas" as any)
        .select("id, conta_id, data_proposta, valor, status, descricao, corretor_id, created_by")
        .gte("data_proposta", inicio)
        .lte("data_proposta", fim)
        .order("data_proposta", { ascending: false }),
      supabase.from("profiles").select("user_id, nome"),
    ]);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data as any as Row[]) ?? [];
    const contaIds = Array.from(new Set(list.map((r) => r.conta_id).filter(Boolean)));
    const { data: contas } = contaIds.length
      ? await supabase.from("contas").select("id, nome, responsavel_id").in("id", contaIds)
      : { data: [] as any[] };
    const cMap = new Map((contas ?? []).map((c: any) => [c.id, c]));
    const pMap = new Map((profs ?? []).map((p: any) => [p.user_id, p.nome]));

    const enriched: Row[] = list.map((r) => {
      const c = cMap.get(r.conta_id) as any;
      const respId = r.corretor_id ?? c?.responsavel_id ?? null;
      return {
        ...r,
        conta_nome: c?.nome ?? null,
        responsavel_id: respId,
        responsavel_nome: respId ? pMap.get(respId) ?? null : null,
      };
    });

    const respSet = new Map<string, string>();
    enriched.forEach((r) => {
      if (r.responsavel_id) respSet.set(r.responsavel_id, r.responsavel_nome ?? "Sem nome");
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
    () =>
      rows
        .filter((r) => responsavelId === "todos" || r.responsavel_id === responsavelId)
        .filter((r) => statusFilter === "todos" || r.status === statusFilter),
    [rows, responsavelId, statusFilter],
  );

  const totals = useMemo(() => {
    const t = { total: filtered.length, aceita: 0, recusada: 0, pendente: 0, valorTotal: 0, valorAceito: 0 };
    filtered.forEach((r) => {
      const v = Number(r.valor) || 0;
      t.valorTotal += v;
      if (r.status === "aceita") { t.aceita++; t.valorAceito += v; }
      else if (r.status === "recusada") t.recusada++;
      else t.pendente++;
    });
    return t;
  }, [filtered]);

  const taxaAceite = totals.total ? (totals.aceita / totals.total) * 100 : 0;
  const taxaRecusa = totals.total ? (totals.recusada / totals.total) * 100 : 0;

  const porMes = useMemo(() => {
    const map = new Map<string, { key: string; label: string; aceita: number; recusada: number; pendente: number }>();
    filtered.forEach((r) => {
      const d = new Date(r.data_proposta + "T00:00:00");
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM/yy", { locale: ptBR });
      const cur = map.get(key) ?? { key, label, aceita: 0, recusada: 0, pendente: 0 };
      if (r.status === "aceita") cur.aceita++;
      else if (r.status === "recusada") cur.recusada++;
      else cur.pendente++;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const porResponsavel = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; aceita: number; recusada: number; pendente: number; valor: number }>();
    filtered.forEach((r) => {
      const key = r.responsavel_id ?? "sem";
      const nome = r.responsavel_nome ?? "Sem responsável";
      const cur = map.get(key) ?? { nome, total: 0, aceita: 0, recusada: 0, pendente: 0, valor: 0 };
      cur.total++;
      cur.valor += Number(r.valor) || 0;
      if (r.status === "aceita") cur.aceita++;
      else if (r.status === "recusada") cur.recusada++;
      else cur.pendente++;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filtered]);

  const porStatus = [
    { name: "Aceitas", value: totals.aceita, key: "aceita" },
    { name: "Recusadas", value: totals.recusada, key: "recusada" },
    { name: "Pendentes", value: totals.pendente, key: "pendente" },
  ].filter((s) => s.value > 0);

  const filenameStamp = () => periodoLabel.replace("/", "-");

  const exportCSV = () => {
    const data = filtered.map((r) => ({
      Data: r.data_proposta,
      Cliente: r.conta_nome ?? "",
      Responsável: r.responsavel_nome ?? "",
      Status: STATUS_LABEL[r.status] ?? r.status,
      "Valor (R$)": r.valor ?? "",
      Descrição: r.descricao ?? "",
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `propostas-${filenameStamp()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} propostas exportadas`);
  };

  const exportXLSX = () => {
    const resumo = [
      { Métrica: "Total de propostas", Valor: totals.total },
      { Métrica: "Aceitas", Valor: totals.aceita },
      { Métrica: "Recusadas", Valor: totals.recusada },
      { Métrica: "Pendentes", Valor: totals.pendente },
      { Métrica: "Taxa de aceite (%)", Valor: Number(taxaAceite.toFixed(1)) },
      { Métrica: "Valor total proposto (R$)", Valor: totals.valorTotal },
      { Métrica: "Valor aceito (R$)", Valor: totals.valorAceito },
    ];
    const porMesData = porMes.map((m) => ({
      Mês: m.label,
      Aceitas: m.aceita,
      Recusadas: m.recusada,
      Pendentes: m.pendente,
      Total: m.aceita + m.recusada + m.pendente,
    }));
    const porRespData = porResponsavel.map((r) => ({
      Responsável: r.nome,
      Total: r.total,
      Aceitas: r.aceita,
      Recusadas: r.recusada,
      Pendentes: r.pendente,
      "Taxa aceite (%)": r.total ? Number(((r.aceita / r.total) * 100).toFixed(1)) : 0,
      "Valor total (R$)": r.valor,
    }));
    const detalhado = filtered.map((r) => ({
      Data: r.data_proposta,
      Cliente: r.conta_nome ?? "",
      Responsável: r.responsavel_nome ?? "",
      Status: STATUS_LABEL[r.status] ?? r.status,
      "Valor (R$)": Number(r.valor) || 0,
      Descrição: r.descricao ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), "Resumo");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porMesData), "Por mês");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porRespData), "Por corretor");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalhado), "Detalhado");
    XLSX.writeFile(wb, `propostas-${filenameStamp()}.xlsx`);
    toast.success("Excel gerado");
  };

  const statusBadge = (s: string) => {
    const variant = s === "aceita" ? "default" : s === "recusada" ? "destructive" : "secondary";
    return <Badge variant={variant as any}>{STATUS_LABEL[s] ?? s}</Badge>;
  };

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Propostas · {periodoLabel}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" onClick={exportXLSX} disabled={!filtered.length}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel (.xlsx)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Responsável</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
          >
            <option value="todos">Todos</option>
            {responsaveis.map((r) => (
              <option key={r.user_id} value={r.user_id}>{r.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="aceita">Aceitas</option>
            <option value="recusada">Recusadas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{totals.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Aceitas</p>
          <p className="text-2xl font-semibold text-green-600">{totals.aceita}</p>
          <p className="text-xs text-muted-foreground">{taxaAceite.toFixed(1)}% de aceite</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Recusadas</p>
          <p className="text-2xl font-semibold text-red-600">{totals.recusada}</p>
          <p className="text-xs text-muted-foreground">{taxaRecusa.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-semibold text-amber-600">{totals.pendente}</p>
        </Card>
        <Card className="p-4 col-span-2 md:col-span-2">
          <p className="text-xs text-muted-foreground">Valor total proposto</p>
          <p className="text-2xl font-semibold">{formatBRL(totals.valorTotal)}</p>
        </Card>
        <Card className="p-4 col-span-2 md:col-span-2">
          <p className="text-xs text-muted-foreground">Valor aceito</p>
          <p className="text-2xl font-semibold text-primary">{formatBRL(totals.valorAceito)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <p className="text-sm font-medium mb-2">Propostas por mês</p>
          <div className="h-64">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : porMes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RTooltip />
                  <Legend />
                  <Bar dataKey="aceita" name="Aceitas" stackId="a" fill={STATUS_COLOR.aceita} />
                  <Bar dataKey="pendente" name="Pendentes" stackId="a" fill={STATUS_COLOR.pendente} />
                  <Bar dataKey="recusada" name="Recusadas" stackId="a" fill={STATUS_COLOR.recusada} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Distribuição por status</p>
          <div className="h-64">
            {porStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={porStatus} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} label>
                    {porStatus.map((s) => (
                      <Cell key={s.key} fill={STATUS_COLOR[s.key]} />
                    ))}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-sm font-medium mb-2">Propostas por corretor</p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Aceitas</TableHead>
                <TableHead className="text-right">Recusadas</TableHead>
                <TableHead className="text-right">Pendentes</TableHead>
                <TableHead className="text-right">Taxa aceite</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porResponsavel.map((r) => (
                <TableRow key={r.nome}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right text-green-600">{r.aceita}</TableCell>
                  <TableCell className="text-right text-red-600">{r.recusada}</TableCell>
                  <TableCell className="text-right text-amber-600">{r.pendente}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {r.total ? ((r.aceita / r.total) * 100).toFixed(1) : "0.0"}%
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(r.valor)}</TableCell>
                </TableRow>
              ))}
              {!porResponsavel.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    Sem propostas no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(r.data_proposta + "T00:00:00"), "dd/MM/yyyy")}
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
                <TableCell className="text-sm">{r.responsavel_nome ?? "—"}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-right font-medium">
                  {r.valor != null ? formatBRL(Number(r.valor)) : "—"}
                </TableCell>
                <TableCell className="text-sm max-w-xs truncate" title={r.descricao ?? ""}>
                  {r.descricao ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Nenhuma proposta no período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
