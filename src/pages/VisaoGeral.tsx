import { TrendingUp, Home, MapPin, Tag, Calendar, Clock, User, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  acessosSite, imoveisMaisVisualizados, agendaVisaoGeral, performanceVendas,
  funnelData, overviewCards, leadsPerDay, budgetDistribution,
} from "@/data/mockData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(224, 73%, 55%)",
  "hsl(43, 76%, 52%)",
  "hsl(160, 60%, 50%)",
  "hsl(280, 60%, 55%)",
];

export default function VisaoGeral() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Visão Geral</h2>

      {/* Top row: Acessos + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Acessos no Site */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Acessos no Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={acessosSite}>
                <defs>
                  <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="acessos"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#colorAcessos)"
                  name="Acessos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance das vendas */}
        <div className="rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(224, 73%, 55%))" }}>
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-lg font-bold text-primary-foreground font-display">Performance das vendas</h3>
          </div>
          <div className="bg-card mx-3 mb-3 rounded-lg p-5 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{performanceVendas.vendasMes} vendas</p>
                <p className="text-xs text-muted-foreground">no mês atual</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xl font-bold font-display text-primary">
                R$ {performanceVendas.valorNegociosRealizados.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">em negócios realizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Imóveis + Agenda + Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Imóveis mais visualizados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Imóveis mais visualizados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {imoveisMaisVisualizados.map((imovel) => (
              <div key={imovel.codigo} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Home className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-primary" />
                    {imovel.tipo} – {imovel.codigo}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    Sinop, MT – {imovel.bairro}
                  </p>
                  <p className="text-xs font-medium mt-1 flex items-center gap-1 gold-accent">
                    <Tag className="h-3 w-3" />
                    R$ {imovel.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sua agenda */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Sua agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agendaVisaoGeral.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground italic">
                  Nenhum agendamento encontrado para os próximos 60 dias.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaVisaoGeral.map((ag) => (
                  <div key={ag.id} className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-medium">{ag.titulo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ag.data.replace("T", " ")}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{ag.corretor}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">📍 {ag.imovel}</p>
                  </div>
                ))}
                <button className="w-full text-sm text-primary font-medium py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors mt-2">
                  Ver a agenda completa
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funil de Vendas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {funnelData.map((etapa, i) => {
              const maxQtd = funnelData[0].quantidade;
              const widthPercent = Math.max((etapa.quantidade / maxQtd) * 100, 30);
              return (
                <div
                  key={etapa.etapa}
                  className="flex items-center justify-center rounded-full py-2.5 px-4 text-sm font-medium text-primary-foreground transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    margin: "0 auto",
                    background: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                  }}
                >
                  <span className="truncate text-xs">
                    {etapa.etapa} | {etapa.quantidade} cards
                  </span>
                </div>
              );
            })}
            <button className="w-full text-sm text-primary font-medium py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors mt-3">
              Ver o funil completo
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
