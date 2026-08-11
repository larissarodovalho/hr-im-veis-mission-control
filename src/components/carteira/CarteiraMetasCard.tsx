import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Target, Save } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { MESES_LABELS } from "@/hooks/useReportsPeriod";
import {
  useCorretores, useCarteiraMetas, useRankingCorretores, salvarMetaCorretor, type CarteiraMeta,
} from "@/hooks/useCarteira";

const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
function pad(n: number) { return String(n).padStart(2, "0"); }
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

function Barra({ valor, meta }: { valor: number; meta: number }) {
  const pct = meta > 0 ? Math.min(100, (valor / meta) * 100) : valor > 0 ? 100 : 0;
  const cor = meta > 0 ? (pct >= 100 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-amber-500") : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[50px]">
        <div className={`h-full ${cor}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="text-xs tabular-nums w-16 text-right">{valor}{meta > 0 ? `/${meta}` : ""}</span>
    </div>
  );
}

export default function CarteiraMetasCard() {
  const { isAdmin, isGestor } = useRole();
  const gestor = isAdmin || isGestor;
  const { corretores } = useCorretores();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState<number | null>(now.getMonth() + 1);
  const anoMes = useMemo(() => `${ano}-${pad(mes ?? 1)}`, [ano, mes]);

  const { inicioISO, fimISO } = useMemo(() => {
    if (mes == null) return { inicioISO: `${ano}-01-01T00:00:00`, fimISO: `${ano}-12-31T23:59:59` };
    const d = daysInMonth(ano, mes);
    return { inicioISO: `${ano}-${pad(mes)}-01T00:00:00`, fimISO: `${ano}-${pad(mes)}-${pad(d)}T23:59:59` };
  }, [ano, mes]);

  const { rows: metas, loading: loadingMetas, reload: reloadMetas } = useCarteiraMetas(anoMes);
  const { rows: ranking, loading: loadingRank } = useRankingCorretores(inicioISO, fimISO);

  const [draft, setDraft] = useState<Record<string, { c: number; o: number; f: number }>>({0: 0} as any);
  const [salvando, setSalvando] = useState<string | null>(null);

  // sincroniza draft com metas carregadas
  useEffect(() => {
    const d: Record<string, { c: number; o: number; f: number }> = {};
    metas.forEach((m: CarteiraMeta) => { d[m.corretor_id] = { c: m.meta_contatos, o: m.meta_oportunidades, f: m.meta_fechamentos }; });
    setDraft(d);
  }, [metas]);

  const rankMap = useMemo(() => {
    const m = new Map<string, { contato: number; op: number; fech: number }>();
    ranking.forEach((r) => m.set(r.corretor_id, { contato: r.contato_estabelecido, op: r.oportunidades, fech: r.fechamentos }));
    return m;
  }, [ranking]);

  const anos = useMemo(() => {
    const cur = now.getFullYear();
    const arr: number[] = [];
    for (let y = cur - 2; y <= cur + 1; y++) arr.push(y);
    return arr.sort((a, b) => b - a);
  }, [now]);

  const salvar = async (corretorId: string) => {
    const d = draft[corretorId] ?? { c: 0, o: 0, f: 0 };
    setSalvando(corretorId);
    try {
      await salvarMetaCorretor(corretorId, anoMes, d.c || 0, d.o || 0, d.f || 0);
      toast.success("Meta salva");
      reloadMetas();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar meta");
    } finally {
      setSalvando(null);
    }
  };

  if (!gestor) return null;

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">Metas mensais por corretor</h2>
            <p className="text-xs text-muted-foreground">Defina contatos, oportunidades e fechamentos esperados para acompanhar o progresso.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {(loadingMetas || loadingRank) ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p>
      ) : corretores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum corretor cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead className="w-44">Contatos estabelecidos</TableHead>
                <TableHead className="w-44">Oportunidades geradas</TableHead>
                <TableHead className="w-44">Negócios fechados</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corretores.map((c) => {
                const d = draft[c.user_id] ?? { c: 0, o: 0, f: 0 };
                const r = rankMap.get(c.user_id);
                return (
                  <TableRow key={c.user_id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Barra valor={r?.contato ?? 0} meta={d.c} />
                        <Input type="number" min={0} className="h-7 text-xs" placeholder="Meta"
                          value={d.c} onChange={(e) => setDraft({ ...draft, [c.user_id]: { ...d, c: Number(e.target.value) } })} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Barra valor={r?.op ?? 0} meta={d.o} />
                        <Input type="number" min={0} className="h-7 text-xs" placeholder="Meta"
                          value={d.o} onChange={(e) => setDraft({ ...draft, [c.user_id]: { ...d, o: Number(e.target.value) } })} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Barra valor={r?.fech ?? 0} meta={d.f} />
                        <Input type="number" min={0} className="h-7 text-xs" placeholder="Meta"
                          value={d.f} onChange={(e) => setDraft({ ...draft, [c.user_id]: { ...d, f: Number(e.target.value) } })} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => salvar(c.user_id)} disabled={salvando === c.user_id}>
                        {salvando === c.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
