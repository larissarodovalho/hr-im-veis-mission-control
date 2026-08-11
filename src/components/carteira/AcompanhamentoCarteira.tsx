import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, RotateCcw, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import {
  useMinhaCarteira, useResumoLotes, useCorretores, gestorAcaoCarteira, resolverSolicitacaoCarteira,
  situacaoAtribuicao, type AtribuicaoCarteira,
} from "@/hooks/useCarteira";

export default function AcompanhamentoCarteira({ profiles }: { profiles: Record<string, string> }) {
  const { rows: lotes, loading: loadingLotes, reload: reloadLotes } = useResumoLotes();
  const { rows, loading, reload } = useMinhaCarteira(null);
  const { corretores } = useCorretores();

  const [alvo, setAlvo] = useState<AtribuicaoCarteira | null>(null);
  const [modo, setModo] = useState<"solicitacao" | "gestor">("solicitacao");
  const [acao, setAcao] = useState("aprovar");
  const [novoCorretor, setNovoCorretor] = useState("");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  const solicitacoes = useMemo(
    () => rows.filter((r) => r.solicitacao_tipo && !r.encerrada_em),
    [rows]
  );
  const atrasadas = useMemo(
    () => rows.filter((r) => situacaoAtribuicao(r) === "atrasada"),
    [rows]
  );

  const abrir = (a: AtribuicaoCarteira, m: "solicitacao" | "gestor") => {
    setAlvo(a); setModo(m); setObs(""); setNovoCorretor("");
    setAcao(m === "solicitacao" ? "aprovar" : "transferir");
  };

  const confirmar = async () => {
    if (!alvo) return;
    setSalvando(true);
    try {
      if (modo === "solicitacao") {
        await resolverSolicitacaoCarteira(alvo.atribuicao_id, acao as "aprovar" | "recusar", novoCorretor || null, obs);
      } else {
        await gestorAcaoCarteira(alvo.atribuicao_id, acao as "transferir" | "devolver", novoCorretor || null, obs);
      }
      toast.success("Ação registrada");
      setAlvo(null);
      reload(); reloadLotes();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível concluir a ação");
    }
    setSalvando(false);
  };

  const precisaCorretor =
    (modo === "gestor" && acao === "transferir") ||
    (modo === "solicitacao" && acao === "aprovar" && alvo?.solicitacao_tipo === "transferencia");

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-3">Desempenho dos lotes ativos</h2>
        {loadingLotes ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : lotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lote ativo no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead><TableHead>Corretor</TableHead><TableHead>Contas</TableHead>
                  <TableHead>1º contato pendente</TableHead><TableHead>Atrasadas</TableHead>
                  <TableHead>Em atendimento</TableHead><TableHead>Contato feito</TableHead>
                  <TableHead>Oportunidades</TableHead><TableHead>Devolvidas</TableHead>
                  <TableHead>Transferidas</TableHead><TableHead>Solicitações</TableHead><TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((l) => (
                  <TableRow key={l.lote_id}>
                    <TableCell className="font-medium">{l.lote_nome}</TableCell>
                    <TableCell>{profiles[l.corretor_id] ?? "—"}</TableCell>
                    <TableCell>{l.total}</TableCell>
                    <TableCell>{l.pendentes}</TableCell>
                    <TableCell className={l.atrasadas > 0 ? "text-destructive font-medium" : ""}>{l.atrasadas}</TableCell>
                    <TableCell>{l.em_atendimento}</TableCell>
                    <TableCell>{l.contato_estabelecido}</TableCell>
                    <TableCell>{l.com_oportunidade}</TableCell>
                    <TableCell>{l.devolvidas}</TableCell>
                    <TableCell>{l.transferidas}</TableCell>
                    <TableCell>{l.solicitacoes}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(l.criado_em)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          Solicitações pendentes
          {solicitacoes.length > 0 && <Badge variant="destructive">{solicitacoes.length}</Badge>}
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : solicitacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação de devolução ou transferência aguardando decisão.</p>
        ) : (
          <div className="space-y-2">
            {solicitacoes.map((s) => (
              <div key={s.atribuicao_id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.conta_nome}</span>
                    <Badge variant="outline">
                      {s.solicitacao_tipo === "devolucao" ? "Devolução" : "Transferência"}
                    </Badge>
                    <Badge variant="secondary">{profiles[s.corretor_id] ?? "Corretor"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.solicitacao_motivo || "Sem motivo informado"} · solicitado em {s.solicitacao_em ? fmtDateTime(s.solicitacao_em) : "—"}
                  </p>
                </div>
                <Button size="sm" onClick={() => abrir(s, "solicitacao")}>Decidir</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Contas fora do prazo de primeiro contato
          {atrasadas.length > 0 && <Badge variant="destructive">{atrasadas.length}</Badge>}
        </h2>
        {atrasadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta atrasada.</p>
        ) : (
          <div className="space-y-2">
            {atrasadas.slice(0, 30).map((a) => (
              <div key={a.atribuicao_id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{a.conta_nome}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profiles[a.corretor_id] ?? "Corretor"} · {a.lote_nome ?? "—"} · prazo {a.prazo_primeiro_contato ? fmtDateTime(a.prazo_primeiro_contato) : "—"} · {a.tentativas} tentativa(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { abrir(a, "gestor"); setAcao("transferir"); }}>
                    <ArrowLeftRight className="h-4 w-4 mr-1" /> Transferir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { abrir(a, "gestor"); setAcao("devolver"); }}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Devolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!alvo} onOpenChange={(v) => !v && setAlvo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{alvo?.conta_nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Ação</Label>
              <Select value={acao} onValueChange={setAcao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modo === "solicitacao" ? (
                    <>
                      <SelectItem value="aprovar">Aprovar solicitação</SelectItem>
                      <SelectItem value="recusar">Recusar solicitação</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="transferir">Transferir para outro corretor</SelectItem>
                      <SelectItem value="devolver">Devolver para a carteira HR</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {precisaCorretor && (
              <div>
                <Label className="text-xs">Novo corretor</Label>
                <Select value={novoCorretor} onValueChange={setNovoCorretor}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {corretores
                      .filter((c) => c.user_id !== alvo?.corretor_id)
                      .map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Observação</Label>
              <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)}
                placeholder="Registro no histórico da conta." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAlvo(null)}>Cancelar</Button>
            <Button onClick={confirmar} disabled={salvando || (precisaCorretor && !novoCorretor)}>
              {salvando && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
