import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGES, daysSince, slaColor, slaLabel, SOURCES } from "@/lib/leads";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Users, Clock, Calendar, AlertTriangle, Phone, MapPin } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, LineChart, Line,
} from "recharts";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--danger))", "hsl(var(--muted-foreground))"];

// Origens consideradas "campanhas / atendente virtual" — leads automáticos
const CAMPAIGN_SOURCES = new Set(["meta_ads", "google_ads", "ia_chat", "webhook", "whatsapp"]);

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [ligacoes, setLigacoes] = useState<any[]>([]);

  const monthStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(1); return d; }, []);
  const monthEnd = useMemo(() => { const d = new Date(monthStart); d.setMonth(d.getMonth() + 1); return d; }, [monthStart]);

  useEffect(() => {
    (async () => {
      const [l, r, v, c, iv, ic] = await Promise.all([
        supabase.from("leads").select("id,nome,etapa_funil,origem,ultima_interacao,created_at").order("created_at", { ascending: false }),
        supabase.from("reunioes").select("id,status,agendada_para,lead_id"),
        supabase.from("visitas").select("id,status,data_visita").gte("data_visita", monthStart.toISOString()).lt("data_visita", monthEnd.toISOString()),
        supabase.from("ligacoes").select("id,resultado,data").gte("data", monthStart.toISOString()).lt("data", monthEnd.toISOString()),
        supabase.from("interacoes").select("id,resultado,agendado_para,created_at").eq("tipo", "visita").gte("created_at", monthStart.toISOString()).lt("created_at", monthEnd.toISOString()),
        supabase.from("interacoes").select("id,resultado,agendado_para,created_at").eq("tipo", "ligacao").gte("created_at", monthStart.toISOString()).lt("created_at", monthEnd.toISOString()),
      ]);
      const vMerged = [
        ...((v.data ?? []).map((x: any) => ({ id: `v-${x.id}`, status: x.status, data_visita: x.data_visita }))),
        ...((iv.data ?? []).map((x: any) => ({ id: `iv-${x.id}`, status: null, data_visita: x.agendado_para ?? x.created_at }))),
      ];
      const cMerged = [
        ...((c.data ?? []).map((x: any) => ({ id: `c-${x.id}`, resultado: x.resultado, data: x.data }))),
        ...((ic.data ?? []).map((x: any) => ({ id: `ic-${x.id}`, resultado: x.resultado, data: x.agendado_para ?? x.created_at }))),
      ];
      setLeads(l.data ?? []); setReunioes(r.data ?? []); setVisitas(vMerged); setLigacoes(cMerged);
    })();
  }, [monthStart, monthEnd]);

  // KPIs principais: somente leads vindos de campanhas / atendente virtual
  const campaignLeads = useMemo(
    () => leads.filter(l => CAMPAIGN_SOURCES.has((l.origem || "").toLowerCase())),
    [leads]
  );
  const campaignLeadIds = useMemo(
    () => new Set(campaignLeads.map(l => l.id)),
    [campaignLeads]
  );

  const total = campaignLeads.length;
  const reunioesMesList = useMemo(
    () => reunioes.filter(m => {
      const d = new Date(m.agendada_para);
      return d >= monthStart && d < monthEnd && m.lead_id && campaignLeadIds.has(m.lead_id);
    }),
    [reunioes, monthStart, monthEnd, campaignLeadIds]
  );
  const leadsComReuniao = new Set(
    reunioesMesList
      .filter((m: any) => ["agendada", "realizada", "confirmada"].includes((m.status || "agendada").toLowerCase()))
      .map((m: any) => m.lead_id)
      .filter(Boolean)
  ).size;
  const rate = total ? Math.round((leadsComReuniao / total) * 100) : 0;
  const overdue = campaignLeads.filter(l => {
    const d = daysSince(l.ultima_interacao ?? l.created_at);
    return d !== null && d > 3 && !["Fechado", "Perdido"].includes(l.etapa_funil);
  });
  const reunioesMes = reunioesMesList.length;
  const bySource = campaignLeads.reduce<Record<string, number>>((acc, l) => { const k = l.origem || "manual"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});


  const leadsTrend = useMemo(() => {
    const days: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0,10), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), novos: 0 });
    }
    campaignLeads.forEach(l => { const k = new Date(l.created_at).toISOString().slice(0,10); const day = days.find(d => d.date === k); if (day) day.novos += 1; });
    return days;
  }, [campaignLeads]);


  const reunioesByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    reunioesMesList.forEach(m => { const s = m.status || "agendada"; counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));
  }, [reunioesMesList]);

  const callsByResult = useMemo(() => {
    const counts: Record<string, number> = {};
    ligacoes.forEach(c => { const k = c.resultado || "outro"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, total: v }));
  }, [ligacoes]);

  const callsTotal = ligacoes.length;
  const visitsTotal = visitas.length;

  const visitsTrend = useMemo(() => {
    const buckets: any[] = [];
    let weekStart = new Date(monthStart);
    let idx = 1;
    while (weekStart < monthEnd) {
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      const cap = weekEnd > monthEnd ? monthEnd : weekEnd;
      const total = visitas.filter(v => { const d = new Date(v.data_visita); return d >= weekStart && d < cap; }).length;
      buckets.push({ label: `Sem ${idx}`, total });
      weekStart = weekEnd;
      idx++;
    }
    return buckets;
  }, [visitas, monthStart, monthEnd]);

  return (
    <div className="p-4 md:p-8 pb-12 space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu funil</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Users} label="Total de leads" value={total} />
        <KPI icon={TrendingUp} label="Taxa de conversão" value={`${rate}%`} />
        <KPI icon={Calendar} label="Reuniões este mês" value={reunioesMes} />
        <KPI icon={Clock} label="Sem atendimento (3d+)" value={overdue.length} accent={overdue.length > 0} />
      </div>

      {overdue.length > 0 && (
        <Card className="p-4 md:p-6 border-danger/30 bg-danger/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <h2 className="font-display text-xl font-semibold">Leads atrasados</h2>
            <Badge variant="destructive">{overdue.length}</Badge>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 8).map(l => {
              const d = daysSince(l.ultima_interacao ?? l.created_at);
              return (
                <Link key={l.id} to={`/crm/leads/${l.id}`} className="flex items-center justify-between rounded-lg bg-card p-3 hover:shadow-soft transition">
                  <div>
                    <div className="font-medium">{l.nome}</div>
                    <div className="text-xs text-muted-foreground">{SOURCES[l.origem]?.label || l.origem}</div>
                  </div>
                  <Badge className={slaColor(d) + " border"}>{slaLabel(d)}</Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Leads — últimos 30 dias</h2>
            <p className="text-sm text-muted-foreground">Novos leads recebidos por dia</p>
          </div>
          <Badge variant="secondary"><Users className="h-3 w-3 mr-1" /> {total} totais</Badge>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={leadsTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={3} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="novos" name="Novos leads" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gLeads)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate("/crm/reunioes")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/crm/reunioes"); } }}
          className="p-4 md:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Reuniões (mês)</h2>
            <Badge variant="secondary">{reunioesMes}</Badge>
          </div>
          {reunioesMes === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">Sem reuniões.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reunioesByStatus} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {reunioesByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate("/crm/ligacoes")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/crm/ligacoes"); } }}
          className="p-4 md:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Ligações (mês)</h2>
            <Badge variant="secondary">{callsTotal}</Badge>
          </div>
          {callsTotal === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">Sem ligações.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={callsByResult} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate("/crm/visitas")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/crm/visitas"); } }}
          className="p-4 md:p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Visitas (mês)</h2>
            <Badge variant="secondary">{visitsTotal}</Badge>
          </div>
          {visitsTotal === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">Sem visitas.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitsTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 md:p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Leads por etapa</h2>
          <div className="space-y-2">
            {STAGES.map(s => {
              const count = leads.filter(l => l.etapa_funil === s.id).length;
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="text-muted-foreground">{count}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={s.color + " h-full transition-all"} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-4 md:p-6">
          <h2 className="font-display text-xl font-semibold mb-4">Origem dos leads</h2>
          <div className="space-y-3">
            {Object.entries(bySource).sort((a,b) => b[1]-a[1]).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{SOURCES[src]?.emoji}</span><span>{SOURCES[src]?.label || src}</span></div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {Object.keys(bySource).length === 0 && <p className="text-sm text-muted-foreground">Sem leads ainda.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: boolean }) {
  return (
    <Card className={"p-5 " + (accent ? "border-danger/30" : "")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-3xl font-display font-semibold mt-1">{value}</div>
        </div>
        <div className={"flex h-10 w-10 items-center justify-center rounded-lg " + (accent ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
