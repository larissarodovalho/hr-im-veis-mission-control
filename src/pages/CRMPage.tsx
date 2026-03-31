import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { leads, funnelData, imoveis, corretoresRanking } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDown, ChevronUp, Phone, DollarSign, Users, Trophy } from "lucide-react";

export default function CRM() {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const totalEmNegociacao = imoveis
    .filter((i) => i.status === "Em negociação")
    .reduce((acc, i) => acc + i.valor, 0);

  const visitasAgendadas = leads.filter((l) => l.etapa === "Visita agendada").length;
  const visitasRealizadas = leads.filter((l) => l.etapa === "Visita realizada").length;
  const taxaComparecimento = visitasAgendadas > 0 ? ((visitasRealizadas / (visitasAgendadas + visitasRealizadas)) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <h2 className="section-title">CRM — Comercial</h2>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 120 }}>
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="etapa" fontSize={11} width={110} />
              <Tooltip />
              <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
          <p className="text-xl font-bold font-display">{visitasAgendadas + visitasRealizadas} agendadas · {visitasRealizadas} realizadas</p>
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
              <span className="text-muted-foreground">{c.atendimentos} atend · {c.visitas} vis · {c.propostas} prop</span>
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
                  <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                  <th className="text-left p-3 font-medium">Etapa</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Entrada</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <>
                    <tr key={lead.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                      <td className="p-3 font-medium">{lead.nome}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant={lead.canal === "Meta Ads" ? "default" : "secondary"} className="text-xs">
                          {lead.canal}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">{lead.corretor}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{lead.etapa}</Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{lead.dataEntrada}</td>
                      <td className="p-3">
                        {expandedLead === lead.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-hist`}>
                        <td colSpan={7} className="p-4 bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico — Sofia IA</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lead.historico.map((msg, i) => (
                              <div key={i} className={`flex ${msg.remetente === "Sofia" ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.remetente === "Sofia" ? "bg-primary/10 text-foreground" : "bg-accent/20 text-foreground"}`}>
                                  <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{msg.remetente} · {msg.data}</p>
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
                        variant={imovel.status === "Vendido" ? "default" : imovel.status === "Em negociação" ? "secondary" : "outline"}
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
