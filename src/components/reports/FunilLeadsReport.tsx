import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { TENTATIVA_SEQ, TENTATIVA_TIPOS, ETAPAS_ATIVAS_FUNIL, ETAPAS_FLUXO_ATENDIMENTO, classificaFluxoAtendimento, FLUXO_ATENDIMENTO_CLASSE_INFO, FluxoAtendimentoClasse, stageLabel } from "@/lib/leads";
import { useReportsPeriod } from "@/hooks/useReportsPeriod";

type Lead = {
  id: string;
  etapa_funil: string | null;
  corretor_id: string | null;
  created_at: string;
  motivo_desclassificacao: string | null;
};
type ContaRef = { lead_id_origem: string | null; desclassificada: boolean | null };
type Tentativa = { lead_id: string | null; tipo: string | null; pontualidade: string | null };
type Profile = { user_id: string; nome: string | null };
type FluxoLead = { id: string; corretor_id: string | null; data_entrada: string | null; created_at: string | null; etapa_funil: string | null };

const STAGE_COLORS: Record<string, string> = {
  "Novo Lead": "hsl(217 91% 60%)",
  "Pré-atendimento": "hsl(189 94% 43%)",
  "Em Contato": "hsl(243 75% 59%)",
  "Conversa Ativa": "hsl(262 83% 58%)",
  "Perdido": "hsl(0 72% 51%)",
};

const PONT_COLORS: Record<string, string> = {
  no_prazo: "hsl(142 76% 36%)",
  adiantada: "hsl(38 92% 50%)",
  atrasada: "hsl(0 72% 51%)",
};

const PAGE = 1000;

export default function FunilLeadsReport() {
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contasRef, setContasRef] = useState<ContaRef[]>([]);
  const [tentativas, setTentativas] = useState<Tentativa[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fluxoLeads, setFluxoLeads] = useState<FluxoLead[]>([]);
  const [tentCount, setTentCount] = useState<Record<string, number>>({});
  const [corretor, setCorretor] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const allLeads: Lead[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("leads")
          .select("id, etapa_funil, corretor_id, created_at, motivo_desclassificacao")
          .gte("created_at", inicioISO)
          .lte("created_at", fimISO)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as Lead[];
        allLeads.push(...rows);
        if (rows.length < PAGE) break;
      }
      const allContas: ContaRef[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("contas")
          .select("lead_id_origem, desclassificada")
          .not("lead_id_origem", "is", null)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as ContaRef[];
        allContas.push(...rows);
        if (rows.length < PAGE) break;
      }
      const allTent: Tentativa[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("interacoes")
          .select("lead_id, tipo, pontualidade")
          .not("lead_id", "is", null)
          .not("pontualidade", "is", null)
          .in("tipo", TENTATIVA_SEQ.map((t) => t.tipo))
          .gte("created_at", inicioISO)
          .lte("created_at", fimISO)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as Tentativa[];
        allTent.push(...rows);
        if (rows.length < PAGE) break;
      }
      // Snapshot atual do fluxo de atendimento (independe do período selecionado)
      const allFluxo: FluxoLead[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("leads")
          .select("id, corretor_id, data_entrada, created_at, etapa_funil")
          .in("etapa_funil", ETAPAS_FLUXO_ATENDIMENTO)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as FluxoLead[];
        allFluxo.push(...rows);
        if (rows.length < PAGE) break;
      }
      const tentCounts: Record<string, number> = {};
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("interacoes")
          .select("lead_id")
          .not("lead_id", "is", null)
          .in("tipo", TENTATIVA_TIPOS)
          .range(from, from + PAGE - 1);
        if (error) break;
        const rows = (data ?? []) as { lead_id: string | null }[];
        rows.forEach((r) => {
          if (r.lead_id) tentCounts[r.lead_id] = (tentCounts[r.lead_id] ?? 0) + 1;
        });
        if (rows.length < PAGE) break;
      }
      const { data: profs } = await supabase.from("profiles").select("user_id, nome");
      if (cancel) return;
      setLeads(allLeads);
      setContasRef(allContas);
      setTentativas(allTent);
      setFluxoLeads(allFluxo);
      setTentCount(tentCounts);
      setProfiles((profs ?? []) as Profile[]);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [inicioISO, fimISO]);

  const filtered = useMemo(
    () => (corretor === "todos" ? leads : leads.filter((l) => l.corretor_id === corretor)),
    [leads, corretor],
  );

  const convertidasIds = useMemo(() => {
    const s = new Set<string>();
    contasRef.forEach((c) => {
      if (c.lead_id_origem && !c.desclassificada) s.add(c.lead_id_origem);
    });
    return s;
  }, [contasRef]);

  // Qualquer conta vinculada tira o lead do acompanhamento do fluxo (mesma regra da aba Leads)
  const vinculadasIds = useMemo(() => {
    const s = new Set<string>();
    contasRef.forEach((c) => {
      if (c.lead_id_origem) s.add(c.lead_id_origem);
    });
    return s;
  }, [contasRef]);

  const total = filtered.length;
  const convertidos = filtered.filter((l) => convertidasIds.has(l.id)).length;
  const desclassificados = filtered.filter((l) => !!l.motivo_desclassificacao).length;

  const byStage = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((l) => {
      const k = l.etapa_funil ?? "Novo Lead";
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [filtered]);

  const perdidos = byStage["Perdido"] ?? 0;

  const emAtendimento = ETAPAS_ATIVAS_FUNIL.reduce((s, e) => s + (byStage[e] ?? 0), 0);

  // Funil de progressão: apenas as 4 etapas ativas (Perdido fica fora, como linha informativa)
  const funilData = useMemo(() => {
    const accum: number[] = new Array(ETAPAS_ATIVAS_FUNIL.length).fill(0);
    for (let i = ETAPAS_ATIVAS_FUNIL.length - 1; i >= 0; i--) {
      accum[i] = (byStage[ETAPAS_ATIVAS_FUNIL[i]] ?? 0) + (accum[i + 1] ?? 0);
    }
    return ETAPAS_ATIVAS_FUNIL.map((id, i) => ({
      id,
      label: stageLabel(id),
      quantidade: byStage[id] ?? 0,
      acumulado: accum[i],
      avanco: i < ETAPAS_ATIVAS_FUNIL.length - 1 && accum[i] > 0 ? (accum[i + 1] / accum[i]) * 100 : null,
      color: STAGE_COLORS[id],
    }));
  }, [byStage]);

  // Snapshot do fluxo de atendimento (situação atual dos leads ativos, respeita filtro de corretor)
  const fluxoSnapshot = useMemo(() => {
    const countsByClasse: Record<FluxoAtendimentoClasse, number> = { sem_tentativa: 0, atrasado: 0, no_prazo: 0, concluido: 0 };
    let totalAtivos = 0;
    fluxoLeads.forEach((l) => {
      if (vinculadasIds.has(l.id)) return;
      if (corretor !== "todos" && l.corretor_id !== corretor) return;
      totalAtivos++;
      countsByClasse[classificaFluxoAtendimento(l, tentCount[l.id] ?? 0)]++;
    });
    return { total: totalAtivos, countsByClasse };
  }, [fluxoLeads, tentCount, vinculadasIds, corretor]);

  // SLA das tentativas de contato (mensagem imediata, áudio +24h, ligação +48h)
  const slaData = useMemo(() => {
    const leadCorretor = new Map(leads.map((l) => [l.id, l.corretor_id]));
    const tent = tentativas.filter((t) => {
      if (corretor === "todos") return true;
      return t.lead_id ? leadCorretor.get(t.lead_id) === corretor : false;
    });
    return TENTATIVA_SEQ.map((seq) => {
      const rows = tent.filter((t) => t.tipo === seq.tipo);
      const count = (p: string) => rows.filter((t) => t.pontualidade === p).length;
      const noPrazo = count("no_prazo");
      const totalT = rows.length;
      return {
        key: seq.tipo as string,
        label: `${seq.ordem}ª tentativa · ${seq.label}`,
        prazo: seq.prazoHoras === 0 ? "Imediata" : `+${seq.prazoHoras}h da entrada`,
        total: totalT,
        noPrazo,
        adiantada: count("adiantada"),
        atrasada: count("atrasada"),
        taxa: totalT > 0 ? (noPrazo / totalT) * 100 : null,
      };
    });
  }, [tentativas, leads, corretor]);

  const motivos = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((l) => {
      if (!l.motivo_desclassificacao) return;
      m[l.motivo_desclassificacao] = (m[l.motivo_desclassificacao] ?? 0) + 1;
    });
    return Object.entries(m)
      .map(([motivo, qtd]) => ({ motivo, qtd }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [filtered]);

  if (loading) {
    return <Card className="p-6 text-muted-foreground">Carregando funil de leads…</Card>;
  }

  return (
    <Card className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg md:text-xl font-semibold">Funil de Leads · {label}</h2>
          <p className="text-sm text-muted-foreground">
            Etapas do funil conversacional, SLA das tentativas de contato e desclassificações.
          </p>
        </div>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Leads no período" value={total} link="/crm/leads" />
        <Kpi label="Em atendimento" value={emAtendimento} hint="Leads nas 4 etapas ativas do funil (Novo Lead, Pré-atendimento, Em Contato, Conversa Ativa)." />
        <Kpi label="Convertidos em conta" value={convertidos} tone="success" hint="Leads do período que viraram conta (qualificados como Conta Cliente)." />
        <Kpi label="Desclassificados" value={desclassificados} tone="danger" hint="Leads do período desclassificados (viraram conta cancelada com motivo)." />
      </div>

      {/* Funil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Funil por etapa</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilData} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="label" type="category" width={130} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: any, _n, p: any) => {
                    const av = p?.payload?.avanco;
                    return [`${v}${av != null ? ` (avanço: ${av.toFixed(1)}%)` : ""}`, "Leads"];
                  }}
                />
                <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                  {funilData.map((d) => (
                    <Cell key={d.id} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Detalhamento por etapa</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">% do total</TableHead>
                <TableHead className="text-right">Avanço p/ próxima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funilData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: d.color, color: d.color }}>
                      {d.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{d.quantidade}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {total ? ((d.quantidade / total) * 100).toFixed(1) : "0.0"}%
                  </TableCell>
                  <TableCell className="text-right">
                    {d.avanco != null ? `${d.avanco.toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Badge variant="outline" style={{ borderColor: STAGE_COLORS["Perdido"], color: STAGE_COLORS["Perdido"] }}>
                    Perdido
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{perdidos}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {total ? ((perdidos / total) * 100).toFixed(1) : "0.0"}%
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">fora da progressão</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-3 text-right">
            <Link to="/crm/leads" className="text-xs text-primary hover:underline">
              Abrir kanban de Leads →
            </Link>
          </div>
        </Card>
      </div>

      {/* SLA das tentativas */}
      <Card className="p-4">
        <h3 className="font-semibold mb-1">SLA das tentativas de contato</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Pontualidade registrada nas tentativas feitas no período (mensagem imediata, áudio em até 24h, ligação em até 48h — tolerância de 1h).
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tentativa</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Registradas</TableHead>
                <TableHead className="text-right">✓ No prazo</TableHead>
                <TableHead className="text-right">⏩ Adiantadas</TableHead>
                <TableHead className="text-right">⚠ Atrasadas</TableHead>
                <TableHead className="text-right">% no prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaData.map((s) => (
                <TableRow key={s.key}>
                  <TableCell className="font-medium whitespace-nowrap">{s.label}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{s.prazo}</TableCell>
                  <TableCell className="text-right">{s.total}</TableCell>
                  <TableCell className="text-right" style={{ color: PONT_COLORS.no_prazo }}>{s.noPrazo}</TableCell>
                  <TableCell className="text-right" style={{ color: PONT_COLORS.adiantada }}>{s.adiantada}</TableCell>
                  <TableCell className="text-right" style={{ color: PONT_COLORS.atrasada }}>{s.atrasada}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {s.taxa != null ? `${s.taxa.toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {slaData.every((s) => s.total === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    Nenhuma tentativa registrada no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Fluxo de atendimento · situação atual */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
          <div>
            <h3 className="font-semibold">Fluxo de atendimento · situação atual</h3>
            <p className="text-sm text-muted-foreground">
              Retrato do momento (independe do período selecionado): leads ativos nas etapas Novo Lead, Pré-atendimento e Em Contato, por situação no cronograma de 3 tentativas (mensagem imediata, áudio em 24h, ligação em 48h).
            </p>
          </div>
          <Link to="/crm/leads" className="text-xs text-primary hover:underline whitespace-nowrap">
            Abrir painel de atendimento →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(FLUXO_ATENDIMENTO_CLASSE_INFO) as FluxoAtendimentoClasse[]).map((k) => {
            const info = FLUXO_ATENDIMENTO_CLASSE_INFO[k];
            return (
              <div key={k} className="rounded-lg border p-4">
                <Badge variant="outline" className={info.cls}>{info.emoji} {info.label}</Badge>
                <p className="text-2xl font-semibold mt-2">{fluxoSnapshot.countsByClasse[k]}</p>
                <p className="text-xs text-muted-foreground">
                  {fluxoSnapshot.total ? ((fluxoSnapshot.countsByClasse[k] / fluxoSnapshot.total) * 100).toFixed(1) : "0.0"}% de {fluxoSnapshot.total} leads ativos
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Motivos de desclassificação */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Motivos de desclassificação</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">% dos desclassificados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motivos.map((m) => (
              <TableRow key={m.motivo}>
                <TableCell>{m.motivo}</TableCell>
                <TableCell className="text-right font-medium">{m.qtd}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {desclassificados ? ((m.qtd / desclassificados) * 100).toFixed(1) : "0.0"}%
                </TableCell>
              </TableRow>
            ))}
            {motivos.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  Nenhuma desclassificação no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
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
  tone?: "success" | "danger";
  link?: string;
  hint?: string;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground";
  const content = (
    <Card className="p-4" title={hint}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{hint}</p>}
    </Card>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}
