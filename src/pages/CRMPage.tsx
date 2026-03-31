// corretorId prop (future auth): quando cada corretor logar, passar corretorId para filtrar
// apenas os dados do corretor autenticado. Ex: <CRM corretorId="hans" />
// const corretorId: string | undefined = undefined;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leads, imoveis, corretoresRanking, funnelPorCorretor } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDown, ChevronUp, Phone, DollarSign, Users, Trophy, TrendingUp } from "lucide-react";

export default function CRM() {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

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
    </div>
  );
}
