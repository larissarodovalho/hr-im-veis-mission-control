import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Briefcase } from "lucide-react";
import Papa from "papaparse";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { useReportsPeriod } from "@/hooks/useReportsPeriod";
import { fmtDate } from "@/lib/datetime";

interface LinhaCorretor {
  corretor_id: string; corretor_nome: string; recebidas: number; com_tentativa: number;
  sem_tentativa: number; contato_estabelecido: number; no_prazo: number; fora_prazo: number;
  horas_medias: number | null; oportunidades: number; fechamentos: number;
  devolvidas: number; transferidas: number; ativas: number;
}
interface LinhaLote {
  lote_id: string; lote_nome: string; numero: number; corretor_nome: string; modo: string;
  status: string; criado_em: string; recebidas: number; com_tentativa: number;
  contato_estabelecido: number; no_prazo: number; oportunidades: number; fechamentos: number;
  encerradas: number;
}
interface LinhaMotivo { tipo: string; motivo: string; total: number }

const baixarCSV = (linhas: Record<string, unknown>[], nome: string) => {
  const csv = Papa.unparse(linhas);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
};

const pct = (parte: number, total: number) => (total ? `${((parte / total) * 100).toFixed(1)}%` : "—");

export default function CarteiraReport() {
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const [corretores, setCorretores] = useState<LinhaCorretor[]>([]);
  const [lotes, setLotes] = useState<LinhaLote[]>([]);
  const [motivos, setMotivos] = useState<LinhaMotivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    const args = { _inicio: inicioISO, _fim: fimISO };
    Promise.all([
      supabase.rpc("carteira_relatorio_corretores" as any, args),
      supabase.rpc("carteira_relatorio_lotes" as any, args),
      supabase.rpc("carteira_relatorio_motivos" as any, args),
    ]).then(([c, l, m]) => {
      if (!vivo) return;
      setCorretores(((c.data ?? []) as unknown) as LinhaCorretor[]);
      setLotes(((l.data ?? []) as unknown) as LinhaLote[]);
      setMotivos(((m.data ?? []) as unknown) as LinhaMotivo[]);
      setLoading(false);
    });
    return () => { vivo = false; };
  }, [inicioISO, fimISO]);

  const kpis = useMemo(() => {
    const soma = (f: (r: LinhaCorretor) => number) => corretores.reduce((t, r) => t + (f(r) || 0), 0);
    const recebidas = soma((r) => r.recebidas);
    const comTentativa = soma((r) => r.com_tentativa);
    const horas = corretores.filter((r) => r.horas_medias != null);
    return {
      recebidas,
      noPrazo: soma((r) => r.no_prazo),
      foraPrazo: soma((r) => r.fora_prazo),
      semTentativa: soma((r) => r.sem_tentativa),
      contato: soma((r) => r.contato_estabelecido),
      oportunidades: soma((r) => r.oportunidades),
      fechamentos: soma((r) => r.fechamentos),
      devolvidas: soma((r) => r.devolvidas),
      transferidas: soma((r) => r.transferidas),
      comTentativa,
      horasMedias: horas.length
        ? (horas.reduce((t, r) => t + Number(r.horas_medias), 0) / horas.length).toFixed(1)
        : null,
    };
  }, [corretores]);

  const funil = useMemo(() => ([
    { etapa: "Recebidas", valor: kpis.recebidas },
    { etapa: "Com tentativa", valor: kpis.comTentativa },
    { etapa: "Contato feito", valor: kpis.contato },
    { etapa: "Oportunidade", valor: kpis.oportunidades },
    { etapa: "Negócio fechado", valor: kpis.fechamentos },
  ]), [kpis]);

  if (loading) return <Card className="p-6 text-muted-foreground">Carregando relatório da carteira…</Card>;

  if (!kpis.recebidas && !lotes.length) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Nenhuma distribuição de carteira registrada em {label}.
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          { l: "Contas distribuídas", v: kpis.recebidas },
          { l: "1º contato no prazo", v: `${kpis.noPrazo} (${pct(kpis.noPrazo, kpis.recebidas)})` },
          { l: "1º contato fora do prazo", v: kpis.foraPrazo, alerta: kpis.foraPrazo > 0 },
          { l: "Sem nenhuma tentativa", v: kpis.semTentativa, alerta: kpis.semTentativa > 0 },
          { l: "Tempo médio até o 1º contato", v: kpis.horasMedias ? `${kpis.horasMedias}h` : "—" },
          { l: "Contato estabelecido", v: kpis.contato },
          { l: "Viraram oportunidade", v: kpis.oportunidades },
          { l: "Negócios fechados", v: kpis.fechamentos },
          { l: "Devolvidas", v: kpis.devolvidas },
          { l: "Transferidas", v: kpis.transferidas },
        ].map((k) => (
          <Card key={k.l} className="p-3">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className={`text-xl font-semibold ${k.alerta ? "text-destructive" : ""}`}>{k.v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 md:p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Funil da carteira — {label}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={funil}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="etapa" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {funil.map((_, i) => (
                <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.15})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold">Desempenho por corretor</h3>
          <Button variant="outline" size="sm" disabled={!corretores.length}
            onClick={() => baixarCSV(
              corretores.map((r) => ({
                Corretor: r.corretor_nome, Recebidas: r.recebidas, "Com tentativa": r.com_tentativa,
                "Sem tentativa": r.sem_tentativa, "Contato estabelecido": r.contato_estabelecido,
                "No prazo": r.no_prazo, "Fora do prazo": r.fora_prazo,
                "% no prazo": pct(r.no_prazo, r.recebidas),
                "Horas médias 1º contato": r.horas_medias ?? "", Oportunidades: r.oportunidades,
                "Negócios fechados": r.fechamentos, Devolvidas: r.devolvidas,
                Transferidas: r.transferidas, "Ativas hoje": r.ativas,
              })),
              `carteira-corretores-${label.replace("/", "-")}.csv`
            )}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead><TableHead>Recebidas</TableHead><TableHead>Tentativas</TableHead>
                <TableHead>Sem tentativa</TableHead><TableHead>Contato feito</TableHead>
                <TableHead>% no prazo</TableHead><TableHead>Tempo médio</TableHead>
                <TableHead>Oportunidades</TableHead><TableHead>Fechados</TableHead>
                <TableHead>Devolvidas</TableHead><TableHead>Transferidas</TableHead><TableHead>Ativas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corretores.map((r) => (
                <TableRow key={r.corretor_id}>
                  <TableCell className="font-medium">{r.corretor_nome}</TableCell>
                  <TableCell>{r.recebidas}</TableCell>
                  <TableCell>{r.com_tentativa}</TableCell>
                  <TableCell className={r.sem_tentativa > 0 ? "text-destructive" : ""}>{r.sem_tentativa}</TableCell>
                  <TableCell>{r.contato_estabelecido}</TableCell>
                  <TableCell>{pct(r.no_prazo, r.recebidas)}</TableCell>
                  <TableCell>{r.horas_medias != null ? `${r.horas_medias}h` : "—"}</TableCell>
                  <TableCell>{r.oportunidades}</TableCell>
                  <TableCell>{r.fechamentos}</TableCell>
                  <TableCell>{r.devolvidas}</TableCell>
                  <TableCell>{r.transferidas}</TableCell>
                  <TableCell>{r.ativas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="font-semibold">Desempenho por lote</h3>
          <Button variant="outline" size="sm" disabled={!lotes.length}
            onClick={() => baixarCSV(
              lotes.map((r) => ({
                Lote: r.lote_nome, Corretor: r.corretor_nome, Modo: r.modo, Situação: r.status,
                "Criado em": fmtDate(r.criado_em), Recebidas: r.recebidas, "Com tentativa": r.com_tentativa,
                "Contato estabelecido": r.contato_estabelecido, "No prazo": r.no_prazo,
                Oportunidades: r.oportunidades, "Negócios fechados": r.fechamentos, Encerradas: r.encerradas,
              })),
              `carteira-lotes-${label.replace("/", "-")}.csv`
            )}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead><TableHead>Corretor</TableHead><TableHead>Modo</TableHead>
                <TableHead>Situação</TableHead><TableHead>Criado em</TableHead><TableHead>Recebidas</TableHead>
                <TableHead>Com tentativa</TableHead><TableHead>Contato feito</TableHead>
                <TableHead>No prazo</TableHead><TableHead>Oportunidades</TableHead>
                <TableHead>Fechados</TableHead><TableHead>Encerradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotes.map((r) => (
                <TableRow key={r.lote_id}>
                  <TableCell className="font-medium">{r.lote_nome}</TableCell>
                  <TableCell>{r.corretor_nome}</TableCell>
                  <TableCell className="text-xs">{r.modo}</TableCell>
                  <TableCell><Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(r.criado_em)}</TableCell>
                  <TableCell>{r.recebidas}</TableCell>
                  <TableCell>{r.com_tentativa}</TableCell>
                  <TableCell>{r.contato_estabelecido}</TableCell>
                  <TableCell>{r.no_prazo}</TableCell>
                  <TableCell>{r.oportunidades}</TableCell>
                  <TableCell>{r.fechamentos}</TableCell>
                  <TableCell>{r.encerradas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h3 className="font-semibold mb-3">Motivos de devolução e transferência</h3>
        {motivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma devolução ou transferência no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tipo</TableHead><TableHead>Motivo</TableHead><TableHead>Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {motivos.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{m.tipo.replace("solicitacao_", "solicitação de ")}</TableCell>
                  <TableCell>{m.motivo}</TableCell>
                  <TableCell>{m.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
