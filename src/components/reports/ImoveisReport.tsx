import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Home as HomeIcon, Handshake, Target, TrendingUp } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { ESTAGIOS_CAPTACAO } from "@/lib/captacaoFunil";
import Papa from "papaparse";
import { toast } from "sonner";

const FAIXAS = [
  { label: "Até R$ 500 mil", min: 0, max: 500_000 },
  { label: "R$ 500 mil – 1 mi", min: 500_000, max: 1_000_000 },
  { label: "R$ 1 mi – 2 mi", min: 1_000_000, max: 2_000_000 },
  { label: "R$ 2 mi – 5 mi", min: 2_000_000, max: 5_000_000 },
  { label: "Acima de R$ 5 mi", min: 5_000_000, max: Infinity },
];

const OPP_ESTAGIOS = [
  { key: "nova", label: "Nova" },
  { key: "buscando", label: "Buscando" },
  { key: "visita", label: "Visita" },
  { key: "proposta", label: "Proposta" },
  { key: "ganha", label: "Ganha" },
  { key: "perdida", label: "Perdida" },
];

const PIE_COLORS = ["#6366f1", "#3b82f6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

const lower = (s: string | null | undefined) => (s || "").toLowerCase();

export default function ImoveisReport() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [captacoes, setCaptacoes] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filtros
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [cidade, setCidade] = useState("all");
  const [finalidade, setFinalidade] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [im, pr, op, ca, pa, pf] = await Promise.all([
        supabase.from("imoveis").select("*"),
        supabase.from("propostas").select("id, imovel_id, status, valor, created_at"),
        supabase.from("oportunidades").select("id, estagio, valor_alvo, created_at"),
        supabase.from("captacoes_imovel").select("id, estagio, created_at, updated_at"),
        supabase.from("corretores_parceiros").select("id, nome, ativo, cidade, estado"),
        supabase.from("profiles").select("user_id, nome"),
      ]);
      setImoveis(im.data ?? []);
      setPropostas(pr.data ?? []);
      setOportunidades(op.data ?? []);
      setCaptacoes(ca.data ?? []);
      setParceiros(pa.data ?? []);
      const pm: Record<string, string> = {};
      (pf.data ?? []).forEach((p: any) => { if (p.user_id) pm[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(pm);
      setLoading(false);
    })();
  }, []);

  // Cidades disponíveis
  const cidades = useMemo(() => {
    const s = new Set<string>();
    imoveis.forEach((i) => { if (i.cidade) s.add(i.cidade); });
    return [...s].sort();
  }, [imoveis]);

  const inPeriod = (created: string) => {
    if (dataIni && created < dataIni) return false;
    if (dataFim && created > `${dataFim}T23:59:59`) return false;
    return true;
  };

  const imoveisF = useMemo(() => imoveis.filter((i) => {
    if (!inPeriod(i.created_at)) return false;
    if (cidade !== "all" && i.cidade !== cidade) return false;
    if (finalidade !== "all" && lower(i.finalidade) !== lower(finalidade)) return false;
    return true;
  }), [imoveis, dataIni, dataFim, cidade, finalidade]);

  const imovelIds = useMemo(() => new Set(imoveisF.map((i) => i.id)), [imoveisF]);
  const propostasF = useMemo(
    () => propostas.filter((p) => imovelIds.has(p.imovel_id)),
    [propostas, imovelIds]
  );

  // Status derivado por imóvel
  const propByImovel = useMemo(() => {
    const m: Record<string, any[]> = {};
    propostasF.forEach((p) => { (m[p.imovel_id] ||= []).push(p); });
    return m;
  }, [propostasF]);

  const stageOf = (i: any) => {
    if (lower(i.status) === "vendido") return "vendido";
    const ps = propByImovel[i.id] || [];
    if (ps.some((p) => lower(p.status) === "aceita")) return "fechamento";
    if (ps.some((p) => ["em análise", "em analise"].includes(lower(p.status)))) return "proposta";
    return "disponivel";
  };

  const buckets = useMemo(() => {
    const b = { disponivel: [] as any[], proposta: [] as any[], fechamento: [] as any[], vendido: [] as any[] };
    imoveisF.forEach((i) => { (b as any)[stageOf(i)].push(i); });
    return b;
  }, [imoveisF, propByImovel]);

  const sum = (arr: any[], k = "valor") => arr.reduce((s, i) => s + Number(i[k] || 0), 0);

  const kpis = useMemo(() => ({
    total: imoveisF.length,
    disponiveis: buckets.disponivel.length,
    proposta: buckets.proposta.length,
    fechamento: buckets.fechamento.length,
    vendidos: buckets.vendido.length,
    vgvDisponivel: sum(buckets.disponivel),
    vgvVendido: sum(buckets.vendido),
    ticketMedioVendido: buckets.vendido.length ? sum(buckets.vendido) / buckets.vendido.length : 0,
  }), [imoveisF, buckets]);

  // Distribuição por faixa (apenas disponíveis)
  const faixasData = useMemo(() => FAIXAS.map((f) => ({
    name: f.label,
    qtd: buckets.disponivel.filter((i) => {
      const v = Number(i.valor || 0);
      return v >= f.min && v < f.max;
    }).length,
  })), [buckets.disponivel]);

  // Por tipo
  const porTipoData = useMemo(() => {
    const m = new Map<string, { tipo: string; qtd: number; vgv: number }>();
    imoveisF.forEach((i) => {
      const t = i.tipo || "—";
      const cur = m.get(t) || { tipo: t, qtd: 0, vgv: 0 };
      cur.qtd++;
      cur.vgv += Number(i.valor || 0);
      m.set(t, cur);
    });
    return [...m.values()].map((r) => ({ ...r, media: r.qtd ? r.vgv / r.qtd : 0 }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [imoveisF]);

  // Oportunidades
  const opF = useMemo(() => oportunidades.filter((o) => inPeriod(o.created_at)), [oportunidades, dataIni, dataFim]);
  const opData = useMemo(() => OPP_ESTAGIOS.map((e) => ({
    name: e.label,
    qtd: opF.filter((o) => o.estagio === e.key).length,
  })), [opF]);
  const opKpis = useMemo(() => {
    const ativas = opF.filter((o) => !["ganha", "perdida"].includes(o.estagio));
    const ganhas = opF.filter((o) => o.estagio === "ganha").length;
    const fechadas = opF.filter((o) => ["ganha", "perdida"].includes(o.estagio)).length;
    const valor = opF.reduce((s, o) => s + Number(o.valor_alvo || 0), 0);
    return {
      total: opF.length,
      ativas: ativas.length,
      ganhas,
      conversao: fechadas ? (ganhas / fechadas) * 100 : 0,
      valor,
      ticket: opF.length ? valor / opF.length : 0,
    };
  }, [opF]);

  // Captação
  const capF = useMemo(() => captacoes.filter((c) => inPeriod(c.created_at)), [captacoes, dataIni, dataFim]);
  const capData = useMemo(() => ESTAGIOS_CAPTACAO.map((e) => ({
    name: e.label,
    qtd: capF.filter((c) => c.estagio === e.id).length,
  })), [capF]);
  const capKpis = useMemo(() => {
    const concluidas = capF.filter((c) => c.estagio === "concluido");
    const dias = concluidas.map((c) =>
      (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / 86400000
    );
    const tempoMedio = dias.length ? dias.reduce((s, n) => s + n, 0) / dias.length : 0;
    return {
      total: capF.length,
      concluidas: concluidas.length,
      conclusao: capF.length ? (concluidas.length / capF.length) * 100 : 0,
      tempoMedio,
    };
  }, [capF]);

  // Parceiros
  const parceirosAtivos = parceiros.filter((p) => p.ativo).length;
  const topParceiros = useMemo(() => {
    const count = new Map<string, number>();
    imoveisF.forEach((i) => {
      if (i.corretor_parceiro_id) count.set(i.corretor_parceiro_id, (count.get(i.corretor_parceiro_id) || 0) + 1);
    });
    return parceiros
      .map((p) => ({ ...p, qtd: count.get(p.id) || 0 }))
      .filter((p) => p.qtd > 0)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10);
  }, [imoveisF, parceiros]);

  // Top captadores internos
  const topCaptadores = useMemo(() => {
    const count = new Map<string, number>();
    imoveisF.forEach((i) => {
      const id = i.corretor_captador_id || i.corretor_id;
      if (id) count.set(id, (count.get(id) || 0) + 1);
    });
    return [...count.entries()]
      .map(([id, qtd]) => ({ id, nome: profiles[id] || "—", qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10);
  }, [imoveisF, profiles]);

  const exportCsv = () => {
    const rows: any[] = [];
    rows.push({ secao: "KPIs", metrica: "Total imóveis", valor: kpis.total });
    rows.push({ secao: "KPIs", metrica: "Disponíveis", valor: kpis.disponiveis });
    rows.push({ secao: "KPIs", metrica: "Em proposta", valor: kpis.proposta });
    rows.push({ secao: "KPIs", metrica: "Em fechamento", valor: kpis.fechamento });
    rows.push({ secao: "KPIs", metrica: "Vendidos", valor: kpis.vendidos });
    rows.push({ secao: "KPIs", metrica: "VGV disponível", valor: kpis.vgvDisponivel });
    rows.push({ secao: "KPIs", metrica: "VGV vendido", valor: kpis.vgvVendido });
    rows.push({ secao: "KPIs", metrica: "Ticket médio vendido", valor: kpis.ticketMedioVendido });
    faixasData.forEach((f) => rows.push({ secao: "Faixa de valor", metrica: f.name, valor: f.qtd }));
    porTipoData.forEach((t) => rows.push({ secao: "Por tipo", metrica: t.tipo, valor: t.qtd, vgv: t.vgv, media: t.media }));
    opData.forEach((o) => rows.push({ secao: "Oportunidades", metrica: o.name, valor: o.qtd }));
    rows.push({ secao: "Oportunidades", metrica: "Conversão (%)", valor: opKpis.conversao.toFixed(1) });
    capData.forEach((c) => rows.push({ secao: "Captação", metrica: c.name, valor: c.qtd }));
    rows.push({ secao: "Captação", metrica: "Tempo médio (dias)", valor: capKpis.tempoMedio.toFixed(1) });
    topParceiros.forEach((p) => rows.push({ secao: "Top parceiros", metrica: p.nome, valor: p.qtd }));
    topCaptadores.forEach((c) => rows.push({ secao: "Top captadores", metrica: c.nome, valor: c.qtd }));

    const csv = Papa.unparse(rows);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-imoveis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="min-w-0">
            <Label>De</Label>
            <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} className="w-full" />
          </div>
          <div className="min-w-0">
            <Label>Até</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full" />
          </div>
          <div className="min-w-0">
            <Label>Cidade</Label>
            <Select value={cidade} onValueChange={setCidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {cidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0">
            <Label>Finalidade</Label>
            <Select value={finalidade} onValueChange={setFinalidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportCsv} className="w-full sm:col-span-2 md:col-span-1"><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button>
        </div>
      </Card>


      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<HomeIcon className="h-4 w-4" />} label="Total" value={kpis.total} />
        <Kpi label="Disponíveis" value={kpis.disponiveis} />
        <Kpi label="Em proposta" value={kpis.proposta} />
        <Kpi label="Em fechamento" value={kpis.fechamento} />
        <Kpi label="Vendidos" value={kpis.vendidos} />
        <Kpi label="VGV disponível" value={formatBRL(kpis.vgvDisponivel)} small />
        <Kpi label="VGV vendido" value={formatBRL(kpis.vgvVendido)} small />
        <Kpi label="Ticket médio vendido" value={formatBRL(kpis.ticketMedioVendido)} small />
      </div>

      {/* Faixa de valor */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Distribuição por faixa de valor (disponíveis)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={faixasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="qtd" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Por tipo */}
      <Card className="p-3 sm:p-4">
        <h3 className="font-semibold mb-3">Por tipo de imóvel</h3>
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Valor médio</TableHead>
              <TableHead className="text-right">VGV</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {porTipoData.map((t) => (
                <TableRow key={t.tipo}>
                  <TableCell className="whitespace-nowrap">{t.tipo}</TableCell>
                  <TableCell className="text-right">{t.qtd}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatBRL(t.media)}</TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">{formatBRL(t.vgv)}</TableCell>
                </TableRow>
              ))}
              {porTipoData.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>


      {/* Oportunidades */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Oportunidades de Negócio</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total" value={opKpis.total} />
          <Kpi label="Ativas" value={opKpis.ativas} />
          <Kpi label="Valor total" value={formatBRL(opKpis.valor)} small />
          <Kpi label="Taxa conversão" value={`${opKpis.conversao.toFixed(1)}%`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={opData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={opData.filter((d) => d.qtd > 0)} dataKey="qtd" nameKey="name" outerRadius={90} label>
                {opData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Captação */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Captação de Imóveis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total" value={capKpis.total} />
          <Kpi label="Concluídas" value={capKpis.concluidas} />
          <Kpi label="Taxa conclusão" value={`${capKpis.conclusao.toFixed(1)}%`} />
          <Kpi label="Tempo médio (dias)" value={capKpis.tempoMedio.toFixed(1)} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={capData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="qtd" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Parceiros e captadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Handshake className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Corretores Parceiros</h3>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {parceiros.length} cadastrados · {parceirosAtivos} ativos
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Parceiro</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Imóveis</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {topParceiros.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.cidade || "—"}{p.estado ? `/${p.estado}` : ""}</TableCell>
                  <TableCell className="text-right font-semibold">{p.qtd}</TableCell>
                </TableRow>
              ))}
              {topParceiros.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem imóveis captados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Top captadores internos</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Corretor</TableHead>
              <TableHead className="text-right">Imóveis captados</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {topCaptadores.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell className="text-right font-semibold">{c.qtd}</TableCell>
                </TableRow>
              ))}
              {topCaptadores.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, small, icon }: { label: string; value: any; small?: boolean; icon?: React.ReactNode }) {
  return (
    <Card className="p-3 min-w-0">
      <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0"><span className="shrink-0">{icon}</span><span className="truncate">{label}</span></div>
      <div className={`font-semibold mt-1 break-words ${small ? "text-sm sm:text-base" : "text-lg sm:text-xl md:text-2xl"}`}>{value}</div>
    </Card>
  );
}
