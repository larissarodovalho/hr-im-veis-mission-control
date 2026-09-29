import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, BarChart3, Shield, Info, CalendarRange, FileText } from "lucide-react";
import { calcularPerformance, gerarPdfPerformance, primeiraTarefaPorConta, LISTA_LABEL, type ListaPerformance, type PerformanceCorretor, type MetaVgvCorretor, type MetaInstitucionalVgv } from "@/lib/performancePdf";
import MetasVgvDialog from "@/components/reports/MetasVgvDialog";
import { dayKeyCRM } from "@/lib/datetime";
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
import CarteiraReport from "@/components/reports/CarteiraReport";
import AcompanhamentoCorretoresReport from "@/components/reports/AcompanhamentoCorretoresReport";
import LinksImoveisReport from "@/components/reports/LinksImoveisReport";
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
  const { inicioISO, fimISO, label, refreshKey, ano } = useReportsPeriod();
  const [stats, setStats] = useState<PerformanceCorretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState<ListaPerformance>("carteira");
  const [corretor, setCorretor] = useState<string>("todos");
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [base, setBase] = useState<any>(null);

  useEffect(() => { if (can) load(); /* eslint-disable-next-line */ }, [can, inicioISO, fimISO, refreshKey]);

  const paginar = async (q: (from: number, to: number) => any) => {
    const all: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await q(from, from + 999);
      if (error) break;
      all.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
    }
    return all;
  };

  const load = async () => {
    if (!refreshKey) setLoading(true);
    const [{ data: sbContas }, { data: sbOps }] = await Promise.all([
      supabase.from("contas").select("responsavel_id, standby_ate").not("standby_ate", "is", null),
      supabase.from("oportunidades").select("corretor_id, standby_ate").not("standby_ate", "is", null),
    ]);
    const standbys = [
      ...(sbContas ?? []).map((s: any) => ({ dono: s.responsavel_id, standby_ate: s.standby_ate })),
      ...(sbOps ?? []).map((s: any) => ({ dono: s.corretor_id, standby_ate: s.standby_ate })),
    ];
    const [{ data: profiles }, { data: roles }, leads, contas, tarefas, opsGeradas, opsEncerradas] = await Promise.all([
      supabase.from("profiles").select("user_id, nome"),
      supabase.from("user_roles").select("user_id, role"),
      paginar((a, b) => supabase.from("leads").select("corretor_id").gte("created_at", inicioISO).lte("created_at", fimISO).range(a, b)),
      paginar((a, b) => supabase.from("contas").select("id, etapa_funil, tags, categoria, responsavel_id").gte("created_at", inicioISO).lte("created_at", fimISO).range(a, b)),
      paginar((a, b) => supabase.from("tarefas").select("conta_id, prazo").not("conta_id", "is", null).not("prazo", "is", null).neq("status", "Concluída").order("prazo").range(a, b)),
      paginar((a, b) => supabase.from("oportunidades").select("corretor_id").gte("created_at", inicioISO).lte("created_at", fimISO).range(a, b)),
      paginar((a, b) => supabase.from("oportunidades").select("corretor_id, estagio").in("estagio", ["ganha", "perdida"]).gte("encerrada_em", inicioISO).lte("encerrada_em", fimISO).range(a, b)),
    ]);
    // Responsáveis com carteira (em toda a base, não só no período)
    const { data: resp } = await supabase.from("contas").select("responsavel_id").not("responsavel_id", "is", null).limit(5000);
    const comCarteira = new Set((resp ?? []).map((r: any) => r.responsavel_id));
    const rolesPor = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => rolesPor.set(r.user_id, [...(rolesPor.get(r.user_id) ?? []), r.role]));
    const elegiveis = (profiles ?? []).filter((p: any) => {
      const rs = rolesPor.get(p.user_id) ?? [];
      if (rs.includes("corretor")) return true;
      return (rs.includes("admin") || rs.includes("gestor")) && comCarteira.has(p.user_id);
    });
    setBase({ elegiveis, rolesPor, leads, contas, tarefaPorConta: primeiraTarefaPorConta(tarefas), opsGeradas, opsEncerradas, standbys });
    setLoading(false);
  };

  useEffect(() => {
    if (!base) return;
    const linhas = base.elegiveis.map((p: any) => {
      const rs: string[] = base.rolesPor.get(p.user_id) ?? [];
      const leadsDoCorretor = base.leads.filter((l: any) => l.corretor_id === p.user_id).length;
      return calcularPerformance({
        userId: p.user_id, nome: p.nome || "Sem nome", lista, contas: base.contas,
        tarefaPorConta: base.tarefaPorConta, opsGeradas: base.opsGeradas, opsEncerradas: base.opsEncerradas,
        standbys: base.standbys, leads: base.leads, temLeads: leadsDoCorretor > 0 || rs.some((r) => ["admin", "gestor", "marketing"].includes(r)),
      });
    }).sort((a: PerformanceCorretor, b: PerformanceCorretor) => b.total - a.total);
    setStats(linhas);
  }, [base, lista]);

  const statsVisiveis = corretor === "todos" ? stats : stats.filter((s) => s.user_id === corretor);

  const carregarMetasVgv = async (): Promise<{ metasVgv: Record<string, MetaVgvCorretor>; metaHrx: MetaInstitucionalVgv }> => {
    const [{ data: metas }, { data: institucional }, { data: vendas }] = await Promise.all([
      supabase.from("metas_vgv").select("corretor_id, meta_vgv").eq("ano", ano),
      supabase.from("metas_institucionais").select("meta_vgv").eq("entidade", "hrx_producoes").eq("ano", ano).maybeSingle(),
      supabase.from("vendas").select("data_venda, valor_venda, corretor_vendedor_id, origem_negocio").gte("data_venda", `${ano - 1}-12-31`).lte("data_venda", `${ano + 1}-01-01T23:59:59`),
    ]);
    const out: Record<string, MetaVgvCorretor> = {};
    const hrx: MetaInstitucionalVgv = { ano, meta: Number(institucional?.meta_vgv) || 0, mensal: Array(12).fill(0) };
    stats.forEach((s) => { out[s.user_id] = { ano, meta: 0, mensal: Array(12).fill(0) }; });
    (metas ?? []).forEach((m: any) => { if (out[m.corretor_id]) out[m.corretor_id].meta = Number(m.meta_vgv) || 0; });
    (vendas ?? []).forEach((v: any) => {
      if (!v.data_venda) return;
      const dia = String(v.data_venda).length <= 10 ? String(v.data_venda) : dayKeyCRM(v.data_venda);
      if (Number(dia.slice(0, 4)) !== ano) return;
      const mesVenda = Number(dia.slice(5, 7)) - 1;
      const valor = Number(v.valor_venda) || 0;
      const o = out[v.corretor_vendedor_id];
      if (o) o.mensal[mesVenda] += valor;
      if (v.origem_negocio === "base_hrx") hrx.mensal[mesVenda] += valor;
    });
    return { metasVgv: out, metaHrx: hrx };
  };

  const gerarPdf = async (todos: boolean) => {
    const alvo = todos ? stats : statsVisiveis;
    if (!alvo.length) return toast.error("Nenhum corretor para o relatório.");
    setGerandoPdf(true);
    try {
      const { metasVgv, metaHrx } = await carregarMetasVgv();
      await gerarPdfPerformance({ corretores: alvo, periodo: label, lista, metasVgv, metaHrx: todos ? metaHrx : undefined });
      toast.success("PDF gerado");
    }
    catch (e: any) { toast.error("Erro ao gerar PDF: " + (e?.message ?? e)); }
    finally { setGerandoPdf(false); }
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
          <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="fechamentos">Negócios fechados</TabsTrigger>
          <TabsTrigger value="propostas">Propostas</TabsTrigger>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
          <TabsTrigger value="links">Links dos imóveis</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        </TabsList>

        <TabsContent value="acompanhamento" className="mt-4">
          <AcompanhamentoCorretoresReport />
        </TabsContent>

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

        <TabsContent value="carteira" className="mt-4">
          <CarteiraReport />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 md:space-y-6 mt-4">
          <FunilContasReport lista={lista} onListaChange={setLista} corretor={corretor} onCorretorChange={setCorretor}
            corretoresPermitidos={stats.map((s) => s.user_id)} refreshKey={refreshKey} />

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold">Performance por corretor — {label} · {LISTA_LABEL[lista]}</h2>
              <div className="flex flex-wrap gap-2">
                {isAdmin && <MetasVgvDialog corretores={stats.filter((s) => s.nome.trim().toLocaleLowerCase("pt-BR") !== "larissa rodovalho").map((s) => ({ user_id: s.user_id, nome: s.nome }))} anoInicial={ano} />}
                <Button size="sm" disabled={corretor === "todos" || gerandoPdf || loading} onClick={() => gerarPdf(false)}>
                  <FileText className="h-4 w-4 mr-1" /> Gerar PDF do corretor
                </Button>
                <Button size="sm" variant="outline" disabled={gerandoPdf || loading} onClick={() => gerarPdf(true)}>
                  <FileText className="h-4 w-4 mr-1" /> PDF de todos
                </Button>
              </div>
            </div>
            {corretor === "todos" && <p className="text-xs text-muted-foreground mb-3">Selecione um corretor no filtro do funil acima para gerar o relatório individual.</p>}
            {loading ? <p className="text-muted-foreground">Carregando…</p> : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Corretor</TableHead><TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Contas</TableHead>
                    <TableHead className="text-right">Tarefas atrasadas</TableHead>
                    <TableHead className="text-right" title="Contas e oportunidades do corretor em standby agora (vencidos entre parênteses)">Em standby</TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Contatos estabelecidos <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Contas criadas no período, do corretor, que estão na etapa "Contato estabelecido" — mesmo critério do funil acima e da lista selecionada.</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Oportunidades <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Oportunidades de negócio geradas pelo corretor no período (via qualificação do Contato estabelecido).</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                    <TableHead className="text-right">Ganhas</TableHead>
                    <TableHead className="text-right"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="inline-flex items-center gap-1 cursor-help">Taxa de ganho <Info className="h-3 w-3 text-muted-foreground" /></span></TooltipTrigger><TooltipContent className="max-w-xs"><p>Taxa = Oportunidades ganhas ÷ oportunidades encerradas (ganhas + perdidas) no período × 100.</p></TooltipContent></Tooltip></TooltipProvider></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {statsVisiveis.map(s => (
                      <TableRow key={s.user_id}>
                        <TableCell className="font-medium whitespace-nowrap">{s.nome}</TableCell>
                        <TableCell className="text-right">{s.temLeads ? s.leads : "—"}</TableCell>
                        <TableCell className="text-right">{s.total}</TableCell>
                        <TableCell className="text-right">{s.atrasada}</TableCell>
                        <TableCell className="text-right">{s.emStandby}{s.standbyVencido ? <span className="text-destructive"> ({s.standbyVencido} venc.)</span> : null}</TableCell>
                        <TableCell className="text-right">{s.estabelecidos}</TableCell>
                        <TableCell className="text-right">{s.oportunidades}</TableCell>
                        <TableCell className="text-right">{s.ganhas}</TableCell>
                        <TableCell className="text-right font-semibold">{s.taxaGanho == null ? "—" : `${s.taxaGanho.toFixed(1)}%`}</TableCell>
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

        <TabsContent value="links" className="mt-4">
          <LinksImoveisReport />
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
