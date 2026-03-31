// corretorId prop (future auth): quando cada corretor logar, passar corretorId para filtrar
// apenas os dados do corretor autenticado. Ex: <CRM corretorId="hans" />
// const corretorId: string | undefined = undefined;

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { leads, imoveis, corretoresRanking, funnelPorCorretor, contas, oportunidades } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDown, ChevronUp, Phone, DollarSign, Users, Trophy, TrendingUp, Building2, ClipboardList } from "lucide-react";

type Periodo = "Tudo" | "Este mês" | "Mês anterior" | "Este ano";

const FILLS = { Hans: "hsl(224, 73%, 45%)", Rafael: "hsl(160, 60%, 42%)", Gabriel: "hsl(43, 76%, 48%)" };
const CORRETORES = ["Hans", "Rafael", "Gabriel"] as const;

function filtrarPorData<T extends { dataCreacao: string }>(items: T[], periodo: Periodo): T[] {
  if (periodo === "Tudo") return items;
  const agora = new Date();
  return items.filter((item) => {
    const d = new Date(item.dataCreacao);
    if (periodo === "Este mês") return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    if (periodo === "Mês anterior") {
      const mes = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
      const ano = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
      return d.getMonth() === mes && d.getFullYear() === ano;
    }
    if (periodo === "Este ano") return d.getFullYear() === agora.getFullYear();
    return true;
  });
}

function porCorretor<T extends { corretor: string }>(items: T[]) {
  return CORRETORES.map((nome) => ({ nome, quantidade: items.filter((i) => i.corretor === nome).length, fill: FILLS[nome] }));
}

const PeriodoSelect = ({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) => (
  <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
    <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
    <SelectContent>
      {(["Tudo", "Este mês", "Mês anterior", "Este ano"] as Periodo[]).map((p) => (
        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function CRM() {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [visaoCC, setVisaoCC] = useState<"geral" | "corretor">("geral");
  const [corretorSelecionado, setCorretorSelecionado] = useState<typeof CORRETORES[number]>("Hans");
  const [periodoLeads, setPeriodoLeads]   = useState<Periodo>("Tudo");
  const [periodoContas, setPeriodoContas] = useState<Periodo>("Tudo");
  const [periodoOps, setPeriodoOps]       = useState<Periodo>("Tudo");

  const leadsF  = useMemo(() => filtrarPorData(leads,         periodoLeads),  [periodoLeads]);
  const contasF = useMemo(() => filtrarPorData(contas,        periodoContas), [periodoContas]);
  const opsF    = useMemo(() => filtrarPorData(oportunidades, periodoOps),    [periodoOps]);

  const leadsPorCorretor  = useMemo(() => porCorretor(leadsF),  [leadsF]);
  const contasPorCorretor = useMemo(() => porCorretor(contasF), [contasF]);
  const opsPorCorretor    = useMemo(() => porCorretor(opsF),    [opsF]);

  const totalEmNegociacao = imoveis
    .filter((i) => i.status === "Em negociação")
    .reduce((acc, i) => acc + i.valor, 0);

  const visitasAgendadas = leads.filter((l) => l.etapa === "Visita agendada").length;
  const visitasRealizadas = leads.filter((l) => l.etapa === "Visita realizada").length;
  const taxaComparecimento =
    visitasAgendadas > 0
      ? (((visitasRealizadas) / (visitasAgendadas + visitasRealizadas)) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-6">
      <h2 className="section-title">CRM — Comercial</h2>

      <Tabs defaultValue="funil">
        <TabsList className="h-8 bg-muted/50 rounded-md p-0.5 gap-0.5 mb-2">
          <TabsTrigger value="funil" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" /> Funil de Vendas
          </TabsTrigger>
          <TabsTrigger value="criacao" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="h-3.5 w-3.5" /> Controle de Criação
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: Funil de Vendas ── */}
        <TabsContent value="funil" className="space-y-6">

      {/* Funil por Corretor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil por Corretor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hans">
            <TabsList className="mb-4">
              <TabsTrigger value="hans">Hans Rodovalho</TabsTrigger>
              <TabsTrigger value="rafael">Rafael Filimberti</TabsTrigger>
              <TabsTrigger value="gabriel">Gabriel Souza</TabsTrigger>
            </TabsList>

            {funnelPorCorretor.map((fc) => (
              <TabsContent key={fc.corretorId} value={fc.corretorId} className="space-y-4">
                {/* Stats do corretor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Total de Leads</span>
                    </div>
                    <p className="text-xl font-bold font-display">{fc.stats.totalLeads}</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Taxa de Conversão</span>
                    </div>
                    <p className="text-xl font-bold font-display">{fc.stats.taxaConversao}%</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gold" />
                      <span className="text-xs text-muted-foreground">Pipeline em Negociação</span>
                    </div>
                    <p className="text-xl font-bold font-display">
                      R$ {fc.stats.pipelineEmNegociacao.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Dois funis lado a lado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Carteira */}
                  <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      Carteira
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={fc.carteira} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="etapa" fontSize={10} width={115} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {fc.carteira.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Marketing */}
                  <div>
                    <p className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Marketing
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={fc.marketing} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="etapa" fontSize={10} width={115} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {fc.marketing.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Pipeline + Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">Pipeline em Negociação</span>
          </div>
          <p className="text-xl font-bold font-display">R$ {totalEmNegociacao.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Visitas Agendadas / Realizadas</span>
          </div>
          <p className="text-xl font-bold font-display">
            {visitasAgendadas + visitasRealizadas} agendadas · {visitasRealizadas} realizadas
          </p>
          <p className="text-xs text-muted-foreground">Taxa de comparecimento: {taxaComparecimento}%</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">Ranking Corretores</span>
          </div>
          {corretoresRanking.map((c) => (
            <div key={c.nome} className="flex justify-between text-sm mt-1">
              <span className="font-medium">{c.nome}</span>
              <span className="text-muted-foreground">
                {c.atendimentos} atend · {c.visitas} vis · {c.propostas} prop
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-3 font-medium">Canal</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Origem</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                  <th className="text-left p-3 font-medium">Etapa</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Entrada</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <>
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <td className="p-3 font-medium">{lead.nome}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.telefone}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={lead.canal === "Meta Ads" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {lead.canal}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            lead.origem === "Carteira"
                              ? "border-blue-500 text-blue-600 dark:text-blue-400"
                              : "border-amber-500 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {lead.origem}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">{lead.corretor}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {lead.etapa}
                        </Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">
                        {lead.dataEntrada}
                      </td>
                      <td className="p-3">
                        {expandedLead === lead.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-hist`}>
                        <td colSpan={8} className="p-4 bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Histórico — Sofia IA
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lead.historico.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex ${
                                  msg.remetente === "Sofia" ? "justify-start" : "justify-end"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                                    msg.remetente === "Sofia"
                                      ? "bg-primary/10 text-foreground"
                                      : "bg-accent/20 text-foreground"
                                  }`}
                                >
                                  <p className="font-medium text-[10px] text-muted-foreground mb-0.5">
                                    {msg.remetente} · {msg.data}
                                  </p>
                                  <p>{msg.mensagem}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Imóveis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imóveis Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Imóvel</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-left p-3 font-medium">Valor</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                </tr>
              </thead>
              <tbody>
                {imoveis.map((imovel) => (
                  <tr key={imovel.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{imovel.nome}</td>
                    <td className="p-3 hidden sm:table-cell">{imovel.tipo}</td>
                    <td className="p-3">R$ {imovel.valor.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          imovel.status === "Vendido"
                            ? "default"
                            : imovel.status === "Em negociação"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {imovel.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">{imovel.corretor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* ── ABA: Controle de Criação ── */}
        <TabsContent value="criacao" className="space-y-4">

          {/* Toggle Geral / Por Corretor */}
          <div className="flex items-center gap-3">
            <Tabs value={visaoCC} onValueChange={(v) => setVisaoCC(v as "geral" | "corretor")}>
              <TabsList className="h-8 bg-muted/50 rounded-md p-0.5">
                <TabsTrigger value="geral" className="h-7 text-xs px-3 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Geral
                </TabsTrigger>
                <TabsTrigger value="corretor" className="h-7 text-xs px-3 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Por Corretor
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {visaoCC === "corretor" && (
              <Select value={corretorSelecionado} onValueChange={(v) => setCorretorSelecionado(v as typeof CORRETORES[number])}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CORRETORES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Leads */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Leads</CardTitle>
                </div>
                <PeriodoSelect value={periodoLeads} onChange={setPeriodoLeads} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-primary mb-4">{leadsF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={leadsPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {leadsPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-primary mb-1">
                      {leadsF.filter((l) => l.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Lead recebido","Qualificado","Visita agendada","Visita realizada","Proposta","Fechamento"] as const).map((etapa) => {
                        const count = leadsF.filter((l) => l.corretor === corretorSelecionado && l.etapa === etapa).length;
                        return (
                          <div key={etapa} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{etapa}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contas */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Contas</CardTitle>
                </div>
                <PeriodoSelect value={periodoContas} onChange={setPeriodoContas} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-green-500 mb-4">{contasF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={contasPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Contas"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {contasPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-green-500 mb-1">
                      {contasF.filter((c) => c.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Pessoa Física","Pessoa Jurídica"] as const).map((tipo) => {
                        const count = contasF.filter((c) => c.corretor === corretorSelecionado && c.tipo === tipo).length;
                        return (
                          <div key={tipo} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{tipo}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">Oportunidades</CardTitle>
                </div>
                <PeriodoSelect value={periodoOps} onChange={setPeriodoOps} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-amber-500 mb-4">{opsF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={opsPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Oportunidades"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {opsPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-amber-500 mb-1">
                      {opsF.filter((o) => o.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Prospecção","Qualificação","Proposta","Negociação","Fechamento"] as const).map((estagio) => {
                        const count = opsF.filter((o) => o.corretor === corretorSelecionado && o.estagio === estagio).length;
                        return (
                          <div key={estagio} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{estagio}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
