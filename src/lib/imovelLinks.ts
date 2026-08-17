// Criação e gestão dos links temporários de imóveis (CRM).
import { supabase } from "@/integrations/supabase/client";
import { sincronizarFotosCompartilhadas } from "@/lib/uploadFotoImovel";

export type LinkEstado = "ativo" | "revogado" | "substituido" | "expirado";

export interface LinkCompartilhado {
  id: string;
  tipo: "imovel" | "selecao";
  token: string;
  codigo_referencia: string;
  titulo_selecao: string | null;
  mensagem_apresentacao: string | null;
  conta_id: string | null;
  oportunidade_id: string | null;
  corretor_id: string;
  created_by: string;
  validade_minutos: number;
  inicio_validade: "criacao" | "compartilhamento" | "primeiro_acesso";
  validade_iniciada_em: string | null;
  expira_em: string | null;
  estado_operacional: LinkEstado;
  primeiro_acesso_em: string | null;
  ultimo_acesso_em: string | null;
  total_acessos: number;
  visitantes_unicos: number;
  configuracao_publica: Record<string, unknown>;
  revogado_em: string | null;
  motivo_revogacao: string | null;
  compartilhado_em: string | null;
  canal_compartilhamento: string | null;
  substitui_link_id: string | null;
  created_at: string;
}

/** Status operacional exibido na central de links (Etapa 13). */
export type LinkStatusUI =
  | "aguardando_inicio" | "nao_aberto" | "aberto" | "ativo"
  | "proximo_expirar" | "expirado" | "revogado" | "substituido"
  | "convertido_interesse" | "convertido_oportunidade" | "convertido_venda";

export const STATUS_LABEL: Record<LinkStatusUI, string> = {
  aguardando_inicio: "Aguardando início",
  nao_aberto: "Não aberto",
  aberto: "Aberto",
  ativo: "Ativo",
  proximo_expirar: "Próximo de expirar",
  expirado: "Expirado",
  revogado: "Revogado",
  substituido: "Substituído",
  convertido_interesse: "Convertido em interesse",
  convertido_oportunidade: "Convertido em oportunidade",
  convertido_venda: "Convertido em venda",
};

/**
 * Status apresentado na central. `conversao` vem dos eventos/vínculos do link
 * e tem prioridade sobre o ciclo de vida quando existe resultado comercial.
 */
export function statusUI(
  l: LinkCompartilhado,
  conversao?: "interesse" | "oportunidade" | "venda" | null,
): LinkStatusUI {
  const base = estadoAtual(l);
  if (base === "revogado") return "revogado";
  if (base === "substituido") return "substituido";
  if (conversao === "venda") return "convertido_venda";
  if (conversao === "oportunidade") return "convertido_oportunidade";
  if (conversao === "interesse") return "convertido_interesse";
  if (base === "expirado") return l.primeiro_acesso_em ? "expirado" : "nao_aberto";
  if (!l.expira_em && l.inicio_validade === "primeiro_acesso" && !l.primeiro_acesso_em)
    return "aguardando_inicio";
  if (l.expira_em) {
    const restante = new Date(l.expira_em).getTime() - Date.now();
    if (restante <= 2 * 3_600_000) return "proximo_expirar";
  }
  return l.primeiro_acesso_em ? "aberto" : "ativo";
}

/** Exclusão definitiva (apenas admin, conforme política do banco). */
export async function excluirLink(id: string) {
  const { error } = await supabase.from("imovel_links_compartilhados").delete().eq("id", id);
  if (error) throw error;
}

/** Marca manualmente um link como substituído, preservando o histórico. */
export async function marcarSubstituido(id: string) {
  const { error } = await supabase
    .from("imovel_links_compartilhados")
    .update({ estado_operacional: "substituido" } as any)
    .eq("id", id);
  if (error) throw error;
}

/** Token opaco de 43 caracteres (256 bits em base64url). */
export function gerarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Código curto que o cliente pode citar ao corretor (ex.: HR-7K3QP2). */
export function gerarCodigoReferencia(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "HR-" + Array.from(bytes).map((b) => alfabeto[b % alfabeto.length]).join("");
}

export const VALIDADES = [
  { valor: 30, label: "30 minutos" },
  { valor: 60, label: "1 hora" },
  { valor: 90, label: "1 hora e 30" },
  { valor: 120, label: "2 horas" },
  { valor: 60 * 6, label: "6 horas" },
  { valor: 60 * 24, label: "24 horas" },
  { valor: 60 * 24 * 3, label: "3 dias" },
  { valor: 60 * 24 * 7, label: "7 dias" },
  { valor: 60 * 24 * 15, label: "15 dias" },
  { valor: 60 * 24 * 30, label: "30 dias" },
];

/** Limites do prazo personalizado (em minutos). */
export const VALIDADE_MIN = 15;
export const VALIDADE_MAX = 60 * 24 * 30;


export const INICIOS = [
  { valor: "criacao", label: "Na criação do link" },
  { valor: "primeiro_acesso", label: "No primeiro acesso do cliente" },
];

export function urlDoLink(token: string) {
  return `${window.location.origin}/l/${token}`;
}

export function estadoAtual(l: LinkCompartilhado): LinkEstado {
  if (l.estado_operacional === "revogado" || l.revogado_em) return "revogado";
  if (l.estado_operacional === "substituido") return "substituido";
  if (l.expira_em && new Date(l.expira_em) <= new Date()) return "expirado";
  return l.estado_operacional === "expirado" ? "expirado" : "ativo";
}

export function tempoRestante(l: LinkCompartilhado): string {
  if (!l.expira_em) return "Inicia no 1º acesso";
  const ms = new Date(l.expira_em).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export interface CriarLinkInput {
  imovelIds: string[];
  tituloSelecao?: string | null;
  mensagem?: string | null;
  contaId?: string | null;
  oportunidadeId?: string | null;
  validadeMinutos: number;
  inicioValidade: "criacao" | "primeiro_acesso";
  exibirValor: boolean;
  /** endereco_completo exige autorização de admin/gestor (validado por trigger no banco). */
  localizacao: "bairro_cidade" | "cidade" | "oculto" | "endereco_completo";
  permitirWhatsapp: boolean;
  permitirAgendarVisita: boolean;
  substituiLinkId?: string | null;
}

/** Cria o link, espelha as fotos no bucket privado e grava os itens. */
export async function criarLinkCompartilhado(input: CriarLinkInput) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sessão expirada");
  if (!input.imovelIds.length) throw new Error("Selecione ao menos um imóvel");

  const token = gerarToken();
  const codigo = gerarCodigoReferencia();
  const agora = new Date();
  const expira =
    input.inicioValidade === "criacao"
      ? new Date(agora.getTime() + input.validadeMinutos * 60_000).toISOString()
      : null;

  const { data: link, error } = await supabase
    .from("imovel_links_compartilhados")
    .insert({
      tipo: input.imovelIds.length > 1 ? "selecao" : "imovel",
      token,
      codigo_referencia: codigo,
      titulo_selecao: input.tituloSelecao || null,
      mensagem_apresentacao: input.mensagem || null,
      conta_id: input.contaId || null,
      oportunidade_id: input.oportunidadeId || null,
      corretor_id: uid,
      created_by: uid,
      validade_minutos: input.validadeMinutos,
      inicio_validade: input.inicioValidade,
      validade_iniciada_em: input.inicioValidade === "criacao" ? agora.toISOString() : null,
      expira_em: expira,
      estado_operacional: "ativo",
      substitui_link_id: input.substituiLinkId || null,
      configuracao_publica: {
        permitir_whatsapp: input.permitirWhatsapp,
        permitir_agendar_visita: input.permitirAgendarVisita,
      },
    } as any)
    .select("*")
    .single();

  if (error) throw error;

  // Espelha as fotos com marca d'água no bucket privado usado pelo link.
  const { data: imoveis } = await supabase
    .from("imoveis")
    .select("id, fotos")
    .in("id", input.imovelIds);
  const todas = (imoveis ?? []).flatMap((i: any) => i.fotos ?? []);
  if (todas.length) {
    try { await sincronizarFotosCompartilhadas(todas); } catch { /* segue sem bloquear */ }
  }

  const itens = input.imovelIds.map((id, idx) => ({
    link_id: link.id,
    imovel_id: id,
    ordem: idx,
    configuracao_publica: {
      exibir_valor: input.exibirValor,
      localizacao: input.localizacao,
    },
  }));
  const { error: itErr } = await supabase.from("imovel_link_itens").insert(itens as any);
  if (itErr) throw itErr;

  if (input.substituiLinkId) {
    await supabase
      .from("imovel_links_compartilhados")
      .update({ estado_operacional: "substituido" } as any)
      .eq("id", input.substituiLinkId);
  }

  return link as unknown as LinkCompartilhado;
}

export async function revogarLink(id: string, motivo?: string) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("imovel_links_compartilhados")
    .update({
      estado_operacional: "revogado",
      revogado_em: new Date().toISOString(),
      revogado_por: auth.user?.id ?? null,
      motivo_revogacao: motivo || null,
    } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function marcarCompartilhado(id: string, canal: string) {
  await supabase
    .from("imovel_links_compartilhados")
    .update({ compartilhado_em: new Date().toISOString(), canal_compartilhamento: canal } as any)
    .eq("id", id);
}
