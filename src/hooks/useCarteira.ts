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

  const load = useCallback(async () => {
    if (!operacaoId) { setLotes([]); setItens([]); return; }
    setLoading(true);
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("carteira_lotes" as any).select("*").eq("operacao_id", operacaoId).order("numero"),
      supabase
        .from("carteira_selecao_itens" as any)
        .select("conta_id, lote_id, origem, contas(nome, telefone, email, etapa_funil, responsavel_id)")
        .eq("operacao_id", operacaoId),
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
