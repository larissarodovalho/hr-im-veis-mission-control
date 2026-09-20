import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Download, FileDown, Loader2, Pencil, RefreshCw, Search, X } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useReportsPeriod } from "@/hooks/useReportsPeriod";
import { fmtDate } from "@/lib/datetime";
import { etapaLabel } from "@/lib/contasFunil";
import {
  CLASSIFICACOES_ACOMPANHAMENTO,
  GRUPOS_ACOMPANHAMENTO,
  TERMOS_ACOMPANHAMENTO,
  type PontoSemanal,
  agruparSeriePorSemana,
  calcularStatusCrm,
  contarSemanasUteis,
  gerarPdfAcompanhamento,
  gerarPdfContasSelecionadas,
  rotuloSemana,
} from "@/lib/acompanhamentoPdf";

type Grupo = "falha_processo" | "desfecho_cliente" | "em_jogo" | "revisao";
type OrigemCarteira = "base_hr" | "marketing" | "carteira_propria";

const ORIGENS_CARTEIRA: Array<{ id: OrigemCarteira; label: string; descricao: string }> = [
  { id: "base_hr", label: "Base HR Imóveis", descricao: "Contas originalmente pertencentes à base da gestão" },
  { id: "marketing", label: "Marketing", descricao: "Leads e contas captados pelos canais de marketing" },
  { id: "carteira_propria", label: "Carteira própria do corretor", descricao: "Contas cujo dono original é o corretor" },
];

const CLASSIFICACOES = CLASSIFICACOES_ACOMPANHAMENTO;

const GRUPO_LABEL: Record<Grupo, string> = {
  falha_processo: "Falha de processo",
  desfecho_cliente: "Desfecho do cliente",
  em_jogo: "Em jogo",
  revisao: "Revisão",
};

const GRUPO_BADGE: Record<Grupo, string> = {
  falha_processo: "bg-destructive/15 text-destructive border-destructive/30",
  desfecho_cliente: "bg-muted text-muted-foreground border-border",
  em_jogo: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  revisao: "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

const clsInfo = (id: string) => CLASSIFICACOES.find((c) => c.id === id);

interface LinhaCorretor {
  responsavel_id: string | null;
  corretor_nome: string;
  total: number;
  falha_processo: number;
  desfecho_cliente: number;
  em_jogo: number;
  revisao: number;
  falta_followup: number;
  crm_desatualizado: number;
  sem_retorno: number;
  sem_interesse: number;
  desqualificado: number;
  encerrado: number;
  virando_oportunidade: number;
  oportunidade_futura: number;
  etapa_antiga: number;
  ciclo_andamento: number;
  oportunidades_conduzidas: number;
  dias_medios_travadas: number | null;
}

interface LinhaDiariaCorretor {
  responsavel_id: string | null;
  corretor_nome: string;
  conta_dias_exigiveis: number;
  contas_exigiveis: number;
  crm_atualizado: number;
  crm_desatualizado: number;
  falta_followup: number;
  sem_retorno: number;
  sem_interesse: number;
  desqualificado: number;
  encerrado: number;
  virando_oportunidade: number;
  oportunidade_futura: number;
  etapa_antiga: number;
  ciclo_andamento: number;
  historico_nao_determinavel: number;
}

interface SerieDiaria extends Omit<LinhaDiariaCorretor, "contas_exigiveis" | "historico_nao_determinavel"> {
  dia: string;
}

interface DadosDiarios {
  dias_uteis: number;
  conta_dias_exigiveis: number;
  corretores: LinhaDiariaCorretor[];
  serie: SerieDiaria[];
}

interface ContaDetalhe {
  id: string;
  nome: string;
  corretor_nome: string;
  classificacao: string;
  grupo: Grupo;
  observacao: string | null;
  manual: boolean;
  etapa_funil: string | null;
  interacoes: number;
  ultima_interacao: string | null;
  dias_sem_contato: number;
  proxima_tarefa: string | null;
  created_at: string;
  qtd_oportunidades: number;
  qtd_oportunidades_ativas: number;
  qtd_divergencias: number;
  divergencias_responsabilidade: string | null;
}

interface Divergencia {
  oportunidade_id: string;
  conta_id: string;
  cliente: string;
  responsavel_conta: string;
  corretor_oportunidade: string;
  estagio: string;
  ativa: boolean;
}

interface Dados {
  prazo_dias: number;
  entrada: {
    leads: number;
    desclassificados: number;
    leads_com_conta: number;
    leads_com_oportunidade: number;
    leads_sem_vinculo: number;
    contas_trabalhadas: number;
    oportunidades_conduzidas: number;
    origens: { origem: string; total: number }[];
  };
  totais: {
    contas: number;
    falha_processo: number;
    desfecho_cliente: number;
    em_jogo: number;
    revisao: number;
    falta_followup: number;
    oportunidade_futura: number;
    etapa_antiga: number;
    sem_responsavel_valido: number;
    dias_medios_travadas: number | null;
  };
  operacao: {
    contas_com_interacao: number;
    interacoes: number;
    tarefas: number;
    movimentacoes: number;
    oportunidades_conduzidas: number;
  };
  corretores: LinhaCorretor[];
  divergencias: Divergencia[];
  contas_detalhe: ContaDetalhe[];
}

const pct = (parte: number, total: number) => (total ? `${((parte / total) * 100).toFixed(1)}%` : "0,0%");

const baixarCSV = (linhas: Record<string, unknown>[], nome: string) => {
  const csv = Papa.unparse(linhas);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
};

export default function AcompanhamentoCorretoresReport() {
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const { user } = useAuth();
  const { isAdmin, isGestor } = useRole();
  const podeEditar = isAdmin || isGestor;

  const [prazo, setPrazo] = useState(7);
  const [origens, setOrigens] = useState<OrigemCarteira[]>(ORIGENS_CARTEIRA.map((origem) => origem.id));
  const [dados, setDados] = useState<Dados | null>(null);
  const [dadosDiarios, setDadosDiarios] = useState<DadosDiarios | null>(null);
  const [erroDiario, setErroDiario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fCorretor, setFCorretor] = useState("todos");
  const [fClasse, setFClasse] = useState("todas");
  const [buscaConta, setBuscaConta] = useState("");
  const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([]);
  const [edit, setEdit] = useState<ContaDetalhe | null>(null);
  const [editCls, setEditCls] = useState("falta_followup");
  const [editObs, setEditObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [gerandoPdfSelecionados, setGerandoPdfSelecionados] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroDiario(null);
    const parametros = { _inicio: inicioISO, _fim: fimISO, _prazo_dias: prazo, _origens_carteira: origens };
    const [geral, diario] = await Promise.all([
      supabase.rpc("acompanhamento_corretores" as any, parametros),
      supabase.rpc("acompanhamento_apurar_diario" as any, parametros),
    ]);
    if (geral.error) toast.error("Erro ao carregar acompanhamento: " + geral.error.message);
    if (diario.error) {
      setErroDiario(diario.error.message);
      toast.error("Não foi possível calcular a produtividade diária.");
    }
    setDados((geral.data as unknown as Dados) ?? null);
    setDadosDiarios(diario.error ? null : ((diario.data as unknown as DadosDiarios) ?? null));
    setLoading(false);
  }, [inicioISO, fimISO, prazo, origens]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const contasFiltradas = useMemo(() => {
    const lista = dados?.contas_detalhe ?? [];
    const busca = buscaConta.trim().toLocaleLowerCase("pt-BR");
    const consultaAtiva = Boolean(busca) || fCorretor !== "todos" || fClasse !== "todas";
    if (!consultaAtiva) return [];
    return lista.filter(
      (c) =>
        (!busca || c.nome.toLocaleLowerCase("pt-BR").includes(busca)) &&
        (fCorretor === "todos" || c.corretor_nome === fCorretor) &&
        (fClasse === "todas" || c.classificacao === fClasse)
    );
  }, [dados, buscaConta, fCorretor, fClasse]);

  const contasMarcadas = useMemo(() => {
    const ids = new Set(contasSelecionadas);
    return (dados?.contas_detalhe ?? []).filter((conta) => ids.has(conta.id));
  }, [dados, contasSelecionadas]);

  const consultaAtiva = Boolean(buscaConta.trim()) || fCorretor !== "todos" || fClasse !== "todas";
  const todosVisiveisSelecionados = contasFiltradas.length > 0 && contasFiltradas.every((conta) => contasSelecionadas.includes(conta.id));

  const alternarConta = (contaId: string) => {
    setContasSelecionadas((atuais) => atuais.includes(contaId) ? atuais.filter((id) => id !== contaId) : [...atuais, contaId]);
  };

  const alternarResultadosVisiveis = () => {
    const idsVisiveis = contasFiltradas.map((conta) => conta.id);
    setContasSelecionadas((atuais) => {
      if (todosVisiveisSelecionados) return atuais.filter((id) => !idsVisiveis.includes(id));
      return Array.from(new Set([...atuais, ...idsVisiveis]));
    });
  };

  const abrirEdicao = (c: ContaDetalhe) => {
    setEdit(c);
    setEditCls(c.classificacao);
    setEditObs(c.observacao ?? "");
  };

  const salvar = async () => {
    if (!edit) return;
    setSalvando(true);
    const { error } = await supabase.from("conta_acompanhamento" as any).upsert(
      {
        conta_id: edit.id,
        classificacao: editCls,
        observacao: editObs || null,
        autor_id: user?.id ?? null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "conta_id" }
    );
    setSalvando(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Classificação atualizada");
    setEdit(null);
    carregar();
  };

  const gerarPdf = async () => {
    if (!dados) return;
    setGerandoPdf(true);
    try {
      await gerarPdfAcompanhamento({
        dados,
        dadosDiarios: dadosDiarios ?? undefined,
        contas: consultaAtiva ? contasFiltradas : dados.contas_detalhe,
        periodo: label,
        filtroCorretor: fCorretor === "todos" ? "Todos os corretores" : fCorretor,
        filtroClassificacao: fClasse === "todas" ? "Todas as classificações" : clsInfo(fClasse)?.label ?? fClasse,
        filtroOrigens: ORIGENS_CARTEIRA.filter((origem) => origens.includes(origem.id)).map((origem) => origem.label).join(", "),
      });
      toast.success("Relatório em PDF gerado");
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Não foi possível gerar o arquivo.";
      toast.error(`Erro ao gerar PDF: ${mensagem}`);
    } finally {
      setGerandoPdf(false);
    }
  };

  const gerarPdfSelecionados = async () => {
    if (!contasMarcadas.length) return;
    setGerandoPdfSelecionados(true);
    try {
      await gerarPdfContasSelecionadas({
        contas: contasMarcadas,
        periodo: label,
        filtroOrigens: ORIGENS_CARTEIRA.filter((origem) => origens.includes(origem.id)).map((origem) => origem.label).join(", "),
      });
      toast.success("PDF dos clientes selecionados gerado");
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Não foi possível gerar o arquivo.";
      toast.error(`Erro ao gerar PDF: ${mensagem}`);
    } finally {
      setGerandoPdfSelecionados(false);
    }
  };

  if (loading) return <Card className="p-6 text-muted-foreground">Carregando acompanhamento dos corretores…</Card>;
  if (!dados) return <Card className="p-6 text-muted-foreground">Sem dados no período.</Card>;

  const e = dados.entrada;
  const t = dados.totais;
  const corretores = dados.corretores;
  const corretoresDiarios = dadosDiarios?.corretores ?? [];
  const serieDiaria = dadosDiarios?.serie ?? [];
  const diasUteis = new Set(serieDiaria.map((item) => item.dia)).size;

  const piorCorretor = [...corretores].sort(
    (a, b) => b.falha_processo / (b.total || 1) - a.falha_processo / (a.total || 1)
  )[0];

  const alternarOrigem = (origem: OrigemCarteira) => {
    setOrigens((atuais) => {
      if (atuais.includes(origem)) {
        return atuais.length === 1 ? atuais : atuais.filter((item) => item !== origem);
      }
      return [...atuais, origem];
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cabeçalho + prazo */}
      <Card className="p-4 md:p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Diagnóstico · {e.contas_trabalhadas} contas trabalhadas · {corretores.length} responsáveis · {label}
          </p>
          <h2 className="font-display text-xl md:text-2xl font-semibold mt-1">
            Trabalho registrado em Contas e Oportunidades
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="prazo" className="text-xs text-muted-foreground">
              Prazo máximo entre contatos (dias)
            </Label>
            <Input
              id="prazo"
              type="number"
              min={1}
              max={60}
              value={prazo}
              onChange={(ev) => setPrazo(Math.max(1, Number(ev.target.value) || 1))}
              className="w-28 h-9"
            />
          </div>
          <Button onClick={gerarPdf} disabled={gerandoPdf} className="h-9">
            {gerandoPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            {gerandoPdf ? "Gerando…" : "Gerar PDF"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3">
        <div>
          <Label className="text-sm font-medium">Origem da carteira</Label>
          <p className="text-sm text-muted-foreground">Escolha quais bases devem entrar em todo o acompanhamento.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ORIGENS_CARTEIRA.map((origem) => (
            <label key={origem.id} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer bg-background">
              <Checkbox
                checked={origens.includes(origem.id)}
                onCheckedChange={() => alternarOrigem(origem.id)}
                aria-label={origem.label}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{origem.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{origem.descricao}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* 01 Entrada */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">01 · Entrada</p>
          <h3 className="font-semibold text-lg">Entrada do Marketing e vínculos comprovados</h3>
          <p className="text-sm text-muted-foreground">Leads são contexto de entrada; o trabalho dos corretores é medido em Contas e Oportunidades.</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi titulo="Leads no período" valor={String(e.leads)} nota={label} />
          <Kpi
            titulo="Com Conta vinculada"
            valor={pct(e.leads_com_conta, e.leads)}
            nota={`${e.leads_com_conta} de ${e.leads}`}
          />
          <Kpi
            titulo="Com Oportunidade vinculada"
            valor={pct(e.leads_com_oportunidade, e.leads)}
            nota={`${e.leads_com_oportunidade} de ${e.leads}`}
          />
          <Kpi
            titulo="Sem vínculo de Conta"
            valor={pct(e.leads_sem_vinculo, e.leads)}
            alerta
            nota={`${e.leads_sem_vinculo} de ${e.leads}`}
          />
        </div>

        <div className="space-y-3">
          <Nivel titulo={`${e.leads} leads entraram`} subtitulo="Origem de entrada"
            itens={e.origens.map((o) => ({ label: o.origem, valor: o.total }))} />
          <Nivel titulo="Vínculos reais no CRM" subtitulo="Conversão comprovada"
            itens={[
              { label: "Leads com Conta", valor: e.leads_com_conta },
              { label: "Leads com Oportunidade", valor: e.leads_com_oportunidade },
              { label: "Leads sem Conta vinculada", valor: e.leads_sem_vinculo },
            ]} />
          <Nivel titulo="Trabalho realizado no período" subtitulo="Contas e Oportunidades"
            itens={[
              { label: "Contas trabalhadas", valor: e.contas_trabalhadas },
              { label: "Oportunidades conduzidas", valor: e.oportunidades_conduzidas },
            ]} />
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Atividade no período</p>
          <h3 className="font-semibold text-lg">Trabalho registrado no CRM</h3>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <Kpi titulo="Contas com interação" valor={String(dados.operacao.contas_com_interacao)} />
          <Kpi titulo="Interações" valor={String(dados.operacao.interacoes)} />
          <Kpi titulo="Tarefas" valor={String(dados.operacao.tarefas)} />
          <Kpi titulo="Movimentações" valor={String(dados.operacao.movimentacoes)} />
          <Kpi titulo="Oportunidades conduzidas" valor={String(dados.operacao.oportunidades_conduzidas)} />
        </div>
      </Card>

      {/* 02 Retrato por corretor */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">02 · Retrato por corretor</p>
            <h3 className="font-semibold text-lg">Quanto de cada carteira travou por processo</h3>
          </div>
          <Button variant="outline" size="sm" disabled={!corretoresDiarios.length}
            onClick={() =>
              baixarCSV(
                 corretoresDiarios.map((c) => ({
                   Corretor: c.corretor_nome,
                   "Contas exigíveis": c.contas_exigiveis,
                   "Dias úteis com exigência": diasUteis,
                   "Ocorrências exigíveis": c.conta_dias_exigiveis,
                   "CRM atualizado — ocorrências": c.crm_atualizado,
                   "CRM atualizado — %": pct(c.crm_atualizado, c.conta_dias_exigiveis),
                   "CRM desatualizado — ocorrências": c.crm_desatualizado,
                   "CRM desatualizado — %": pct(c.crm_desatualizado, c.conta_dias_exigiveis),
                   "Falta de follow-up — ocorrências": c.falta_followup,
                   "Sem retorno — ocorrências": c.sem_retorno,
                   "Sem interesse — ocorrências": c.sem_interesse,
                   "Desqualificado — ocorrências": c.desqualificado,
                   "Encerrado — ocorrências": c.encerrado,
                   "Oportunidade criada — ocorrências": c.virando_oportunidade,
                   "Oportunidade futura — ocorrências": c.oportunidade_futura,
                   "Etapa antiga — ocorrências": c.etapa_antiga,
                   "Ciclo em andamento — ocorrências": c.ciclo_andamento,
                 })),
                `acompanhamento-corretores-${label.replace("/", "-")}.csv`
              )
            }>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Corretor</TableHead>
                <TableHead className="text-right">Total contas</TableHead>
                <TableHead className="min-w-[160px]">Proporção travada</TableHead>
                <TableHead className="text-right">Oportunidades</TableHead>
                <TableHead className="text-right">Travadas</TableHead>
                <TableHead className="text-right">Falha de processo</TableHead>
                <TableHead className="text-right">Desfecho do cliente</TableHead>
                <TableHead className="text-right">Em jogo</TableHead>
                <TableHead className="text-right">Revisão</TableHead>
                <TableHead>Principal problema</TableHead>
                <TableHead className="text-right">Dias médios parado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corretores.map((c) => {
                const principal = c.falta_followup >= c.crm_desatualizado ? "Falta de follow-up" : "CRM desatualizado";
                const qtdPrincipal = Math.max(c.falta_followup, c.crm_desatualizado);
                const perc = c.total ? (c.falha_processo / c.total) * 100 : 0;
                return (
                  <TableRow key={c.responsavel_id ?? c.corretor_nome}>
                    <TableCell className="font-medium whitespace-nowrap">{c.corretor_nome}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-destructive" style={{ width: `${perc}%` }} />
                        </div>
                        <span className="text-xs tabular-nums">{perc.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{c.oportunidades_conduzidas}</TableCell>
                    <TableCell className="text-right">{c.falha_processo} de {c.total}</TableCell>
                    <TableCell className="text-right text-destructive">{c.falha_processo}</TableCell>
                    <TableCell className="text-right">{c.desfecho_cliente}</TableCell>
                    <TableCell className="text-right">{c.em_jogo}</TableCell>
                    <TableCell className="text-right">{c.revisao}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {qtdPrincipal > 0 ? `${principal} · ${qtdPrincipal} contas (${pct(qtdPrincipal, c.total)})` : "—"}
                    </TableCell>
                    <TableCell className="text-right">{c.dias_medios_travadas ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Somando as carteiras, <strong className="text-foreground">{pct(t.falha_processo, t.contas)} das {t.contas} contas
          pararam por falha de processo</strong> — {t.falha_processo} contas. Contra {pct(t.em_jogo, t.contas)} que seguem
          vivas e {pct(t.desfecho_cliente, t.contas)} com desfecho legítimo do cliente.
        </p>
      </Card>

      {/* 03 Taxa de incidência */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">03 · Taxa de incidência</p>
          <h3 className="font-semibold text-lg">Cada problema, lado a lado</h3>
          <p className="text-sm text-muted-foreground">
            Leitura geral do período filtrado: cada barra mostra o total de ocorrências exigíveis de cada corretor e quanto disso ficou em dia ou em atraso.
          </p>

        </div>
        {erroDiario && (
          <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium">Não foi possível calcular a produtividade semanal.</p>
                <p className="text-xs text-muted-foreground">Os quadros abaixo não representam zero ocorrências. Tente carregar novamente.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={carregar}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </div>
        )}
        {!erroDiario && dadosDiarios && corretoresDiarios.length === 0 && (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            Nenhuma conta exigível foi encontrada com os filtros atuais neste período.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {CLASSIFICACOES.map((cl) => (
            <div key={cl.id} className={`rounded-lg border p-4 space-y-3 ${cl.id === "crm_desatualizado" || cl.id === "falta_followup" ? "md:col-span-2 xl:col-span-4" : ""}`}>
              <div>
                <p className="font-medium">{cl.id === "crm_desatualizado" ? "CRM atualizado × desatualizado" : cl.id === "falta_followup" ? "Follow-up feito × não feito" : cl.label}</p>
                <Badge variant="outline" className={GRUPO_BADGE[cl.grupo]}>{GRUPO_LABEL[cl.grupo]}</Badge>
                {(cl.id === "crm_desatualizado" || cl.id === "falta_followup") && (
                  <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                    Entram apenas as ocorrências em que a conta exigia contato ou atualização no período. Verde e vermelho fecham 100%.
                  </p>
                )}
              </div>
              {(cl.id === "crm_desatualizado" || cl.id === "falta_followup") && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-success" /> {cl.id === "crm_desatualizado" ? "Atualizado" : "Follow-up feito"}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-destructive" /> {cl.id === "crm_desatualizado" ? "Desatualizado" : "Não feito"}</span>
                </div>
              )}

              <div className={cl.id === "crm_desatualizado" || cl.id === "falta_followup" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-2"}>
                {corretoresDiarios.map((c) => {
                  const qtd = (c as unknown as Record<string, number>)[cl.id] ?? 0;
                  const perc = c.conta_dias_exigiveis ? (qtd / c.conta_dias_exigiveis) * 100 : 0;
                  if (cl.id === "crm_desatualizado") {
                    const status = calcularStatusCrm(c.conta_dias_exigiveis, c.crm_desatualizado);
                    return (
                      <BarraGeral
                        key={c.corretor_nome}
                        nome={c.corretor_nome}
                        total={c.conta_dias_exigiveis}
                        problema={status.desatualizado}
                        rotuloOk="Atualizado"
                        rotuloProblema="Desatualizado"
                      />
                    );
                  }
                  if (cl.id === "falta_followup") {
                    return (
                      <BarraGeral
                        key={c.corretor_nome}
                        nome={c.corretor_nome}
                        total={c.conta_dias_exigiveis}
                        problema={qtd}
                        rotuloOk="Follow-up feito"
                        rotuloProblema="Não feito"
                      />
                    );
                  }
                  return (
                    <div key={c.corretor_nome} className="flex items-center gap-2 text-sm">
                      <span className="w-28 truncate text-muted-foreground">{c.corretor_nome}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${perc}%` }} />
                      </div>
                      <span className="tabular-nums text-xs w-24 text-right">{perc.toFixed(1)}% · {qtd}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </Card>

      {/* 04 Leituras */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">04 · O que fazer</p>
          <h3 className="font-semibold text-lg">Três leituras</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Leitura n="01" titulo="Onde o funil falha">
            {pct(e.leads_com_conta, e.leads)} dos leads possuem Conta vinculada e {pct(e.leads_com_oportunidade, e.leads)}
            possuem Oportunidade vinculada. Totais independentes não são tratados como uma jornada única.
          </Leitura>
          <Leitura n="02" titulo="É do escritório ou de um corretor?">
            {piorCorretor
              ? `Falta de follow-up soma ${t.falta_followup} contas nas carteiras. A maior incidência é de ${piorCorretor.corretor_nome} (${pct(piorCorretor.falha_processo, piorCorretor.total)}), mas tratar como falha individual deixa as demais de pé.`
              : "Sem contas classificadas no período."}
          </Leitura>
          <Leitura n="03" titulo="Prazo é o sintoma comum">
            As contas travadas estão, em média, {t.dias_medios_travadas ?? "—"} dias sem contato, com prazo máximo
            configurado em {dados.prazo_dias} dias. Falta cadência, não esforço.
          </Leitura>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Auditoria</p>
          <h3 className="font-semibold text-lg">Pontos para revisão da gestão</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Kpi titulo="Oportunidades futuras" valor={String(t.oportunidade_futura)} nota="Sem Oportunidade criada" />
          <Kpi titulo="Etapas antigas" valor={String(t.etapa_antiga)} nota="Sem migração automática" alerta={t.etapa_antiga > 0} />
          <Kpi titulo="Responsáveis divergentes" valor={String(dados.divergencias.length)} nota="O corretor da Oportunidade prevalece" alerta={dados.divergencias.length > 0} />
        </div>
        {dados.divergencias.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Responsável da Conta</TableHead><TableHead>Corretor da Oportunidade</TableHead><TableHead>Etapa</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
              <TableBody>{dados.divergencias.map((item) => (
                <TableRow key={item.oportunidade_id}>
                  <TableCell className="font-medium"><Link to={`/crm/contas/${item.conta_id}`} className="hover:underline">{item.cliente}</Link></TableCell>
                  <TableCell>{item.responsavel_conta}</TableCell><TableCell>{item.corretor_oportunidade}</TableCell>
                  <TableCell>{item.estagio}</TableCell><TableCell>{item.ativa ? "Ativa" : "Encerrada"}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 05 Conta a conta */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">05 · Conta a conta</p>
          <h3 className="font-semibold text-lg">Detalhamento</h3>
          <p className="text-sm text-muted-foreground">
            Busque ou filtre os clientes que deseja consultar e marque aqueles que entrarão no relatório separado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1fr)_220px_220px] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={buscaConta}
              onChange={(event) => setBuscaConta(event.target.value)}
              placeholder="Buscar cliente pelo nome…"
              className="pl-9"
            />
          </div>
          <Select value={fCorretor} onValueChange={setFCorretor}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os corretores</SelectItem>
              {corretores.map((c) => (
                <SelectItem key={c.corretor_nome} value={c.corretor_nome}>{c.corretor_nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fClasse} onValueChange={setFClasse}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as classificações</SelectItem>
              {CLASSIFICACOES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-y py-3">
          <div>
            <p className="text-sm font-medium">{contasMarcadas.length} clientes selecionados</p>
            <p className="text-xs text-muted-foreground">A seleção é mantida quando você muda a busca ou os filtros.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={!contasMarcadas.length}
              onClick={() =>
                baixarCSV(
                  contasMarcadas.map((c) => ({
                    Cliente: c.nome, Corretor: c.corretor_nome,
                    Classificação: clsInfo(c.classificacao)?.label ?? c.classificacao,
                    Grupo: GRUPO_LABEL[c.grupo], Etapa: etapaLabel(c.etapa_funil ?? "a_contatar"),
                     Interações: c.interacoes, Oportunidades: c.qtd_oportunidades,
                     "Divergência de responsável": c.divergencias_responsabilidade ?? "",
                     "Último contato": fmtDate(c.ultima_interacao),
                    "Dias sem contato": c.dias_sem_contato, Observação: c.observacao ?? "",
                  })),
                  `clientes-selecionados-${label.replace("/", "-")}.csv`
                )
              }>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" disabled={!contasMarcadas.length || gerandoPdfSelecionados} onClick={gerarPdfSelecionados}>
              {gerandoPdfSelecionados ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              PDF dos selecionados
            </Button>
            {contasMarcadas.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setContasSelecionadas([])}>Limpar seleção</Button>
            )}
          </div>
        </div>

        {contasMarcadas.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Clientes selecionados">
            {contasMarcadas.map((conta) => (
              <Badge key={conta.id} variant="secondary" className="gap-1 py-1.5 pl-2.5 pr-1.5">
                {conta.nome}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => alternarConta(conta.id)}
                  aria-label={`Remover ${conta.nome} da seleção`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {!consultaAtiva ? (
          <div className="border border-dashed rounded-md py-10 px-4 text-center text-sm text-muted-foreground">
            Busque pelo nome do cliente ou escolha um corretor ou classificação para ver os resultados.
          </div>
        ) : contasFiltradas.length === 0 ? (
          <div className="border border-dashed rounded-md py-10 px-4 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado com esses critérios.
          </div>
        ) : <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-muted-foreground">{contasFiltradas.length} clientes encontrados</p>
            <Button variant="outline" size="sm" onClick={alternarResultadosVisiveis}>
              {todosVisiveisSelecionados ? "Desmarcar resultados" : "Selecionar resultados"}
            </Button>
          </div>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><span className="sr-only">Selecionar</span></TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Interações</TableHead>
                <TableHead className="text-right">Oportunidades</TableHead>
                <TableHead className="text-right">Dias sem contato</TableHead>
                <TableHead>Observação</TableHead>
                {podeEditar && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasFiltradas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox
                      checked={contasSelecionadas.includes(c.id)}
                      onCheckedChange={() => alternarConta(c.id)}
                      aria-label={`Selecionar ${c.nome}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link to={`/crm/contas/${c.id}`} className="hover:underline">{c.nome}</Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.corretor_nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={GRUPO_BADGE[c.grupo]}>
                      {clsInfo(c.classificacao)?.label ?? c.classificacao}
                    </Badge>
                    {c.manual && <span className="ml-1 text-[10px] text-muted-foreground">manual</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {etapaLabel(c.etapa_funil ?? "a_contatar")}
                  </TableCell>
                  <TableCell className="text-right">{c.interacoes}</TableCell>
                  <TableCell className="text-right">{c.qtd_oportunidades}</TableCell>
                  <TableCell className={`text-right ${c.dias_sem_contato > dados.prazo_dias ? "text-destructive" : ""}`}>
                    {c.dias_sem_contato}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[280px]">
                    {c.observacao ?? "—"}
                  </TableCell>
                  {podeEditar && (
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(c)} aria-label="Reclassificar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
        }

        <p className="text-xs text-muted-foreground">
          A classificação é calculada a partir dos registros do CRM (interações, tarefas, etapa e motivo). Admin e gestor
          podem reclassificar conta a conta — a classificação manual prevalece.
        </p>
      </Card>

      {/* Legenda */}
      <Card className="p-4 md:p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Legenda</p>
          <h3 className="font-semibold text-lg">Entenda este relatório</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte aqui como os números e diagnósticos do acompanhamento são calculados e interpretados.
          </p>
        </div>

        <GlossarioSecao titulo="Termos e indicadores" itens={TERMOS_ACOMPANHAMENTO} />
        <GlossarioSecao titulo="Grupos de diagnóstico" itens={GRUPOS_ACOMPANHAMENTO} />
        <GlossarioSecao
          titulo="O que significa cada caixinha"
          itens={CLASSIFICACOES_ACOMPANHAMENTO.map(({ label: titulo, texto }) => ({ titulo, texto }))}
        />

        <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
          A incidência é medida diariamente, apenas em dias úteis e sobre contas exigíveis. Admin e gestor podem
          reclassificar uma conta; a classificação manual prevalece a partir da data em que foi registrada.
        </div>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reclassificar {edit?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Classificação</Label>
              <Select value={editCls} onValueChange={setEditCls}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASSIFICACOES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Textarea value={editObs} onChange={(ev) => setEditObs(ev.target.value)} rows={3}
                placeholder="Ex.: 15 dias sem follow up" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ titulo, valor, nota, alerta }: { titulo: string; valor: string; nota?: string; alerta?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className={`text-2xl font-semibold mt-1 ${alerta ? "text-destructive" : ""}`}>{valor}</p>
      {nota && <p className="text-xs text-muted-foreground mt-1">{nota}</p>}
    </Card>
  );
}

function Nivel({ titulo, subtitulo, itens }: { titulo: string; subtitulo: string; itens: { label: string; valor: number }[] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
        <p className="font-medium">{titulo}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{subtitulo}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {itens.map((i) => (
          <span key={i.label} className="rounded-md bg-muted px-3 py-1.5 text-sm">
            {i.label}: <strong>{i.valor}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function Leitura({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Leitura {n}</p>
      <p className="font-medium mt-1">{titulo}</p>
      <p className="text-sm text-muted-foreground mt-2">{children}</p>
    </div>
  );
}

function GlossarioSecao({ titulo, itens }: { titulo: string; itens: Array<{ titulo: string; texto: string }> }) {
  return (
    <section className="space-y-3">
      <h4 className="font-medium">{titulo}</h4>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {itens.map((item) => (
          <div key={item.titulo} className="border-t pt-3">
            <dt className="text-sm font-medium">{item.titulo}</dt>
            <dd className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.texto}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Barra geral do período: verde (ok) × vermelho (problema), com percentuais e quantidades escritos. */
function BarraGeral({ nome, total, problema, rotuloOk, rotuloProblema }: {
  nome: string;
  total: number;
  problema: number;
  rotuloOk: string;
  rotuloProblema: string;
}) {
  const qtdProblema = Math.min(total, Math.max(0, problema));
  const qtdOk = total - qtdProblema;
  const percOk = total ? (qtdOk / total) * 100 : 0;
  const percProblema = total ? (qtdProblema / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium">{nome}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{total} ocorrências exigíveis</span>
      </div>
      <div
        className="flex h-5 w-full overflow-hidden rounded-sm text-[10px] font-medium leading-5"
        aria-label={`${nome}: ${rotuloOk} ${percOk.toFixed(1)}% e ${rotuloProblema} ${percProblema.toFixed(1)}%`}
      >
        <span className="flex h-full items-center justify-center bg-success text-primary-foreground" style={{ width: `${percOk}%` }}>
          {percOk >= 18 ? `${percOk.toFixed(0)}%` : ""}
        </span>
        <span className="flex h-full items-center justify-center bg-destructive text-destructive-foreground" style={{ width: `${percProblema}%` }}>
          {percProblema >= 18 ? `${percProblema.toFixed(0)}%` : ""}
        </span>
      </div>
      <div className="flex justify-between gap-3 text-xs tabular-nums">
        <span className="text-success">{rotuloOk} {percOk.toFixed(1)}% · {qtdOk}</span>
        <span className="text-destructive">{rotuloProblema} {percProblema.toFixed(1)}% · {qtdProblema}</span>
      </div>
    </div>
  );
}

