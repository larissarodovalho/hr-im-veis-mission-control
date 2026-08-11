import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Medal, Award, Info, Loader2 } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useRankingCorretores, selosDoRanking, type LinhaRanking } from "@/hooks/useCarteira";
import { MESES_LABELS } from "@/hooks/useReportsPeriod";

const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

function medalha(pos: number) {
  if (pos === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (pos === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (pos === 3) return <Award className="h-4 w-4 text-amber-700" />;
  return <span className="text-muted-foreground text-sm w-4 inline-block text-center">{pos}</span>;
}

function scoreCor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-primary";
  if (score >= 40) return "bg-amber-500";
  return "bg-destructive";
}

const SeloBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = {
    "Pontual": "bg-success/15 text-success border-success/30",
    "Contato firme": "bg-primary/15 text-primary border-primary/30",
    "Conversor": "bg-violet-500/15 text-violet-600 border-violet-500/30",
    "Fechador": "bg-amber-500/15 text-amber-700 border-amber-500/30",
    "Baixa devolução": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${map[s] ?? ""}`}>{s}</Badge>;
};

export default function CarteiraRanking() {
  const { isAdmin, isGestor } = useRole();
  const gestor = isAdmin || isGestor;
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState<number | null>(now.getMonth() + 1); // mês corrente por padrão

  const { inicioISO, fimISO, label } = useMemo(() => {
    if (mes == null) return { inicioISO: `${ano}-01-01T00:00:00`, fimISO: `${ano}-12-31T23:59:59`, label: `${ano}` };
    const d = daysInMonth(ano, mes);
    return { inicioISO: `${ano}-${pad(mes)}-01T00:00:00`, fimISO: `${ano}-${pad(mes)}-${pad(d)}T23:59:59`, label: `${MESES_CURTO[mes - 1]}/${ano}` };
  }, [ano, mes]);

  const { rows, loading, reload } = useRankingCorretores(inicioISO, fimISO);

  const anos = useMemo(() => {
    const cur = now.getFullYear();
    const arr: number[] = [];
    for (let y = cur - 4; y <= cur + 1; y++) arr.push(y);
    if (!arr.includes(ano)) arr.push(ano);
    return arr.sort((a, b) => b - a);
  }, [ano, now]);

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="font-semibold text-lg">Placar de corretores — {label}</h2>
              <p className="text-xs text-muted-foreground">
                Score de 0 a 100 combinando contato, pontualidade, conversão e fechamentos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs font-medium mb-1">Como o score é calculado</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    <li>35% — % contato estabelecido</li>
                    <li>20% — % 1º contato no prazo</li>
                    <li>20% — % conversão em oportunidade</li>
                    <li>15% — % fechamentos (até 30%)</li>
                    <li>10% — 100% − % devoluções</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{anos.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={mes == null ? "todos" : String(mes)} onValueChange={(v) => setMes(v === "todos" ? null : Number(v))}>
              <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Ano inteiro</SelectItem>
                {MESES_LABELS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando placar…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma conta distribuída no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead className="w-40">Score</TableHead>
                  <TableHead className="text-right">Recebidas</TableHead>
                  <TableHead className="text-right">Contato</TableHead>
                  <TableHead className="text-right">No prazo</TableHead>
                  <TableHead className="text-right">Oportunidades</TableHead>
                  <TableHead className="text-right">Fechamentos</TableHead>
                  <TableHead className="text-right">Devoluções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: LinhaRanking) => (
                  <TableRow key={r.corretor_id} className={r.posicao <= 3 ? "bg-amber-500/5" : undefined}>
                    <TableCell>{medalha(r.posicao)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{r.corretor_nome}</span>
                        <div className="flex flex-wrap gap-1">
                          {selosDoRanking(r).map((s) => <SeloBadge key={s} s={s} />)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[60px]">
                          <div className={`h-full ${scoreCor(r.score)} transition-all`} style={{ width: `${Math.max(2, r.score)}%` }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums w-10 text-right">{r.score.toFixed(0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.recebidas}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.contato_estabelecido} <span className="text-xs text-muted-foreground">({r.pct_contato.toFixed(0)}%)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.no_prazo} <span className="text-xs text-muted-foreground">({r.pct_no_prazo.toFixed(0)}%)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.oportunidades} <span className="text-xs text-muted-foreground">({r.pct_oportunidade.toFixed(0)}%)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.fechamentos}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.devolvidas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!gestor && (
          <p className="text-xs text-muted-foreground mt-3">
            O placar completo aparece quando o gestor libera a visualização. Sempre dá pra ver a sua própria posição na aba Minha Carteira.
          </p>
        )}
      </Card>
    </div>
  );
}
