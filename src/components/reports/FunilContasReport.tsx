import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ETAPAS, etapaLabel, categoriaDe, QUALIFICACAO_LABEL, QUALIFICACAO_BADGE, type QualificacaoStatus } from "@/lib/contasFunil";
import { nextTaskCountdown } from "@/lib/tarefas";
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
import { useReportsPeriod } from "@/hooks/useReportsPeriod";

type Conta = {
  id: string;
  etapa_funil: string | null;
  tags: string[] | null;
  categoria: string | null;
  responsavel_id: string | null;
  created_at: string | null;
  qualificacao_status: string | null;
};
type Profile = { user_id: string; nome: string | null };
type Tarefa = { conta_id: string | null; prazo: string | null };

type Lista = "carteira" | "marketing" | "todas";

// Fluxo ativo do novo funil (5 etapas)
const FLUXO: string[] = ["a_contatar", "contatado", "contato_estabelecido"];

const COLORS: Record<string, string> = {
  a_contatar: "hsl(215 16% 47%)",
  contatado: "hsl(217 91% 60%)",
  sem_retorno: "hsl(38 92% 50%)",
  contato_estabelecido: "hsl(189 94% 43%)",
  contato_cancelado: "hsl(0 72% 51%)",
};

const QUALIFICACAO_ORDER: QualificacaoStatus[] = [
  "pendente",
  "oportunidade_ativa",
  "oportunidade_futura",
  "nao_qualificado",
];

export default function FunilContasReport() {
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const [contas, setContas] = useState<Conta[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
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
          .select("id, etapa_funil, tags, categoria, responsavel_id, created_at, qualificacao_status")
          .gte("created_at", inicioISO)
          .lte("created_at", fimISO)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as Conta[];
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      // Próxima tarefa pendente por conta (mesma origem da tag de countdown do kanban)
      const { data: t } = await supabase
        .from("tarefas")
        .select("conta_id, prazo")
        .not("conta_id", "is", null)
        .not("prazo", "is", null)
        .neq("status", "Concluída")
        .order("prazo", { ascending: true })
        .limit(1000);
      const { data: p } = await supabase.from("profiles").select("user_id, nome");
      setContas(all);
      setTarefas((t ?? []) as Tarefa[]);
      setProfiles((p ?? []) as Profile[]);
      setLoading(false);
    })();
  }, [inicioISO, fimISO]);

  const filtered = useMemo(() => {
    return contas.filter((a) => {
      if (corretor !== "todos" && a.responsavel_id !== corretor) return false;
      if (lista === "todas") return true;
      return categoriaDe(a) === lista;
    });
  }, [contas, lista, corretor]);

  const byEtapa = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((a) => {
      const k = (a.etapa_funil as string) || "a_contatar";
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [filtered]);

  const total = filtered.length;
  const cancelados = byEtapa["contato_cancelado"] ?? 0;
  const semRetorno = byEtapa["sem_retorno"] ?? 0;
  const estabelecidos = byEtapa["contato_estabelecido"] ?? 0;
  const ativos = total - cancelados - semRetorno;

  // Atendimento programado: contas ativas com tarefa futura/hoje vs. tarefa atrasada
  const tarefaPorConta = useMemo(() => {
    const m = new Map<string, string>();
    tarefas.forEach((t) => {
      if (t.conta_id && t.prazo && !m.has(t.conta_id)) m.set(t.conta_id, t.prazo);
    });
    return m;
  }, [tarefas]);

  const atendimentoKpis = useMemo(() => {
    let programado = 0;
    let atrasada = 0;
    filtered.forEach((a) => {
      const etapa = a.etapa_funil ?? "a_contatar";
      if (etapa === "contato_cancelado" || etapa === "sem_retorno") return;
      const prazo = tarefaPorConta.get(a.id);
      if (!prazo) return;
      const cd = nextTaskCountdown(prazo);
      if (!cd) return;
      if (cd.tom === "atrasada") atrasada++;
      else programado++;
    });
    return { programado, atrasada };
  }, [filtered, tarefaPorConta]);

  // Funil acumulado: contas naquela etapa OU posteriores no fluxo ativo
  const fluxoData = useMemo(() => {
    const indices = FLUXO.map((id) => byEtapa[id] ?? 0);
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
      color: COLORS[id],
    }));
  }, [byEtapa]);

  const pieData = [
    { name: "Em andamento", value: ativos, color: "hsl(217 91% 60%)" },
    { name: "Sem retorno", value: semRetorno, color: COLORS.sem_retorno },
    { name: "Contato estabelecido", value: estabelecidos, color: COLORS.contato_estabelecido },
    { name: "Contato cancelado", value: cancelados, color: COLORS.contato_cancelado },
  ].filter((d) => d.value > 0);

  // Qualificação das contas em Contato estabelecido (ponte Contas → Oportunidades)
  const qualificacaoData = useMemo(() => {
    const estabelecidas = filtered.filter(
      (a) => (a.etapa_funil ?? "a_contatar") === "contato_estabelecido"
    );
    const m: Record<string, number> = {};
    estabelecidas.forEach((a) => {
      const k = (a.qualificacao_status as QualificacaoStatus) || "pendente";
      m[k] = (m[k] ?? 0) + 1;
    });
    return {
      total: estabelecidas.length,
      itens: QUALIFICACAO_ORDER.map((status) => ({
        status,
        label: QUALIFICACAO_LABEL[status],
        badge: QUALIFICACAO_BADGE[status],
        qtd: m[status] ?? 0,
      })),
    };
  }, [filtered]);

  // Comparação Carteira × Marketing (apenas na aba "todas")
  const comparaData = useMemo(() => {
    if (lista !== "todas") return [];
    const base = contas.filter((a) => corretor === "todos" || a.responsavel_id === corretor);
    return ETAPAS.map((e) => {
      const carteira = base.filter(
        (a) => categoriaDe(a) === "carteira" && (a.etapa_funil ?? "a_contatar") === e.id
      ).length;
      const marketing = base.filter(
        (a) => categoriaDe(a) === "marketing" && (a.etapa_funil ?? "a_contatar") === e.id
      ).length;
      return { label: e.label, Carteira: carteira, Marketing: marketing };
    });
  }, [contas, lista, corretor]);

  if (loading) {
    return <Card className="p-6 text-muted-foreground">Carregando funil de contas…</Card>;
  }

  const listaQuery = lista === "todas" ? "carteira" : lista;

  return (
    <Card className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg md:text-xl font-semibold">Funil de Contas · {label}</h2>
          <p className="text-sm text-muted-foreground">
            Distribuição por etapa, atendimento programado e comparação entre listas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={corretor} onValueChange={setCorretor}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Total" value={total} link={`/crm/contas?lista=${listaQuery}`} />
        <Kpi label="Em andamento" value={ativos} />
        <Kpi label="Sem retorno" value={semRetorno} />
        <Kpi
          label="Contato estabelecido"
          value={estabelecidos}
          tone="success"
          hint="Contas que responderam e têm conversa efetiva."
        />
        <Kpi
          label="Com atendimento programado"
          value={atendimentoKpis.programado}
          tone="primary"
          link={`/crm/contas?lista=${listaQuery}`}
          hint="Contas ativas com tarefa de contato futura ou para hoje/amanhã (tag azul/amarela do kanban)."
        />
        <Kpi
          label="Tarefa de contato atrasada"
          value={atendimentoKpis.atrasada}
          tone="danger"
          link={`/crm/contas?lista=${listaQuery}`}
          hint="Contas ativas cuja próxima tarefa de contato já venceu (tag vermelha do kanban)."
        />
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
                  <Badge variant="outline" style={{ borderColor: COLORS.contato_cancelado, color: COLORS.contato_cancelado }}>
                    Contato cancelado
                  </Badge>
                </td>
                <td className="py-2 text-right font-medium">{cancelados}</td>
                <td className="py-2 text-right text-muted-foreground">
                  {total ? ((cancelados / total) * 100).toFixed(1) : "0.0"}%
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

      {/* Qualificação → Oportunidades */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <div>
            <h3 className="font-semibold">Qualificação → Oportunidades</h3>
            <p className="text-sm text-muted-foreground">
              Status de qualificação das {qualificacaoData.total} contas em Contato estabelecido.
            </p>
          </div>
          {qualificacaoData.itens[0].qtd > 0 && (
            <Badge variant="outline" className={QUALIFICACAO_BADGE.pendente}>
              {qualificacaoData.itens[0].qtd} aguardando qualificação
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {qualificacaoData.itens.map((q) => (
            <div key={q.status} className="rounded-lg border p-4">
              <Badge variant="outline" className={q.badge}>{q.label}</Badge>
              <p className="text-2xl font-semibold mt-2">{q.qtd}</p>
              <p className="text-xs text-muted-foreground">
                {qualificacaoData.total ? ((q.qtd / qualificacaoData.total) * 100).toFixed(1) : "0.0"}% das estabelecidas
              </p>
            </div>
          ))}
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
  hint,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "primary";
  link?: string;
  hint?: string;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  const content = (
    <Card className="p-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        {hint && (
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Sobre ${label}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="inline-flex items-center text-muted-foreground/70 hover:text-foreground focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                {hint}
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        )}
      </div>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </Card>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}
