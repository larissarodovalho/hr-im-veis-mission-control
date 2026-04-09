import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart2,
  Megaphone,
} from "lucide-react";
import TrafegoPago from "./TrafegoPago";
import RedesSociais from "./RedesSociais";
import Conteudo from "./Conteudo";

// --- Mock Data ---

interface Campanha {
  id: string;
  nome: string;
  tipo: string;
  status: "Ativa" | "Pausada" | "Finalizada" | "Planejada";
  inicio: string;
  fim: string;
  orcamento: number;
  gasto: number;
  leads: number;
  conversoes: number;
  roi: number;
}

const campanhasMock: Campanha[] = [
  { id: "1", nome: "Lançamento Res. Aurora", tipo: "Meta Ads", status: "Ativa", inicio: "2026-03-01", fim: "2026-04-30", orcamento: 5000, gasto: 3200, leads: 85, conversoes: 12, roi: 320 },
  { id: "2", nome: "Remarketing Imóveis Premium", tipo: "Google Ads", status: "Ativa", inicio: "2026-03-15", fim: "2026-04-15", orcamento: 3000, gasto: 2100, leads: 42, conversoes: 6, roi: 180 },
  { id: "3", nome: "Captação Bairro Centro", tipo: "Meta Ads", status: "Pausada", inicio: "2026-02-01", fim: "2026-03-31", orcamento: 2000, gasto: 1800, leads: 30, conversoes: 3, roi: 90 },
  { id: "4", nome: "Evento Open House Abril", tipo: "Evento", status: "Planejada", inicio: "2026-04-20", fim: "2026-04-20", orcamento: 1500, gasto: 0, leads: 0, conversoes: 0, roi: 0 },
  { id: "5", nome: "Campanha Dia das Mães", tipo: "E-mail", status: "Planejada", inicio: "2026-05-01", fim: "2026-05-12", orcamento: 800, gasto: 0, leads: 0, conversoes: 0, roi: 0 },
  { id: "6", nome: "Promoção Verão 2026", tipo: "Meta Ads", status: "Finalizada", inicio: "2026-01-10", fim: "2026-02-28", orcamento: 4000, gasto: 4000, leads: 110, conversoes: 18, roi: 450 },
];

const kpisMensal = [
  { mes: "Jan", leads: 95, conversoes: 14, custo: 3800 },
  { mes: "Fev", leads: 120, conversoes: 18, custo: 4200 },
  { mes: "Mar", leads: 130, conversoes: 21, custo: 5100 },
  { mes: "Abr", leads: 85, conversoes: 12, custo: 3200 },
];

const acoesMes = [
  { dia: 5, titulo: "Publicar post carrossel", tipo: "Redes Sociais" },
  { dia: 8, titulo: "Enviar e-mail base quente", tipo: "E-mail" },
  { dia: 12, titulo: "Lançar campanha Meta", tipo: "Meta Ads" },
  { dia: 15, titulo: "Reunião de marketing", tipo: "Reunião" },
  { dia: 18, titulo: "Gravar vídeo tour imóvel", tipo: "Conteúdo" },
  { dia: 20, titulo: "Evento Open House", tipo: "Evento" },
  { dia: 22, titulo: "Revisar criativos", tipo: "Design" },
  { dia: 25, titulo: "Relatório mensal", tipo: "Relatório" },
  { dia: 28, titulo: "Ajustar orçamento Google", tipo: "Google Ads" },
];

const statusColor: Record<string, string> = {
  Ativa: "bg-emerald-100 text-emerald-700",
  Pausada: "bg-amber-100 text-amber-700",
  Finalizada: "bg-muted text-muted-foreground",
  Planejada: "bg-blue-100 text-blue-700",
};

const tipoColor: Record<string, string> = {
  "Meta Ads": "bg-primary/10 text-primary",
  "Google Ads": "bg-accent/20 text-accent-foreground",
  Evento: "bg-purple-100 text-purple-700",
  "E-mail": "bg-pink-100 text-pink-700",
  "Redes Sociais": "bg-cyan-100 text-cyan-700",
  Reunião: "bg-muted text-muted-foreground",
  Conteúdo: "bg-green-100 text-green-700",
  Design: "bg-orange-100 text-orange-700",
  Relatório: "bg-slate-100 text-slate-700",
};

function MarketingGeral() {
  const [campanhas, setCampanhas] = useState(campanhasMock);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaCampanha, setNovaCampanha] = useState({ nome: "", tipo: "Meta Ads", orcamento: "" });

  const totalLeads = campanhas.reduce((s, c) => s + c.leads, 0);
  const totalConversoes = campanhas.reduce((s, c) => s + c.conversoes, 0);
  const totalGasto = campanhas.reduce((s, c) => s + c.gasto, 0);
  const totalOrcamento = campanhas.reduce((s, c) => s + c.orcamento, 0);
  const cpl = totalLeads > 0 ? totalGasto / totalLeads : 0;
  const taxaConversao = totalLeads > 0 ? ((totalConversoes / totalLeads) * 100) : 0;
  const ativas = campanhas.filter(c => c.status === "Ativa").length;

  const handleAddCampanha = () => {
    if (!novaCampanha.nome.trim()) return;
    const nova: Campanha = {
      id: Date.now().toString(),
      nome: novaCampanha.nome,
      tipo: novaCampanha.tipo,
      status: "Planejada",
      inicio: new Date().toISOString().slice(0, 10),
      fim: "",
      orcamento: Number(novaCampanha.orcamento) || 0,
      gasto: 0,
      leads: 0,
      conversoes: 0,
      roi: 0,
    };
    setCampanhas([nova, ...campanhas]);
    setNovaCampanha({ nome: "", tipo: "Meta Ads", orcamento: "" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Marketing — Visão Geral
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome da Campanha</Label>
                <Input value={novaCampanha.nome} onChange={e => setNovaCampanha(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Lançamento Residencial" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={novaCampanha.tipo} onValueChange={v => setNovaCampanha(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Meta Ads", "Google Ads", "E-mail", "Evento", "Redes Sociais", "Conteúdo"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orçamento (R$)</Label>
                <Input type="number" value={novaCampanha.orcamento} onChange={e => setNovaCampanha(p => ({ ...p, orcamento: e.target.value }))} placeholder="0" />
              </div>
              <Button onClick={handleAddCampanha} className="w-full">Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Campanhas Ativas", value: ativas.toString(), icon: Target, color: "text-emerald-600" },
          { label: "Total Leads", value: totalLeads.toString(), icon: Users, color: "text-primary" },
          { label: "Conversões", value: totalConversoes.toString(), icon: CheckCircle2, color: "text-emerald-600" },
          { label: "CPL Médio", value: `R$ ${cpl.toFixed(2)}`, icon: DollarSign, color: "text-accent-foreground" },
          { label: "Taxa Conversão", value: `${taxaConversao.toFixed(1)}%`, icon: TrendingUp, color: "text-primary" },
          { label: "Investido", value: `R$ ${(totalGasto / 1000).toFixed(1)}k`, icon: BarChart2, color: "text-destructive" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center">
              <kpi.icon className={`h-5 w-5 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className="font-bold text-lg font-display">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget progress */}
      <Card>
        <CardContent className="pt-4 pb-3 px-5">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Orçamento Total</span>
            <span className="text-muted-foreground">R$ {totalGasto.toLocaleString()} / R$ {totalOrcamento.toLocaleString()}</span>
          </div>
          <Progress value={(totalGasto / totalOrcamento) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads & Conversões — Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={kpisMensal}>
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="hsl(224, 73%, 40%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="conversoes" name="Conversões" fill="hsl(43, 76%, 52%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custo por Lead — Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={kpisMensal.map(m => ({ ...m, cpl: m.leads > 0 ? (m.custo / m.leads) : 0 }))}>
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="cpl" name="CPL" stroke="hsl(224, 73%, 40%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium">Campanha</th>
                  <th className="text-left p-2 font-medium">Tipo</th>
                  <th className="text-center p-2 font-medium">Status</th>
                  <th className="text-right p-2 font-medium">Orçamento</th>
                  <th className="text-right p-2 font-medium">Gasto</th>
                  <th className="text-right p-2 font-medium">Leads</th>
                  <th className="text-right p-2 font-medium">Conv.</th>
                  <th className="text-right p-2 font-medium">ROI %</th>
                </tr>
              </thead>
              <tbody>
                {campanhas.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{c.nome}</td>
                    <td className="p-2">
                      <Badge variant="outline" className={tipoColor[c.tipo] || ""}>{c.tipo}</Badge>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                        {c.status === "Ativa" && <CheckCircle2 className="h-3 w-3" />}
                        {c.status === "Pausada" && <Clock className="h-3 w-3" />}
                        {c.status === "Planejada" && <CalendarDays className="h-3 w-3" />}
                        {c.status === "Finalizada" && <AlertCircle className="h-3 w-3" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">R$ {c.orcamento.toLocaleString()}</td>
                    <td className="p-2 text-right">R$ {c.gasto.toLocaleString()}</td>
                    <td className="p-2 text-right font-medium">{c.leads}</td>
                    <td className="p-2 text-right font-medium">{c.conversoes}</td>
                    <td className="p-2 text-right font-medium">{c.roi}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Calendário de ações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Calendário de Ações — Abril 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {acoesMes.map((acao, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{acao.dia}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{acao.titulo}</p>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${tipoColor[acao.tipo] || ""}`}>{acao.tipo}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Marketing() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "geral";

  switch (tab) {
    case "trafego":
      return <TrafegoPago />;
    case "redes-sociais":
      return <RedesSociais />;
    case "conteudo":
      return <Conteudo />;
    default:
      return <MarketingGeral />;
  }
}
