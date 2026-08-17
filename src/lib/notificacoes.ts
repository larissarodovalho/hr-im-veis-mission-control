// Notificações do CRM (Etapa 14 dos links temporários).
import { supabase } from "@/integrations/supabase/client";

export type NotificacaoTipo =
  | "link_primeiro_acesso"
  | "link_gostei"
  | "link_rejeitou"
  | "link_solicitou_informacoes"
  | "link_solicitou_visita"
  | "link_expirou_sem_abertura"
  | "link_imovel_indisponivel";

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  link_id: string | null;
  imovel_id: string | null;
  conta_id: string | null;
  oportunidade_id: string | null;
  lida_em: string | null;
  created_at: string;
}

export interface NotificacaoPrefs {
  link_primeiro_acesso: boolean;
  link_feedback: boolean;
  link_expirou_sem_abertura: boolean;
  imovel_indisponivel: boolean;
}

export const PREFS_PADRAO: NotificacaoPrefs = {
  link_primeiro_acesso: true,
  link_feedback: true,
  link_expirou_sem_abertura: true,
  imovel_indisponivel: true,
};

export const PREF_LABEL: Record<keyof NotificacaoPrefs, string> = {
  link_primeiro_acesso: "Primeiro acesso ao link",
  link_feedback: "Feedback do cliente (gostei, recusa, informações, visita)",
  link_expirou_sem_abertura: "Link expirou sem abertura",
  imovel_indisponivel: "Imóvel do link ficou vendido/indisponível",
};

/** Chave de idempotência espelhando a usada no banco (usada em testes). */
export function chaveEvento(tipo: string, linkId: string, eventoId: string): string {
  return tipo === "abertura" ? `link_abertura:${linkId}` : `${tipo}:${eventoId}`;
}

/** Atalho principal da notificação dentro do CRM. */
export function destinoNotificacao(n: Notificacao): string {
  if (n.oportunidade_id) return `/crm/oportunidades?oportunidade=${n.oportunidade_id}`;
  if (n.conta_id) return `/crm/contas/${n.conta_id}`;
  if (n.link_id) return `/crm/imoveis?tab=links&link=${n.link_id}`;
  return "/crm/imoveis?tab=links";
}

export async function listarNotificacoes(userId: string, limite = 30) {
  const { data, error } = await supabase
    .from("notificacoes" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as unknown as Notificacao[];
}

export async function marcarLida(id: string) {
  await supabase
    .from("notificacoes" as any)
    .update({ lida_em: new Date().toISOString() } as any)
    .eq("id", id);
}

export async function marcarTodasLidas(userId: string) {
  await supabase
    .from("notificacoes" as any)
    .update({ lida_em: new Date().toISOString() } as any)
    .eq("user_id", userId)
    .is("lida_em", null);
}

export async function excluirNotificacao(id: string) {
  await supabase.from("notificacoes" as any).delete().eq("id", id);
}

export async function carregarPrefs(userId: string): Promise<NotificacaoPrefs> {
  const { data } = await supabase
    .from("notificacao_preferencias" as any)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { ...PREFS_PADRAO, ...((data ?? {}) as Partial<NotificacaoPrefs>) };
}

export async function salvarPrefs(userId: string, prefs: NotificacaoPrefs) {
  const { error } = await supabase
    .from("notificacao_preferencias" as any)
    .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() } as any, {
      onConflict: "user_id",
    });
  if (error) throw error;
}
