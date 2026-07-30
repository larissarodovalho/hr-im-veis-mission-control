import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, BarChart3, Shield, Info, CalendarRange } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Papa from "papaparse";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import FunilContasReport from "@/components/reports/FunilContasReport";
import FunilLeadsReport from "@/components/reports/FunilLeadsReport";
import LeadsParaContasReport from "@/components/reports/LeadsParaContasReport";
import FaturamentoReport from "@/components/reports/FaturamentoReport";
import ImoveisReport from "@/components/reports/ImoveisReport";
import FechamentosReport from "@/components/reports/FechamentosReport";
import PropostasReport from "@/components/reports/PropostasReport";
import OportunidadesReport from "@/components/reports/OportunidadesReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsPeriodProvider, useReportsPeriod, MESES_LABELS } from "@/hooks/useReportsPeriod";

function PeriodPicker() {
  const { ano, mes, setAno, setMes, anos, label } = useReportsPeriod();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4" />
        <span>Período: <span className="font-medium text-foreground">{label}</span></span>
      </div>
      <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
        <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {anos.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={mes == null ? "todos" : String(mes)} onValueChange={(v) => setMes(v === "todos" ? null : Number(v))}>
        <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Ano inteiro</SelectItem>
          {MESES_LABELS.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReportsInner() {
  const { isAdmin, isGestor, loading: roleLoading } = useRole();
  const can = isAdmin || isGestor;
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (can) load(); /* eslint-disable-next-line */ }, [can, inicioISO, fimISO]);

  const load = async () => {
    setLoading(true);
    const inicioMs = Date.parse(inicioISO);
    const fimMs = Date.parse(fimISO);
    const [{ data: profiles }, { data: roles }, { data: leads }, { data: contas }, { data: opsGeradas }, { data: opsEncerradas }] = await Promise.all([
      supabase.from("profiles").select("user_id, nome"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("leads").select("corretor_id, created_at").gte("created_at", inicioISO).lte("created_at", fimISO),
      supabase.from("contas").select("responsavel_id, etapa_funil, created_at, updated_at").gte("updated_at", inicioISO).lte("updated_at", fimISO),
      supabase.from("oportunidades").select("corretor_id, created_at").gte("created_at", inicioISO).lte("created_at", fimISO),
      supabase.from("oportunidades").select("corretor_id, estagio, encerrada_em").in("estagio", ["ganha", "perdida"]).gte("encerrada_em", inicioISO).lte("encerrada_em", fimISO),
    ]);
    const corretorIds = new Set<string>(
      (roles ?? []).filter((r: any) => r.role === "corretor").map((r: any) => r.user_id)
    );
    const map = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => {
      if (!corretorIds.has(p.user_id)) return;
      map.set(p.user_id, { user_id: p.user_id, name: p.nome || "Sem nome", leads: 0, contas: 0, estabelecidos: 0, oportunidades: 0, ganhas: 0, encerradas: 0 });
    });
    (leads ?? []).forEach((l: any) => {
      if (!l.corretor_id) return;
      const s = map.get(l.corretor_id); if (!s) return;
      s.leads++;
    });
    (contas ?? []).forEach((c: any) => {
      if (!c.responsavel_id) return;
      const s = map.get(c.responsavel_id); if (!s) return;
      const createdMs = c.created_at ? Date.parse(c.created_at) : null;
      if (createdMs != null && createdMs >= inicioMs && createdMs <= fimMs) s.contas++;
      if (c.etapa_funil === "contato_estabelecido") s.estabelecidos++;
    });
    (opsGeradas ?? []).forEach((o: any) => {
      if (!o.corretor_id) return;
      const s = map.get(o.corretor_id); if (s) s.oportunidades++;
    });
    (opsEncerradas ?? []).forEach((o: any) => {
      if (!o.corretor_id) return;
      const s = map.get(o.corretor_id); if (!s) return;
      s.encerradas++;
      if (o.estagio === "ganha") s.ganhas++;
    });
    setStats([...map.values()].sort((a, b) => b.leads - a.leads));
    setLoading(false);
  };

  if (roleLoading) return <div className="p-4 md:p-8 text-muted-foreground">Carregando…</div>;
  if (!can) return <div className="p-4 md:p-8"><Card className="p-6 text-center"><Shield className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><p>Apenas administradores acessam relatórios.</p></Card></div>;

  const exportLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*").gte("created_at", inicioISO).lte("created_at", fimISO);
    if (error) return toast.error(error.message);
    const csv = Papa.unparse(data ?? []);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${label}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data?.length ?? 0} leads exportados`);
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Todos os relatórios filtrados pelo período selecionado.</p>
        </div>
        <PeriodPicker />
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="fechamentos">Negócios fechados</TabsTrigger>
          <TabsTrigger value="propostas">Propostas</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4 md:space-y-6 mt-4">
          <FunilLeadsReport />
          <LeadsParaContasReport />
        </TabsContent>

        <TabsContent value="oportunidades" className="mt-4">
          <OportunidadesReport inicioISO={inicioISO} fimISO={fimISO} />
        </TabsContent>

        <TabsContent value="fechamentos" className="mt-4">
          <FechamentosReport />
        </TabsContent>

        <TabsContent value="propostas" className="mt-4">
          <PropostasReport />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 md:space-y-6 mt-4">
          <FunilContasReport />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 md:p-6">
              <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Exportar leads ({label})</h3>
              <p className="text-sm text-muted-foreground mb-4">Baixe a base do período em CSV.</p>
              <Button onClick={exportLeads} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-2" /> Baixar leads.csv</Button>
            </Card>
            <Card className="p-4 md:p-6">
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Performance da equipe</h3>
              <p className="text-sm text-muted-foreground mb-4">Resumo por corretor no período.</p>
            </Card>
          </div>

          <Card className="p-4 md:p-6">
            <h2 className="font-semibold mb-4">Performance por corretor — {label}</h2>
            {loading ? <p className="text-muted-foreground">Carregando…</p> : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Corretor</TableHead><TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Contas criadas</TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Contatos estabelecidos <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Contas do corretor que estão na etapa "Contato estabelecido" (com movimentação no período, considerando Carteira e Marketing).</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Oportunidades <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Oportunidades de negócio geradas pelo corretor no período (via qualificação do Contato estabelecido).</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                    <TableHead className="text-right">Ganhas</TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Taxa de ganho <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Taxa = Oportunidades ganhas ÷ oportunidades encerradas (ganhas + perdidas) no período × 100.</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {stats.map(s => (
                      <TableRow key={s.user_id}>
                        <TableCell className="font-medium whitespace-nowrap">{s.name}</TableCell>
                        <TableCell className="text-right">{s.leads}</TableCell>
                        <TableCell className="text-right">{s.contas}</TableCell>
                        <TableCell className="text-right">{s.estabelecidos}</TableCell>
                        <TableCell className="text-right">{s.oportunidades}</TableCell>
                        <TableCell className="text-right">{s.ganhas}</TableCell>
                        <TableCell className="text-right font-semibold">{s.encerradas ? ((s.ganhas / s.encerradas) * 100).toFixed(1) : "0.0"}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>


        <TabsContent value="imoveis" className="mt-4">
          <ImoveisReport />
        </TabsContent>

        <TabsContent value="faturamento" className="mt-4">
          <FaturamentoReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Reports() {
  return (
    <ReportsPeriodProvider>
      <ReportsInner />
    </ReportsPeriodProvider>
  );
}
