import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Briefcase, ExternalLink, Phone, AlertTriangle } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { etapaLabel } from "@/lib/contasFunil";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import {
  useMinhaCarteira, useCorretores, situacaoAtribuicao, useAlertasCorretor,
  type AtribuicaoCarteira, type SituacaoCarteira,
} from "@/hooks/useCarteira";
import AtendimentoCarteiraDialog from "@/components/carteira/AtendimentoCarteiraDialog";
import CarteiraAlertas from "@/components/carteira/CarteiraAlertas";
import CarteiraMinhaPosicao from "@/components/carteira/CarteiraMinhaPosicao";

const SITUACOES: { id: SituacaoCarteira | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "pendente", label: "Primeiro contato pendente" },
  { id: "atrasada", label: "Atrasadas" },
  { id: "em_atendimento", label: "Em atendimento" },
  { id: "estabelecido", label: "Contato estabelecido" },
  { id: "encerrada", label: "Encerradas (devolvidas/transferidas)" },
];

const PESO: Record<SituacaoCarteira, number> = {
  atrasada: 0, pendente: 1, em_atendimento: 2, estabelecido: 3, encerrada: 4,
};

function PrazoBadge({ a }: { a: AtribuicaoCarteira }) {
  if (a.encerrada_em) return <Badge variant="secondary">Encerrada</Badge>;
  if (a.contato_estabelecido_em)
    return <Badge className="bg-success/15 text-success border-success/30">Contato feito</Badge>;
  if (!a.prazo_primeiro_contato) return <Badge variant="outline">Sem prazo</Badge>;
  const diffMs = Date.parse(a.prazo_primeiro_contato) - Date.now();
  const dias = Math.ceil(diffMs / 86400000);
  if (diffMs < 0)
    return <Badge variant="destructive">Atrasada {Math.abs(dias)}d</Badge>;
  if (dias <= 1)
    return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Vence hoje</Badge>;
  return <Badge className="bg-success/15 text-success border-success/30">Faltam {dias}d</Badge>;
}

export default function MinhaCarteira() {
  const { isAdmin, isGestor } = useRole();
  const gestor = isAdmin || isGestor;
  const { corretores } = useCorretores();
  const [corretorFiltro, setCorretorFiltro] = useState<string>("");
  const { rows, loading, reload } = useMinhaCarteira(gestor ? corretorFiltro || null : null);

  const [situacao, setSituacao] = useState<SituacaoCarteira | "todas">("todas");
  const [lote, setLote] = useState("todos");
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<AtribuicaoCarteira | null>(null);
  const [alerta, setAlerta] = useState<"atrasadas" | "acao_vencida" | "prazo_hoje" | null>(null);
  const { dados: alertas, reload: reloadAlertas } = useAlertasCorretor(gestor ? corretorFiltro || null : null);

  const lotes = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => { if (r.lote_id) m.set(r.lote_id, r.lote_nome ?? "Lote"); });
    return [...m.entries()];
  }, [rows]);

  const kpis = useMemo(() => {
    const ativos = rows.filter((r) => !r.encerrada_em);
    const cont = (f: (r: AtribuicaoCarteira) => boolean) => ativos.filter(f).length;
    return {
      total: rows.length,
      pendentes: cont((r) => situacaoAtribuicao(r) === "pendente"),
      atrasadas: cont((r) => situacaoAtribuicao(r) === "atrasada"),
      atendimento: cont((r) => situacaoAtribuicao(r) === "em_atendimento"),
      estabelecidos: cont((r) => !!r.contato_estabelecido_em),
      oportunidades: cont((r) => r.tem_oportunidade),
      encerradas: rows.filter((r) => !!r.encerrada_em).length,
    };
  }, [rows]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return rows
      .filter((r) => (situacao === "todas" ? true : situacaoAtribuicao(r) === situacao))
      .filter((r) => (lote === "todos" ? true : r.lote_id === lote))
      .filter((r) => {
        if (!alerta) return true;
        if (r.encerrada_em) return false;
        const agora = Date.now();
        if (alerta === "atrasadas")
          return r.tentativas === 0 && !!r.prazo_primeiro_contato && Date.parse(r.prazo_primeiro_contato) < agora;
        if (alerta === "acao_vencida")
          return !!r.proxima_acao_em && Date.parse(r.proxima_acao_em) < agora;
        if (!r.prazo_primeiro_contato || r.tentativas > 0) return false;
        const prazo = new Date(r.prazo_primeiro_contato);
        const hoje = new Date();
        const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Cuiaba" });
        return Date.parse(r.prazo_primeiro_contato) >= agora && fmt(prazo) === fmt(hoje);
      })
      .filter((r) => !q || r.conta_nome.toLowerCase().includes(q) || (r.telefone ?? "").includes(q))
      .sort((a, b) => PESO[situacaoAtribuicao(a)] - PESO[situacaoAtribuicao(b)] ||
        Date.parse(a.prazo_primeiro_contato ?? a.atribuida_em) - Date.parse(b.prazo_primeiro_contato ?? b.atribuida_em));
  }, [rows, situacao, lote, busca, alerta]);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Minha Carteira
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contas da carteira HR Imóveis atribuídas a você, com prazo de primeiro contato e histórico de atendimento.
          </p>
        </div>
        {gestor && (
          <Select value={corretorFiltro || "todos"} onValueChange={(v) => setCorretorFiltro(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Todos os corretores" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os corretores</SelectItem>
              {corretores.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <CarteiraAlertas dados={alertas} filtro={alerta} onFiltrar={setAlerta} />

      <CarteiraMinhaPosicao corretorId={gestor ? corretorFiltro || null : null} />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { l: "Recebidas", v: kpis.total },
          { l: "1º contato pendente", v: kpis.pendentes },
          { l: "Atrasadas", v: kpis.atrasadas, alerta: kpis.atrasadas > 0 },
          { l: "Em atendimento", v: kpis.atendimento },
          { l: "Contato estabelecido", v: kpis.estabelecidos },
          { l: "Viraram oportunidade", v: kpis.oportunidades },
          { l: "Encerradas", v: kpis.encerradas },
        ].map((k) => (
          <Card key={k.l} className="p-3">
            <p className="text-xs text-muted-foreground">{k.l}</p>
            <p className={`text-2xl font-semibold ${k.alerta ? "text-destructive" : ""}`}>{k.v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nome ou telefone…" value={busca}
            onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={situacao} onValueChange={(v) => setSituacao(v as any)}>
          <SelectTrigger className="md:w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SITUACOES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={lote} onValueChange={setLote}>
          <SelectTrigger className="md:w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os lotes</SelectItem>
            {lotes.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : filtradas.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhuma conta da carteira nesta visão.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtradas.map((a) => (
            <Card key={a.atribuicao_id} className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/crm/contas/${a.conta_id}`} className="font-medium hover:underline truncate">
                      {a.conta_nome}
                    </Link>
                    <PrazoBadge a={a} />
                    {a.solicitacao_tipo && (
                      <Badge variant="outline" className="text-amber-700 border-amber-500/40">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {a.solicitacao_tipo === "devolucao" ? "Devolução solicitada" : "Transferência solicitada"}
                      </Badge>
                    )}
                    {a.tem_oportunidade && <Badge variant="secondary">Oportunidade ativa</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.telefone || a.email || "—"}</span>
                    <span>{etapaLabel(a.etapa_funil ?? "a_contatar")}</span>
                    {a.lote_nome && <span>{a.lote_nome}</span>}
                    <span>Recebida em {fmtDate(a.atribuida_em)}</span>
                    <span>{a.tentativas} tentativa(s)</span>
                    {a.proxima_acao_em && <span>Próxima ação: {fmtDateTime(a.proxima_acao_em)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!a.encerrada_em && (
                    <Button size="sm" onClick={() => setAberta(a)}>Atender</Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/crm/contas/${a.conta_id}`}>
                      <ExternalLink className="h-4 w-4 mr-1" /> Abrir conta
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AtendimentoCarteiraDialog
        atribuicao={aberta}
        open={!!aberta}
        onOpenChange={(v) => !v && setAberta(null)}
        onDone={() => { reload(); reloadAlertas(); }}
      />
    </div>
  );
}
