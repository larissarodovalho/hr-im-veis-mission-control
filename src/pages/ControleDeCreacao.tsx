import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { leads, contas, oportunidades, imoveis } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Users, Building2, TrendingUp, Home } from "lucide-react";

const CORRETORES = ["Hans", "Rafael", "Gabriel"] as const;
const FILLS = {
  Hans:    "hsl(224, 73%, 45%)",
  Rafael:  "hsl(160, 60%, 42%)",
  Gabriel: "hsl(43,  76%, 48%)",
};

type Periodo = "Tudo" | "Este mês" | "Mês anterior" | "Este ano";

function filtrarPorData<T extends { dataCreacao: string }>(items: T[], periodo: Periodo): T[] {
  if (periodo === "Tudo") return items;
  const agora = new Date();
  return items.filter((item) => {
    const d = new Date(item.dataCreacao);
    if (periodo === "Este mês")
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
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
  return CORRETORES.map((nome) => ({
    nome,
    quantidade: items.filter((i) => i.corretor === nome).length,
    fill: FILLS[nome],
  }));
}

export default function ControleDeCreacao() {
  const [periodoLeads, setPeriodoLeads]     = useState<Periodo>("Tudo");
  const [periodoContas, setPeriodoContas]   = useState<Periodo>("Tudo");
  const [periodoOps, setPeriodoOps]         = useState<Periodo>("Tudo");
  const [periodoImoveis, setPeriodoImoveis] = useState<Periodo>("Tudo");

  const leadsF    = useMemo(() => filtrarPorData(leads.map(l => ({ ...l, dataCreacao: l.dataEntrada })), periodoLeads),  [periodoLeads]);
  const contasF   = useMemo(() => filtrarPorData(contas,        periodoContas), [periodoContas]);
  const opsF      = useMemo(() => filtrarPorData(oportunidades, periodoOps),    [periodoOps]);
  const imoveisF  = useMemo(() => filtrarPorData(imoveis,       periodoImoveis), [periodoImoveis]);

  const leadsPorCorretor    = useMemo(() => porCorretor(leadsF),   [leadsF]);
  const contasPorCorretor   = useMemo(() => porCorretor(contasF),  [contasF]);
  const opsPorCorretor      = useMemo(() => porCorretor(opsF),     [opsF]);
  const imoveisPorCorretor  = useMemo(() => porCorretor(imoveisF), [imoveisF]);

  const PeriodoSelect = ({
    value,
    onChange,
  }: {
    value: Periodo;
    onChange: (v: Periodo) => void;
  }) => (
    <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
      <SelectTrigger className="w-40 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["Tudo", "Este mês", "Mês anterior", "Este ano"] as Periodo[]).map((p) => (
          <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <h2 className="section-title">Controle de Criação</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Quantidade de Leads</CardTitle>
            </div>
            <PeriodoSelect value={periodoLeads} onChange={setPeriodoLeads} />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Contas */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm">Quantidade de Contas</CardTitle>
            </div>
            <PeriodoSelect value={periodoContas} onChange={setPeriodoContas} />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm">Quantidade de Oportunidades</CardTitle>
            </div>
            <PeriodoSelect value={periodoOps} onChange={setPeriodoOps} />
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        {/* Imóveis Criados */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-sm">Imóveis Criados</CardTitle>
            </div>
            <PeriodoSelect value={periodoImoveis} onChange={setPeriodoImoveis} />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold font-display text-violet-500 mb-4">{imoveisF.length}</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={imoveisPorCorretor} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                <Tooltip formatter={(v) => [v, "Imóveis"]} />
                <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                  {imoveisPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
