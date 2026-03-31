import { Users, DollarSign, Wallet, CalendarCheck, Building, FileImage, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { overviewCards, leadsPerDay, budgetDistribution } from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const statCards = [
  { title: "Leads da Semana", value: overviewCards.leadsSemana, icon: Users, format: "number" },
  { title: "Custo por Lead", value: overviewCards.custoPorLead, icon: DollarSign, format: "currency" },
  { title: "Visitas Agendadas", value: overviewCards.visitasAgendadas, icon: CalendarCheck, format: "number" },
  { title: "Imóveis Ativos", value: overviewCards.imoveisAtivos, icon: Building, format: "number" },
  { title: "Posts Publicados", value: overviewCards.postsPublicados, icon: FileImage, format: "number" },
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

      {/* Charts */}
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
                <Pie
                  data={budgetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
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
    </div>
  );
}
