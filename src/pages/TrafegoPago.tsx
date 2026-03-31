import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { metaAds, googleAds, metaVsGoogle } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, MousePointer, DollarSign, Eye } from "lucide-react";

function AdSection({ title, data, color }: { title: string; data: typeof metaAds; color: string }) {
  const budgetPercent = (data.gastos / data.budget) * 100;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Impressões", value: data.impressoes.toLocaleString(), icon: Eye },
            { label: "Cliques", value: data.cliques.toLocaleString(), icon: MousePointer },
            { label: "CTR", value: `${data.ctr}%`, icon: TrendingUp },
            { label: "CPC", value: `R$ ${data.cpc.toFixed(2)}`, icon: DollarSign },
            { label: "CPL", value: `R$ ${data.cpl.toFixed(2)}`, icon: DollarSign },
          ].map((m) => (
            <div key={m.label} className="text-center p-3 bg-muted/50 rounded-lg">
              <m.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="font-bold font-display">{m.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Budget</span>
            <span className="text-muted-foreground">R$ {data.gastos.toLocaleString()} / R$ {data.budget.toLocaleString()}</span>
          </div>
          <Progress value={budgetPercent} className="h-3" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Campanha</th>
                <th className="text-right p-2 font-medium">Leads</th>
                <th className="text-right p-2 font-medium">Gasto</th>
                <th className="text-right p-2 font-medium">CPL</th>
              </tr>
            </thead>
            <tbody>
              {data.campanhas.map((c) => (
                <tr key={c.nome} className="border-b">
                  <td className="p-2">{c.nome}</td>
                  <td className="p-2 text-right font-medium">{c.leads}</td>
                  <td className="p-2 text-right">R$ {c.gastos.toLocaleString()}</td>
                  <td className="p-2 text-right">R$ {c.cpl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrafegoPago() {
  const barData = [
    { metrica: "Leads", Meta: 25, Google: 12 },
    { metrica: "Cliques", Meta: 1356, Google: 984 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="section-title">Tráfego Pago</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdSection title="Meta Ads" data={metaAds} color="hsl(224, 73%, 40%)" />
        <AdSection title="Google Ads" data={googleAds} color="hsl(43, 76%, 52%)" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta vs Google — Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <XAxis dataKey="metrica" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Meta" fill="hsl(224, 73%, 40%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Google" fill="hsl(43, 76%, 52%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
