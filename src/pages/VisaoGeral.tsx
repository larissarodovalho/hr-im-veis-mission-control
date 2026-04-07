import { Users, DollarSign, Wallet, CalendarCheck, Building, FileImage, TrendingUp, Home, MapPin, Tag, Calendar, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  overviewCards, leadsPerDay, budgetDistribution,
  acessosSite, imoveisMaisVisualizados, agendaVisaoGeral, performanceVendas, funnelData,
} from "@/data/mockData";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const statCards = [
  { title: "Leads da Semana", value: overviewCards.leadsSemana, icon: Users, format: "number" },
  { title: "Custo por Lead", value: overviewCards.custoPorLead, icon: DollarSign, format: "currency" },
  { title: "Visitas Agendadas", value: overviewCards.visitasAgendadas, icon: CalendarCheck, format: "number" },
  { title: "Imóveis Ativos", value: overviewCards.imoveisAtivos, icon: Building, format: "number" },
  { title: "Posts Publicados", value: overviewCards.postsPublicados, icon: FileImage, format: "number" },
];

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(224, 73%, 55%)",
  "hsl(43, 76%, 52%)",
  "hsl(160, 60%, 50%)",
  "hsl(280, 60%, 55%)",
];

function formatValue(value: number, format: string) {
  if (format === "currency") return `R$ ${value.toFixed(2)}`;
  return value.toString();
}

export default function VisaoGeral() {
  const budgetPercent = (overviewCards.budgetUsado / overviewCards.budgetTotal) * 100;

  return (
    <div className="space-y-6">
      <h2 className="section-title">Visão Geral</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold font-display">{formatValue(card.value, card.format)}</p>
          </div>
        ))}
      </div>

      {/* Budget Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Budget Mensal</span>
            </div>
            <span className="text-sm text-muted-foreground">
              R$ {overviewCards.budgetUsado.toLocaleString()} / R$ {overviewCards.budgetTotal.toLocaleString()}
            </span>
          </div>
          <Progress value={budgetPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{budgetPercent.toFixed(0)}% utilizado</p>
        </CardContent>
      </Card>

      {/* Acessos no Site + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
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
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="acessos" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorAcessos)" name="Acessos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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

      {/* Charts: Leads por Dia + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Leads por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={leadsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="meta" stroke="hsl(224, 73%, 40%)" strokeWidth={2} name="Meta Ads" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="google" stroke="hsl(43, 76%, 52%)" strokeWidth={2} name="Google Ads" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={budgetDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {budgetDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Imóveis + Agenda + Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="text-sm text-muted-foreground italic">Nenhum agendamento encontrado para os próximos 60 dias.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendaVisaoGeral.map((ag) => (
                  <div key={ag.id} className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-medium">{ag.titulo}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ag.data}</span>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map((etapa, i) => {
              const maxQtd = funnelData.length;
              const widthPercent = 100 - (i * 10);
              return (
                <div
                  key={etapa.etapa}
                  className="flex items-center justify-center rounded-full py-4 px-6 font-bold text-white transition-all shadow-md text-base tracking-wide"
                  style={{ width: `${widthPercent}%`, margin: "0 auto", background: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
                >
                  <span>{etapa.etapa}  |  {etapa.quantidade} cards</span>
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
