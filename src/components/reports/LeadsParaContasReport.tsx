import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, subMonths, endOfMonth, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Mode = "mensal" | "custom";
type Bucket = { key: string; label: string; leads: number; contas: number };

export default function LeadsParaContasReport() {
  const [mode, setMode] = useState<Mode>("mensal");
  const [from, setFrom] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [to, setTo] = useState<Date>(() => endOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<{ created_at: string }[]>([]);
  const [contas, setContas] = useState<{ created_at: string }[]>([]);

  const range = useMemo(() => {
    if (mode === "mensal") {
      return {
        start: startOfMonth(subMonths(new Date(), 11)),
        end: endOfDay(new Date()),
      };
    }
    return { start: startOfDay(from), end: endOfDay(to) };
  }, [mode, from, to]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase
          .from("leads")
          .select("created_at")
          .gte("created_at", range.start.toISOString())
          .lte("created_at", range.end.toISOString()),
        supabase
          .from("contas" as any)
          .select("created_at,lead_id_origem")
          .not("lead_id_origem", "is", null)
          .gte("created_at", range.start.toISOString())
          .lte("created_at", range.end.toISOString()),
      ]);
      if (cancel) return;
      setLeads((l ?? []) as any);
      setContas((c ?? []) as any);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [range.start, range.end]);

  const granularity: "day" | "month" = useMemo(() => {
    if (mode === "mensal") return "month";
    return differenceInDays(range.end, range.start) > 90 ? "month" : "day";
  }, [mode, range.start, range.end]);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    const keyFor = (d: Date) =>
      granularity === "month" ? format(d, "yyyy-MM") : format(d, "yyyy-MM-dd");
    const labelFor = (d: Date) =>
      granularity === "month"
        ? format(d, "MMM/yy", { locale: ptBR })
        : format(d, "dd/MM", { locale: ptBR });

    // Pre-fill buckets so empty periods aparecem no gráfico
    if (granularity === "month") {
      let cur = startOfMonth(range.start);
      const end = startOfMonth(range.end);
      while (cur <= end) {
        const k = keyFor(cur);
        map.set(k, { key: k, label: labelFor(cur), leads: 0, contas: 0 });
        cur = startOfMonth(subMonths(cur, -1));
      }
    } else {
      const d = new Date(range.start);
      while (d <= range.end) {
        const k = keyFor(d);
        map.set(k, { key: k, label: labelFor(d), leads: 0, contas: 0 });
        d.setDate(d.getDate() + 1);
      }
    }

    for (const row of leads) {
      const d = new Date(row.created_at);
      const k = keyFor(d);
      const b = map.get(k);
      if (b) b.leads++;
    }
    for (const row of contas) {
      const d = new Date(row.created_at);
      const k = keyFor(d);
      const b = map.get(k);
      if (b) b.contas++;
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [leads, contas, granularity, range.start, range.end]);

  const totals = useMemo(() => {
    const tl = leads.length;
    const tc = contas.length;
    return { leads: tl, contas: tc, taxa: tl > 0 ? (tc / tl) * 100 : 0 };
  }, [leads, contas]);

  const chartData = useMemo(
    () =>
      buckets.map((b) => ({
        ...b,
        taxa: b.leads > 0 ? Number(((b.contas / b.leads) * 100).toFixed(1)) : 0,
      })),
    [buckets],
  );

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="font-semibold">Leads → Contas</h2>
          <p className="text-sm text-muted-foreground">
            Quantos leads viraram conta (origem do lead preenchida) ao longo do tempo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="mensal">Últimos 12 meses</TabsTrigger>
              <TabsTrigger value="custom">Customizado</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "custom" && (
            <div className="flex items-center gap-2">
              <DateBtn label="Início" date={from} onChange={setFrom} />
              <span className="text-muted-foreground text-sm">até</span>
              <DateBtn label="Fim" date={to} onChange={setTo} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi label="Leads no período" value={totals.leads} />
        <Kpi label="Contas geradas de lead" value={totals.contas} />
        <Kpi label="Taxa de conversão" value={`${totals.taxa.toFixed(1)}%`} />
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Carregando…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === "Conversão" ? `${value}%` : value
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="leads" name="Leads" fill="hsl(var(--primary))" />
              <Bar yAxisId="left" dataKey="contas" name="Contas" fill="hsl(var(--success))" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxa"
                name="Conversão"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Contas</TableHead>
              <TableHead className="text-right">Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map((b) => (
              <TableRow key={b.key}>
                <TableCell className="font-medium whitespace-nowrap">{b.label}</TableCell>
                <TableCell className="text-right">{b.leads}</TableCell>
                <TableCell className="text-right">{b.contas}</TableCell>
                <TableCell className="text-right font-semibold">{b.taxa.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DateBtn({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("justify-start text-left font-normal gap-2")}
        >
          <CalendarIcon className="h-4 w-4" />
          {format(date, "dd/MM/yyyy", { locale: ptBR })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
