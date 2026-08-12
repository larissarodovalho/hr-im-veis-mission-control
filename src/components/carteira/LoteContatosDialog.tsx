import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Loader2 } from "lucide-react";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { situacaoAtribuicao, type AtribuicaoCarteira, type SituacaoCarteira } from "@/hooks/useCarteira";

const SITUACOES: { id: SituacaoCarteira | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "pendente", label: "1º contato pendente" },
  { id: "atrasada", label: "Atrasadas" },
  { id: "em_atendimento", label: "Em atendimento" },
  { id: "estabelecido", label: "Contato feito" },
  { id: "encerrada", label: "Encerradas" },
];

const LABEL: Record<SituacaoCarteira, string> = {
  pendente: "1º contato pendente",
  atrasada: "Atrasada",
  em_atendimento: "Em atendimento",
  estabelecido: "Contato feito",
  encerrada: "Encerrada",
};

interface Props {
  loteId: string | null;
  loteNome?: string | null;
  corretorId?: string | null;
  corretorNome?: string | null;
  onClose: () => void;
}

export default function LoteContatosDialog({ loteId, loteNome, corretorId, corretorNome, onClose }: Props) {
  const [rows, setRows] = useState<AtribuicaoCarteira[]>([]);
  const [loading, setLoading] = useState(false);
  const [situacao, setSituacao] = useState<SituacaoCarteira | "todas">("todas");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!loteId) { setRows([]); return; }
    setSituacao("todas");
    setBusca("");
    let cancel = false;
    setLoading(true);
    supabase.rpc("carteira_minha_carteira" as any, { _corretor: corretorId || null }).then(({ data }) => {
      if (cancel) return;
      const all = ((data ?? []) as unknown) as AtribuicaoCarteira[];
      setRows(all.filter((a) => a.lote_id === loteId));
      setLoading(false);
    });
    return () => { cancel = true; };
  }, [loteId, corretorId]);

  const contagens = useMemo(() => {
    const c: Record<string, number> = { todas: rows.length };
    rows.forEach((a) => { const s = situacaoAtribuicao(a); c[s] = (c[s] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return rows.filter((a) => {
      if (situacao !== "todas" && situacaoAtribuicao(a) !== situacao) return false;
      if (q && !`${a.conta_nome} ${a.telefone ?? ""} ${a.email ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, situacao, busca]);

  return (
    <Dialog open={!!loteId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {loteNome ?? "Lote"}
            {corretorNome && <span className="text-muted-foreground font-normal"> · {corretorNome}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {SITUACOES.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={situacao === s.id ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setSituacao(s.id)}
            >
              {s.label} ({contagens[s.id] ?? 0})
            </Button>
          ))}
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar contato…"
            className="h-8 w-full sm:w-56 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando contatos…
          </div>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Nenhum contato encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Prazo 1º contato</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead>Próxima ação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((a) => {
                  const s = situacaoAtribuicao(a);
                  return (
                    <TableRow key={a.atribuicao_id}>
                      <TableCell>
                        <Link to={`/crm/contas/${a.conta_id}`} className="font-medium hover:underline">
                          {a.conta_nome}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {[a.telefone, a.email].filter(Boolean).join(" · ") || "—"}
                        </div>
                        {a.tem_oportunidade && (
                          <Badge variant="secondary" className="mt-1 text-[11px]">Com oportunidade</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s === "atrasada" ? "destructive" : s === "estabelecido" ? "default" : "outline"}>
                          {LABEL[s]}
                        </Badge>
                        {a.solicitacao_tipo && (
                          <div className="text-[11px] text-muted-foreground mt-1">
                            Solicitação: {a.solicitacao_tipo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={s === "atrasada" ? "text-destructive text-sm" : "text-sm"}>
                        {a.prazo_primeiro_contato ? fmtDate(a.prazo_primeiro_contato) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{a.tentativas}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.ultima_atividade_em ? fmtDateTime(a.ultima_atividade_em) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.proxima_acao_em ? `${fmtDateTime(a.proxima_acao_em)}${a.proxima_acao ? ` · ${a.proxima_acao}` : ""}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Link to={`/crm/contas/${a.conta_id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
