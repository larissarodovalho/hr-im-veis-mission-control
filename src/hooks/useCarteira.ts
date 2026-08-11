import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ModoSelecao = "automatico" | "manual" | "automatico_ajuste";

export interface CorretorOption {
  user_id: string;
  nome: string;
  email: string | null;
}

export interface ContaElegivel {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  categoria: string | null;
  etapa_funil: string | null;
  origem: string | null;
  interesse: string | null;
  temperatura: string | null;
  endereco: string | null;
  tags: string[] | null;
  responsavel_id: string | null;
  created_at: string;
}

export interface FiltrosCarteira {
  categoria?: string[];
  etapa_funil?: string[];
  origem?: string[];
  temperatura?: string[];
  tags?: string[];
  cidade?: string;
  interesse?: string;
  responsavel_id?: string;
  sem_oportunidade_ativa?: boolean;
  sem_contato_dias?: string;
}

export function limparFiltros(f: FiltrosCarteira): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(f).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v) && v.length === 0) return;
    if (typeof v === "string" && v.trim() === "") return;
    if (typeof v === "boolean" && v === false) return;
    out[k] = v;
  });
  return out;
}

/** Corretores ativos carregados do cadastro de usuários (nunca fixos no código). */
export function useCorretores() {
  const [corretores, setCorretores] = useState<CorretorOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: roles }, { data: profiles }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").eq("role", "corretor"),
        supabase.from("profiles").select("user_id, nome, email"),
      ]);
      const ids = new Set((roles ?? []).map((r: any) => r.user_id));
      setCorretores(
        (profiles ?? [])
          .filter((p: any) => ids.has(p.user_id))
          .map((p: any) => ({ user_id: p.user_id, nome: p.nome || p.email || "Sem nome", email: p.email }))
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setLoading(false);
    })();
  }, []);

  return { corretores, loading };
}

export function useProfilesMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from("profiles").select("user_id, nome, email").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { m[p.user_id] = p.nome || p.email || "Sem nome"; });
      setMap(m);
    });
  }, []);
  return map;
}

export async function buscarElegiveis(filtros: FiltrosCarteira, q?: string) {
  const { data, error } = await supabase.rpc("carteira_elegiveis" as any, {
    _filtros: limparFiltros(filtros) as any,
    _q: q?.trim() || null,
  });
  if (error) throw error;
  return ((data ?? []) as unknown) as ContaElegivel[];
}

export interface LoteConfig {
  key: string;
  corretor_id: string;
  quantidade: number;
  prazoDias: number;
  objetivo: string;
  observacoes: string;
}

/** Cria a operação e seus lotes (um lote independente por corretor). */
export async function criarOperacao(params: {
  modo: ModoSelecao;
  filtros: FiltrosCarteira;
  gestorId: string;
  lotes: LoteConfig[];
  corretorNome: (id: string) => string;
}) {
  const { modo, filtros, gestorId, lotes, corretorNome } = params;
  const filtrosLimpos = limparFiltros(filtros);
  const { data: op, error } = await supabase
    .from("carteira_operacoes" as any)
    .insert({
      modo,
      filtros: filtrosLimpos as any,
      gestor_id: gestorId,
      created_by: gestorId,
      status: "rascunho",
      total_definido: lotes.reduce((s, l) => s + (l.quantidade || 0), 0),
      nome: `Distribuição de carteira — ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Cuiaba" })}`,
    } as any)
    .select()
    .single();
  if (error) throw error;
  const operacaoId = (op as any).id as string;

  const rows = lotes.map((l, i) => ({
    operacao_id: operacaoId,
    numero: i + 1,
    nome: `Carteira – ${corretorNome(l.corretor_id)} – Lote ${String(i + 1).padStart(2, "0")}`,
    corretor_id: l.corretor_id,
    gestor_id: gestorId,
    modo,
    quantidade_definida: l.quantidade || 0,
    prazo_primeiro_contato_dias: l.prazoDias || 3,
    objetivo: l.objetivo || null,
    observacoes_internas: l.observacoes || null,
    filtros: filtrosLimpos as any,
    created_by: gestorId,
    status: "em_revisao",
  }));
  const { error: e2 } = await supabase.from("carteira_lotes" as any).insert(rows as any);
  if (e2) throw e2;
  return operacaoId;
}

export interface LotePreview {
  id: string;
  nome: string;
  numero: number;
  corretor_id: string;
  quantidade_definida: number;
  prazo_primeiro_contato_dias: number;
  observacoes_internas: string | null;
}

export interface ItemPreview {
  conta_id: string;
  lote_id: string;
  origem: string;
  conta: { nome: string; telefone: string | null; email: string | null; etapa_funil: string | null; responsavel_id: string | null } | null;
}

export function usePreviaOperacao(operacaoId: string | null) {
  const [lotes, setLotes] = useState<LotePreview[]>([]);
  const [itens, setItens] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (idOverride?: string) => {
    const opId = idOverride ?? operacaoId;
    if (!opId) { setLotes([]); setItens([]); return; }
    setLoading(true);
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("carteira_lotes" as any).select("*").eq("operacao_id", opId).order("numero"),
      supabase
        .from("carteira_selecao_itens" as any)
        .select("conta_id, lote_id, origem, contas(nome, telefone, email, etapa_funil, responsavel_id)")
        .eq("operacao_id", opId),
    ]);
    setLotes(((l ?? []) as unknown) as LotePreview[]);
    setItens(
      ((s ?? []) as any[]).map((r) => ({
        conta_id: r.conta_id,
        lote_id: r.lote_id,
        origem: r.origem,
        conta: r.contas ?? null,
      }))
    );
    setLoading(false);
  }, [operacaoId]);

  useEffect(() => { load(); }, [load]);

  return { lotes, itens, loading, reload: load };
}

export async function contarElegiveis(filtros: FiltrosCarteira, q?: string) {
  const { data, error } = await supabase.rpc("carteira_elegiveis_count" as any, {
    _filtros: limparFiltros(filtros) as any,
    _q: q?.trim() || null,
  });
  if (error) throw error;
  return (data as unknown as number) ?? 0;
}

// ===================== Fase 2: atendimento da carteira =====================

export interface AtribuicaoCarteira {
  atribuicao_id: string;
  conta_id: string;
  conta_nome: string;
  telefone: string | null;
  email: string | null;
  etapa_funil: string | null;
  categoria: string | null;
  origem: string | null;
  interesse: string | null;
  lote_id: string | null;
  lote_nome: string | null;
  lote_numero: number | null;
  corretor_id: string;
  gestor_id: string | null;
  atribuida_em: string;
  prazo_primeiro_contato: string | null;
  primeira_atividade_em: string | null;
  contato_estabelecido_em: string | null;
  ultima_atividade_em: string | null;
  tentativas: number;
  proxima_acao: string | null;
  proxima_acao_em: string | null;
  status: string;
  solicitacao_tipo: string | null;
  solicitacao_motivo: string | null;
  solicitacao_em: string | null;
  encerrada_em: string | null;
  motivo_encerramento: string | null;
  tem_oportunidade: boolean;
}

export function useMinhaCarteira(corretorFiltro?: string | null) {
  const [rows, setRows] = useState<AtribuicaoCarteira[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("carteira_minha_carteira" as any, {
      _corretor: corretorFiltro || null,
    });
    if (!error) setRows(((data ?? []) as unknown) as AtribuicaoCarteira[]);
    setLoading(false);
  }, [corretorFiltro]);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export interface ResumoLote {
  lote_id: string;
  lote_nome: string;
  numero: number;
  corretor_id: string;
  operacao_id: string | null;
  criado_em: string;
  total: number;
  pendentes: number;
  atrasadas: number;
  em_atendimento: number;
  contato_estabelecido: number;
  com_oportunidade: number;
  devolvidas: number;
  transferidas: number;
  solicitacoes: number;
}

export function useResumoLotes() {
  const [rows, setRows] = useState<ResumoLote[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("carteira_resumo_lotes" as any);
    setRows(((data ?? []) as unknown) as ResumoLote[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

async function rpc(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn as any, args as any);
  if (error) throw error;
  return data;
}

export const registrarTentativa = (atribuicaoId: string, tipo: string, descricao?: string, resultado?: string) =>
  rpc("carteira_registrar_tentativa", {
    _atribuicao_id: atribuicaoId, _tipo: tipo,
    _descricao: descricao?.trim() || null, _resultado: resultado?.trim() || null,
  });

export const marcarContatoEstabelecido = (atribuicaoId: string, descricao?: string) =>
  rpc("carteira_marcar_contato", { _atribuicao_id: atribuicaoId, _descricao: descricao?.trim() || null });

export const agendarProximaAcao = (atribuicaoId: string, quandoISO: string, titulo?: string, descricao?: string) =>
  rpc("carteira_agendar_proxima", {
    _atribuicao_id: atribuicaoId, _quando: quandoISO,
    _titulo: titulo?.trim() || null, _descricao: descricao?.trim() || null,
  });

export const solicitarCarteira = (atribuicaoId: string, tipo: "devolucao" | "transferencia", motivo: string) =>
  rpc("carteira_solicitar", { _atribuicao_id: atribuicaoId, _tipo: tipo, _motivo: motivo });

export const gestorAcaoCarteira = (
  atribuicaoId: string, acao: "transferir" | "devolver", novoCorretor?: string | null, motivo?: string
) => rpc("carteira_gestor_acao", {
  _atribuicao_id: atribuicaoId, _acao: acao,
  _novo_corretor: novoCorretor || null, _motivo: motivo?.trim() || null,
});

export const resolverSolicitacaoCarteira = (
  atribuicaoId: string, acao: "aprovar" | "recusar", novoCorretor?: string | null, observacao?: string
) => rpc("carteira_resolver_solicitacao", {
  _atribuicao_id: atribuicaoId, _acao: acao,
  _novo_corretor: novoCorretor || null, _observacao: observacao?.trim() || null,
});

export const editarLote = (
  loteId: string, corretorId: string, quantidade: number, prazo: number,
  objetivo: string, observacoes: string
) => rpc("carteira_editar_lote", {
  _lote_id: loteId, _corretor_id: corretorId, _quantidade: quantidade,
  _prazo: prazo, _objetivo: objetivo?.trim() || null, _observacoes: observacoes?.trim() || null,
});

export const excluirLote = (loteId: string) =>
  rpc("carteira_excluir_lote", { _lote_id: loteId });

export const cancelarLote = (loteId: string, motivo: string) =>
  rpc("carteira_cancelar_lote", { _lote_id: loteId, _motivo: motivo?.trim() || "Cancelado pelo gestor" });

/** Situação derivada da atribuição, usada nas telas de carteira. */
export type SituacaoCarteira = "pendente" | "atrasada" | "em_atendimento" | "estabelecido" | "encerrada";

export function situacaoAtribuicao(a: AtribuicaoCarteira): SituacaoCarteira {
  if (a.encerrada_em) return "encerrada";
  if (a.contato_estabelecido_em) return "estabelecido";
  const atrasada = a.prazo_primeiro_contato ? Date.parse(a.prazo_primeiro_contato) < Date.now() : false;
  if (atrasada) return "atrasada";
  if (a.tentativas > 0) return "em_atendimento";
  return "pendente";
}

/* ============ Fase 4: alertas e configuração ============ */

export interface AlertasCorretor {
  atrasadas: number;
  acao_vencida: number;
  sem_proxima_acao: number;
  prazo_hoje: number;
  total_ativas: number;
}

export function useAlertasCorretor(corretor?: string | null) {
  const [dados, setDados] = useState<AlertasCorretor | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.rpc("carteira_alertas_corretor" as any, { _corretor: corretor || null });
    const row = Array.isArray(data) ? (data[0] as any) : (data as any);
    setDados(row ?? null);
  }, [corretor]);
  useEffect(() => { load(); }, [load]);
  return { dados, reload: load };
}

export interface AlertaGestor {
  corretor_id: string;
  corretor_nome: string;
  ativas: number;
  atrasadas: number;
  acao_vencida: number;
  solicitacoes: number;
  devolucoes_automaticas_7d: number;
}

export function useAlertasGestor() {
  const [rows, setRows] = useState<AlertaGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("carteira_alertas_gestor" as any);
    setRows(((data ?? []) as unknown) as AlertaGestor[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export interface DevolucaoAutomatica {
  conta_id: string;
  conta_nome: string;
  corretor_nome: string | null;
  lote_nome: string | null;
  devolvida_em: string;
  observacao: string | null;
}

export function useDevolucoesAutomaticas(dias = 7) {
  const [rows, setRows] = useState<DevolucaoAutomatica[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.rpc("carteira_devolucoes_automaticas" as any, { _dias: dias });
    setRows(((data ?? []) as unknown) as DevolucaoAutomatica[]);
  }, [dias]);
  useEffect(() => { load(); }, [load]);
  return { rows, reload: load };
}

export interface CarteiraConfig {
  devolucao_automatica: boolean;
  dias_devolucao_automatica: number;
  dias_sem_proxima_acao: number;
  emails_resumo: boolean;
  ranking_visivel: boolean;
}

export function useCarteiraConfig() {
  const [config, setConfig] = useState<CarteiraConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("carteira_config" as any)
      .select("devolucao_automatica, dias_devolucao_automatica, dias_sem_proxima_acao, emails_resumo, ranking_visivel")
      .eq("id", true)
      .maybeSingle();
    setConfig((data as any) ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  return { config, loading, reload: load };
}

export async function salvarCarteiraConfig(valores: CarteiraConfig) {
  const { error } = await supabase
    .from("carteira_config" as any)
    .update({ ...valores, updated_at: new Date().toISOString() } as any)
    .eq("id", true);
  if (error) throw error;
}

/* ============ Fase 5: ranking e gamificação ============ */

export interface LinhaRanking {
  corretor_id: string;
  corretor_nome: string;
  posicao: number;
  score: number;
  recebidas: number;
  contato_estabelecido: number;
  no_prazo: number;
  oportunidades: number;
  fechamentos: number;
  devolvidas: number;
  transferidas: number;
  ativas: number;
  pct_contato: number;
  pct_no_prazo: number;
  pct_oportunidade: number;
  pct_fechamento: number;
  pct_devolucao: number;
  horas_medias: number | null;
}

export function useRankingCorretores(inicioISO: string, fimISO: string) {
  const [rows, setRows] = useState<LinhaRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("carteira_ranking_corretores" as any, {
      _inicio: inicioISO, _fim: fimISO,
    });
    if (error) {
      console.error("carteira_ranking_corretores:", error.message);
      setRows([]);
    } else {
      setRows(((data ?? []) as unknown) as LinhaRanking[]);
    }
    setLoading(false);
  }, [inicioISO, fimISO]);
  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export interface MinhaPosicao {
  corretor_id: string;
  corretor_nome: string;
  posicao: number;
  score: number;
  recebidas: number;
  contato_estabelecido: number;
  no_prazo: number;
  oportunidades: number;
  fechamentos: number;
  pct_contato: number;
  pct_no_prazo: number;
  pct_oportunidade: number;
  pct_fechamento: number;
  pct_devolucao: number;
  meta_contatos: number;
  meta_oportunidades: number;
  meta_fechamentos: number;
  total_corretores: number;
}

export function useMinhaPosicao(corretor?: string | null) {
  const [dados, setDados] = useState<MinhaPosicao | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("carteira_minha_posicao" as any, {
      _corretor: corretor || null,
    });
    if (error) {
      console.error("carteira_minha_posicao:", error.message);
      setDados(null);
      return;
    }
    const row = Array.isArray(data) ? (data[0] as any) : (data as any);
    setDados((row as MinhaPosicao) ?? null);
  }, [corretor]);
  useEffect(() => { load(); }, [load]);
  return { dados, reload: load };
}

export interface CarteiraMeta {
  id: string;
  corretor_id: string;
  ano_mes: string;
  meta_contatos: number;
  meta_oportunidades: number;
  meta_fechamentos: number;
}

export function useCarteiraMetas(anoMes: string) {
  const [rows, setRows] = useState<CarteiraMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carteira_metas" as any)
      .select("id, corretor_id, ano_mes, meta_contatos, meta_oportunidades, meta_fechamentos")
      .eq("ano_mes", anoMes);
    if (error) {
      console.error("carteira_metas:", error.message);
      setRows([]);
    } else {
      setRows(((data ?? []) as unknown) as CarteiraMeta[]);
    }
    setLoading(false);
  }, [anoMes]);
  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export async function salvarMetaCorretor(corretorId: string, anoMes: string, contatos: number, oportunidades: number, fechamentos: number) {
  const { error } = await supabase.rpc("carteira_metas_upsert" as any, {
    _corretor: corretorId,
    _ano_mes: anoMes,
    _contatos: contatos,
    _oportunidades: oportunidades,
    _fechamentos: fechamentos,
  });
  if (error) throw error;
}

/** Selos automáticos derivados dos dados do ranking. */
export function selosDoRanking(r: LinhaRanking | MinhaPosicao): string[] {
  const selos: string[] = [];
  if (r.pct_no_prazo >= 90) selos.push("Pontual");
  if (r.pct_contato >= 80) selos.push("Contato firme");
  if (r.pct_oportunidade >= 40) selos.push("Conversor");
  if ("fechamentos" in r && r.fechamentos >= 3) selos.push("Fechador");
  if (r.pct_devolucao < 10 && r.recebidas > 0) selos.push("Baixa devolução");
  return selos;
}
