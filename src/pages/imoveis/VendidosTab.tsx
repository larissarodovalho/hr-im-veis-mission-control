import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import NovaVendaDialog from "@/components/imoveis/NovaVendaDialog";

import { formatBRL } from "@/lib/format";
const fmt = (n: number) => formatBRL(n, { dash: false });
const fmtShort = fmt;

type Periodo = "30" | "90" | "365" | "all";

const STATUS_COLORS: Record<string, string> = {
  "Pagamento pendente": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300",
  "Finalizada": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300",
};

const PIE = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function VendidosTab() {
  const { isAdmin, isGestor } = useRole();
  const canEdit = isAdmin || isGestor;
  const [vendas, setVendas] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<Record<string, any>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [periodo, setPeriodo] = useState<Periodo>("365");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const [vRes, iRes, pRes] = await Promise.all([
      supabase.from("vendas").select("*").order("data_venda", { ascending: false }),
      supabase.from("imoveis").select("id,codigo,titulo"),
      supabase.from("profiles").select("user_id,nome,avatar_url"),
    ]);
    setVendas(vRes.data ?? []);
    const im: Record<string, any> = {}; (iRes.data ?? []).forEach((i: any) => { im[i.id] = i; });
    setImoveis(im);
    const pm: Record<string, any> = {}; (pRes.data ?? []).forEach((p: any) => { pm[p.user_id] = p; });
    setProfiles(pm);
  };
  useEffect(() => { load(); }, []);

  const { atual, anterior } = useMemo(() => {
    const now = new Date();
    const dias = periodo === "all" ? 36500 : parseInt(periodo);
    const inicio = new Date(now.getTime() - dias * 86400000);
    const inicioAnt = new Date(inicio.getTime() - dias * 86400000);
    const a: any[] = []; const b: any[] = [];
    vendas.forEach((v) => {
      const d = new Date(v.data_venda);
      if (d >= inicio) a.push(v);
      else if (d >= inicioAnt) b.push(v);
    });
    return { atual: a, anterior: b };
  }, [vendas, periodo]);

  const totalAtual = atual.reduce((s, v) => s + Number(v.valor_venda || 0), 0);
  const totalAnt = anterior.reduce((s, v) => s + Number(v.valor_venda || 0), 0);
  const qtdAtual = atual.length;
  const qtdAnt = anterior.length;
  const ticketAtual = qtdAtual ? totalAtual / qtdAtual : 0;
  const ticketAnt = qtdAnt ? totalAnt / qtdAnt : 0;

  const variation = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;

  // sparkline buckets by week
  const sparkData = (arr: any[], field: "count" | "sum") => {
    const buckets: Record<string, number> = {};
    arr.forEach((v) => {
      const d = new Date(v.data_venda);
      const key = `${d.getFullYear()}-${Math.floor(d.getMonth() * 4 + d.getDate() / 7)}`;
      buckets[key] = (buckets[key] || 0) + (field === "count" ? 1 : Number(v.valor_venda || 0));
    });
    return Object.entries(buckets).sort().map(([, value]) => ({ value }));
  };

  const statusPie = useMemo(() => {
    const m: Record<string, number> = {};
    atual.forEach((v) => { m[v.status_pagamento] = (m[v.status_pagamento] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [atual]);




  const onDelete = async (v: any) => {
    if (!confirm(`Excluir venda de "${v.cliente_nome}"?`)) return;
    const { error } = await supabase.from("vendas").delete().eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Venda excluída");
    load();
  };

  const KPI = ({ title, value, sub, trend, color, children }: any) => (
    <Card className={`p-5 border-l-4 ${color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold mt-1 truncate">{value}</div>
          {sub && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend != null && (trend >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />)}
              <span className={trend != null ? (trend >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium") : ""}>
                {trend != null ? `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%` : ""}
              </span>
              <span>{sub}</span>
            </div>
          )}
        </div>
        <div className="w-24 h-14 shrink-0">{children}</div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setOpenDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Lançar venda
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Valor total das vendas"
          value={fmtShort(totalAtual)}
          sub="em relação ao período anterior"
          trend={variation(totalAtual, totalAnt)}
          color="border-l-blue-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData(atual, "sum")}>
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </KPI>
        <KPI
          title="Quantidade de vendas"
          value={`${qtdAtual} ${qtdAtual === 1 ? "Venda" : "Vendas"}`}
          sub="em relação ao período anterior"
          trend={variation(qtdAtual, qtdAnt)}
          color="border-l-violet-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusPie.length ? statusPie : [{ name: "—", value: 1 }]} dataKey="value" innerRadius={16} outerRadius={26}>
                {(statusPie.length ? statusPie : [{ name: "—", value: 1 }]).map((_, idx) => (
                  <Cell key={idx} fill={PIE[idx % PIE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </KPI>
        <KPI
          title="Ticket médio"
          value={fmtShort(ticketAtual)}
          sub="em relação ao período anterior"
          trend={variation(ticketAtual, ticketAnt)}
          color="border-l-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData(atual, "sum").map((d, i, arr) => ({ value: arr[i].value / Math.max(1, (atual.length / arr.length)) }))}>
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </KPI>
        <KPI title="Origem das vendas" value={origemPie.length ? `${origemPie.length} fontes` : "—"} color="border-l-teal-500">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={origemPie.length ? origemPie : [{ name: "—", value: 1 }]} dataKey="value" innerRadius={16} outerRadius={26}>
                {(origemPie.length ? origemPie : [{ name: "—", value: 1 }]).map((_, idx) => (
                  <Cell key={idx} fill={PIE[idx % PIE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </KPI>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Corretor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data da Venda</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {atual.length === 0 && (
              <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center text-muted-foreground py-12">
                Nenhuma venda registrada {periodo === "all" ? "" : "nesse período"}.{canEdit && " Clique em \"Lançar venda\" para começar."}
              </TableCell></TableRow>
            )}
            {atual.map((v) => {
              const imv = imoveis[v.imovel_id];
              const prof = profiles[v.corretor_id];
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-medium uppercase text-sm">{v.cliente_nome}</TableCell>
                  <TableCell className="font-mono text-sm">{imv?.codigo || "—"}</TableCell>
                  <TableCell className="text-right">{fmt(Number(v.valor_venda))}</TableCell>
                  <TableCell className="text-right">{fmt(Number(v.valor_comissao))}</TableCell>
                  <TableCell>
                    {prof ? (
                      <Avatar className="h-8 w-8" title={prof.nome}>
                        <AvatarImage src={prof.avatar_url} />
                        <AvatarFallback>{(prof.nome || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={STATUS_COLORS[v.status_pagamento]}>{v.status_pagamento}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{v.tipo}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(v.data_venda).toLocaleDateString("pt-BR")}, {new Date(v.data_venda).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(v); setOpenDialog(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(v)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <NovaVendaDialog
        open={openDialog}
        onOpenChange={(v) => { setOpenDialog(v); if (!v) setEditing(null); }}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}
