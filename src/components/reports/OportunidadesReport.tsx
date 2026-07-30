import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { HandCoins, ListChecks, CalendarCheck, FileText, Trophy, XCircle, Link2, Percent } from "lucide-react";
import { ESTAGIOS, estagioLabel, isEstagioFinal } from "@/lib/oportunidadesFunil";
import { formatBRL } from "@/lib/format";

const PIE_COLORS = ["hsl(var(--chart-1, 220 70% 50%))", "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 65% 60%))", "hsl(var(--chart-5, 340 75% 55%))"];

const Kpi = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-xs"><Icon className="h-4 w-4" />{label}</div>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </Card>
);

/** Relatório do funil de Oportunidades de Negócio (etapa final da cadeia comercial). */
export default function OportunidadesReport({ inicioISO, fimISO }: { inicioISO: string; fimISO: string }) {
  const [ops, setOps] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [contas, setContas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data: o } = await supabase.from("oportunidades").select("*");
      const all = (o ?? []) as any[];
      const ids = all.map((x) => x.id);
      const contaIds = [...new Set(all.map((x) => x.conta_id).filter(Boolean))] as string[];
      const [v, p, f, prof, c] = await Promise.all([
        ids.length ? supabase.from("oportunidade_visitas").select("*").in("oportunidade_id", ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from("oportunidade_propostas").select("*").in("oportunidade_id", ids) : Promise.resolve({ data: [] as any[] }),
        supabase.from("conta_fechamentos").select("*").not("oportunidade_id", "is", null),
        supabase.from("profiles").select("user_id,nome"),
        contaIds.length ? supabase.from("contas").select("id,nome,categoria").in("id", contaIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      setOps(all);
      setVisitas((v.data ?? []) as any[]);
      setPropostas((p.data ?? []) as any[]);
      setFechamentos((f.data ?? []) as any[]);
      const pm: Record<string, string> = {};
      (prof.data ?? []).forEach((x: any) => { if (x.user_id) pm[x.user_id] = x.nome || "—"; });
      setProfiles(pm);
      const cm: Record<string, any> = {};
      (c.data ?? []).forEach((x: any) => { cm[x.id] = x; });
      setContas(cm);
      setLoading(false);
    };
    run();
  }, []);

  const noPeriodo = (iso?: string | null) => !!iso && iso >= inicioISO && iso <= fimISO;

  const d = useMemo(() => {
    const novas = ops.filter((o) => noPeriodo(o.created_at));
    const total = ops.length;
    const ativas = ops.filter((o) => !isEstagioFinal(o.estagio)).length;
    const ganhas = ops.filter((o) => o.estagio === "ganha");
    const perdidas = ops.filter((o) => o.estagio === "perdida");
    const ganhasPeriodo = ganhas.filter((o) => noPeriodo(o.encerrada_em));
    const perdidasPeriodo = perdidas.filter((o) => noPeriodo(o.encerrada_em));
    const visitasPeriodo = visitas.filter((v) => noPeriodo(v.data_visita)).length;
    const propostasPeriodo = propostas.filter((p) => noPeriodo(p.created_at)).length;
    const valorGanho = ganhasPeriodo.reduce((s, o) => s + (o.valor_final ?? 0), 0);
    const fechPeriodo = fechamentos.filter((f) => noPeriodo(f.data_fechamento));

    const porEstagio = ESTAGIOS.map((e) => ({
      name: e.label,
      total: ops.filter((o) => (o.estagio ?? "nova") === e.key).length,
    }));

    const catCount: Record<string, number> = {};
    ops.forEach((o) => {
      const cat = o.categoria_origem ?? (o.conta_id ? contas[o.conta_id]?.categoria : null) ?? "Sem categoria";
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    });
    const porCategoria = Object.entries(catCount).map(([name, value]) => ({ name, value }));

    const motivosCount: Record<string, number> = {};
    perdidas.forEach((o) => {
      const m = o.motivo_perda ?? "Não informado";
      motivosCount[m] = (motivosCount[m] ?? 0) + 1;
    });
    const motivosPerda = Object.entries(motivosCount).map(([motivo, qtd]) => ({ motivo, qtd })).sort((a, b) => b.qtd - a.qtd);

    const corretorAgg: Record<string, any> = {};
    ops.forEach((o) => {
      const id = o.corretor_id ?? "sem-responsavel";
      corretorAgg[id] = corretorAgg[id] ?? { ativas: 0, ganhas: 0, perdidas: 0, valor: 0 };
      if (!isEstagioFinal(o.estagio)) corretorAgg[id].ativas++;
      if (o.estagio === "ganha") { corretorAgg[id].ganhas++; corretorAgg[id].valor += o.valor_final ?? 0; }
      if (o.estagio === "perdida") corretorAgg[id].perdidas++;
    });
    const porCorretor = Object.entries(corretorAgg).map(([id, v]) => ({
      nome: id === "sem-responsavel" ? "Sem responsável" : profiles[id] ?? "—",
      ...v,
      conversao: v.ganhas + v.perdidas > 0 ? Math.round((v.ganhas / (v.ganhas + v.perdidas)) * 100) : null,
    })).sort((a, b) => b.valor - a.valor);

    return {
      total, ativas, novas: novas.length, ganhasPeriodo: ganhasPeriodo.length, perdidasPeriodo: perdidasPeriodo.length,
      visitasPeriodo, propostasPeriodo, valorGanho, porEstagio, porCategoria, motivosPerda, porCorretor,
      fechPeriodo,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops, visitas, propostas, fechamentos, profiles, contas, inicioISO, fimISO]);

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando relatório…</p>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={HandCoins} label="Oportunidades no período" value={d.novas} sub={`${d.total} no total · ${d.ativas} ativas`} />
        <Kpi icon={CalendarCheck} label="Visitas no período" value={d.visitasPeriodo} />
        <Kpi icon={FileText} label="Propostas no período" value={d.propostasPeriodo} />
        <Kpi icon={Percent} label="Conversão (finalizadas)" value={d.ganhasPeriodo + d.perdidasPeriodo > 0 ? `${Math.round((d.ganhasPeriodo / (d.ganhasPeriodo + d.perdidasPeriodo)) * 100)}%` : "—"} sub={`${d.ganhasPeriodo} ganhas · ${d.perdidasPeriodo} perdidas`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Funil */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Funil de oportunidades</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.porEstagio}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Categoria */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-3">Carteira x Marketing</p>
          {d.porCategoria.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={d.porCategoria} dataKey="value" nameKey="name" outerRadius={85} label={(e: any) => `${e.name}: ${e.value}`}>
                  {d.porCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Sem dados</p>}
        </Card>
      </div>

      {/* Performance por corretor */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Performance por corretor</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Corretor</TableHead>
              <TableHead className="text-right">Ativas</TableHead>
              <TableHead className="text-right">Ganhas</TableHead>
              <TableHead className="text-right">Perdidas</TableHead>
              <TableHead className="text-right">Conversão</TableHead>
              <TableHead className="text-right">Valor fechado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.porCorretor.map((c) => (
              <TableRow key={c.nome}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-right">{c.ativas}</TableCell>
                <TableCell className="text-right text-emerald-600">{c.ganhas}</TableCell>
                <TableCell className="text-right text-zinc-500">{c.perdidas}</TableCell>
                <TableCell className="text-right">{c.conversao != null ? `${c.conversao}%` : "—"}</TableCell>
                <TableCell className="text-right">{formatBRL(c.valor)}</TableCell>
              </TableRow>
            ))}
            {d.porCorretor.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Motivos de perda */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2"><XCircle className="h-4 w-4" /> Motivos de perda</p>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Motivo</TableHead><TableHead className="text-right">Qtd</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {d.motivosPerda.map((m) => (
                <TableRow key={m.motivo}><TableCell>{m.motivo}</TableCell><TableCell className="text-right">{m.qtd}</TableCell></TableRow>
              ))}
              {d.motivosPerda.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhuma perda registrada</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>

        {/* Fechamentos vinculados */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2"><Trophy className="h-4 w-4" /> Fechamentos vinculados no período</p>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Data</TableHead><TableHead>Conta</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {d.fechPeriodo.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.data_fechamento}</TableCell>
                  <TableCell className="flex items-center gap-1"><Link2 className="h-3 w-3 text-muted-foreground" />{contas[f.conta_id]?.nome ?? "—"}</TableCell>
                  <TableCell className="text-right">{f.valor != null ? formatBRL(f.valor) : "—"}</TableCell>
                </TableRow>
              ))}
              {d.fechPeriodo.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum fechamento vinculado no período</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Resumo por etapa */}
      <Card className="p-4">
        <p className="text-sm font-medium mb-3">Resumo por etapa</p>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Etapa</TableHead><TableHead className="text-right">Oportunidades</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {d.porEstagio.map((e, i) => (
              <TableRow key={e.name}>
                <TableCell>{estagioLabel(ESTAGIOS[i].key)}</TableCell>
                <TableCell className="text-right">{e.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
