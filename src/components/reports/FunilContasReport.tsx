import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ETAPAS, etapaLabel, type EtapaFunil } from "@/lib/contasFunil";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
} from "recharts";

type Conta = { id: string; etapa_funil: string | null; tags: string[] | null; responsavel_id: string | null };
type Profile = { user_id: string; nome: string | null };

type Lista = "carteira" | "marketing" | "todas";

const FLUXO: EtapaFunil[] = [
  "a_contatar",
  "contatado",
  "contato_estabelecido",
  "reuniao",
  "visita",
  "proposta",
  "fechado",
];

const COLORS = {
  a_contatar: "hsl(215 16% 47%)",
  contatado: "hsl(217 91% 60%)",
  contato_estabelecido: "hsl(189 94% 43%)",
  sem_retorno: "hsl(38 92% 50%)",
  reuniao: "hsl(258 90% 66%)",
  visita: "hsl(173 80% 40%)",
  proposta: "hsl(199 89% 48%)",
  fechado: "hsl(142 71% 45%)",
  perdido: "hsl(0 72% 51%)",
} as const;

export default function FunilContasReport() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [lista, setLista] = useState<Lista>("carteira");
  const [corretor, setCorretor] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const PAGE = 1000;
      const all: Conta[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("contas")
          .select("id, etapa_funil, tags, responsavel_id")
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as Conta[];
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      const { data: p } = await supabase.from("profiles").select("user_id, nome");
      setContas(all);
      setProfiles((p ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return contas.filter((a) => {
      if (corretor !== "todos" && a.responsavel_id !== corretor) return false;
      if (lista === "todas") return true;
      const tags = (a.tags ?? []).map((t) => t.toLowerCase());
      return tags.includes(lista);
    });
  }, [contas, lista, corretor]);

  const byEtapa = useMemo(() => {
    const m: Record<string, number> = {};
    ETAPAS.forEach((e) => (m[e.id] = 0));
    filtered.forEach((a) => {
      const k = (a.etapa_funil as string) || "a_contatar";
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [filtered]);

  const total = filtered.length;
  const fechados = byEtapa["fechado"] ?? 0;
  const perdidos = byEtapa["perdido"] ?? 0;
  const semRetorno = byEtapa["sem_retorno"] ?? 0;
  const ativos = total - fechados - perdidos - semRetorno;
  const taxaGeral = fechados + perdidos > 0 ? (fechados / (fechados + perdidos)) * 100 : 0;

  // Funil acumulado: contas naquela etapa OU posteriores no fluxo
  const fluxoData = useMemo(() => {
    const indices = FLUXO.map((id) => byEtapa[id] ?? 0);
    // acumulado a partir do fim
    const accum: number[] = new Array(FLUXO.length).fill(0);
    for (let i = FLUXO.length - 1; i >= 0; i--) {
      accum[i] = indices[i] + (accum[i + 1] ?? 0);
    }
    return FLUXO.map((id, i) => ({
      id,
      label: etapaLabel(id),
      quantidade: byEtapa[id] ?? 0,
      acumulado: accum[i],
      conversaoProxima:
        i < FLUXO.length - 1 && accum[i] > 0 ? (accum[i + 1] / accum[i]) * 100 : null,
      color: (COLORS as any)[id],
    }));
  }, [byEtapa]);

  const pieData = [
    { name: "Em andamento", value: ativos, color: "hsl(217 91% 60%)" },
    { name: "Sem retorno", value: semRetorno, color: COLORS.sem_retorno },
    { name: "Fechado", value: fechados, color: COLORS.fechado },
    { name: "Perdido", value: perdidos, color: COLORS.perdido },
  ].filter((d) => d.value > 0);

  // Comparação Carteira × Marketing (apenas na aba "todas")
  const comparaData = useMemo(() => {
    if (lista !== "todas") return [];
    const base = contas.filter((a) => corretor === "todos" || a.responsavel_id === corretor);
    return ETAPAS.map((e) => {
      const carteira = base.filter((a) => {
        const t = (a.tags ?? []).map((x) => x.toLowerCase());
        return t.includes("carteira") && (a.etapa_funil ?? "a_contatar") === e.id;
      }).length;
      const marketing = base.filter((a) => {
        const t = (a.tags ?? []).map((x) => x.toLowerCase());
        return t.includes("marketing") && (a.etapa_funil ?? "a_contatar") === e.id;
      }).length;
      return { label: e.label, Carteira: carteira, Marketing: marketing };
    });
  }, [contas, lista, corretor]);

  if (loading) {
    return <Card className="p-6 text-muted-foreground">Carregando funil de contas…</Card>;
  }

  const listaQuery = lista === "todas" ? "carteira" : lista;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Funil de Contas</h2>
          <p className="text-sm text-muted-foreground">
            Distribuição por etapa, taxas de conversão e comparação entre listas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={corretor} onValueChange={setCorretor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Corretor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os corretores</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {p.nome || "Sem nome"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={lista} onValueChange={(v) => setLista(v as Lista)}>
        <TabsList>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Total" value={total} link={`/crm/contas?lista=${listaQuery}`} />
        <Kpi label="Em andamento" value={ativos} />
        <Kpi label="Sem retorno" value={semRetorno} />
        <Kpi label="Fechados" value={fechados} tone="success" />
        <Kpi label="Taxa conversão" value={`${taxaGeral.toFixed(1)}%`} tone="primary" />
      </div>

      {/* Funil + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Funil por etapa</h3>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoData} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="label" type="category" width={160} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: any, _n, p: any) => {
                    const conv = p?.payload?.conversaoProxima;
                    return [`${v}${conv != null ? ` (avanço: ${conv.toFixed(1)}%)` : ""}`, "Contas"];
                  }}
                />
                <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                  {fluxoData.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Distribuição</h3>
          <div className="h-[340px]">
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Tabela por etapa */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Detalhamento por etapa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr className="border-b">
                <th className="py-2">Etapa</th>
                <th className="py-2 text-right">Quantidade</th>
                <th className="py-2 text-right">% do total</th>
                <th className="py-2 text-right">Avanço p/ próxima</th>
              </tr>
            </thead>
            <tbody>
              {fluxoData.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Badge variant="outline" style={{ borderColor: d.color, color: d.color }}>
                      {d.label}
                    </Badge>
                  </td>
                  <td className="py-2 text-right font-medium">{d.quantidade}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {total ? ((d.quantidade / total) * 100).toFixed(1) : "0.0"}%
                  </td>
                  <td className="py-2 text-right">
                    {d.conversaoProxima != null ? `${d.conversaoProxima.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
              <tr className="border-b">
                <td className="py-2">
                  <Badge variant="outline" style={{ borderColor: COLORS.sem_retorno, color: COLORS.sem_retorno }}>
                    Sem retorno
                  </Badge>
                </td>
                <td className="py-2 text-right font-medium">{semRetorno}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {total ? ((semRetorno / total) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="py-2 text-right">—</td>
              </tr>
              <tr>
                <td className="py-2">
                  <Badge variant="outline" style={{ borderColor: COLORS.perdido, color: COLORS.perdido }}>
                    Perdido
                  </Badge>
                </td>
                <td className="py-2 text-right font-medium">{perdidos}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {total ? ((perdidos / total) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="py-2 text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-right">
          <Link to={`/crm/contas?lista=${listaQuery}`} className="text-xs text-primary hover:underline">
            Abrir kanban de Contas →
          </Link>
        </div>
      </Card>

      {/* Comparação Carteira × Marketing */}
      {lista === "todas" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Carteira × Marketing por etapa</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="Carteira" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Marketing" fill="hsl(330 81% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </Card>
  );
}

function Kpi({
  label,
  value,
  tone,
  link,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "primary";
  link?: string;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  const content = (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </Card>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}
