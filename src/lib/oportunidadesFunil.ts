// Funil de Oportunidades de Negócio — compra de imóvel
// Valores internos travados pela constraint oportunidades_estagio_check:
// ('nova','buscando','visita','proposta','ganha','perdida')
// "Proposta" é apenas o rótulo exibido do valor interno `proposta`.

export type EstagioOportunidade = "nova" | "buscando" | "visita" | "proposta" | "ganha" | "perdida";

export const ESTAGIOS = [
  { key: "nova", label: "Nova", color: "bg-slate-500/10 border-slate-500/30" },
  { key: "buscando", label: "Buscando imóvel", color: "bg-blue-500/10 border-blue-500/30" },
  { key: "visita", label: "Visita agendada", color: "bg-indigo-500/10 border-indigo-500/30" },
  { key: "proposta", label: "Proposta", color: "bg-amber-500/10 border-amber-500/30" },
  { key: "ganha", label: "Ganha", color: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "perdida", label: "Perdida", color: "bg-zinc-500/10 border-zinc-500/30" },
] as const;

export const ESTAGIOS_FINAIS: string[] = ["ganha", "perdida"];
export const isEstagioFinal = (e?: string | null) => !!e && ESTAGIOS_FINAIS.includes(e);
export const isAtiva = (op: any) => !isEstagioFinal(op?.estagio);
export const estagioLabel = (key?: string | null) =>
  ESTAGIOS.find((e) => e.key === key)?.label ?? key ?? "—";

export const MOTIVOS_PERDA = [
  "Desistiu da compra",
  "Comprou com outra imobiliária",
  "Adiou a compra",
  "Não encontrou imóvel compatível",
  "Sem capacidade financeira",
  "Financiamento não aprovado",
  "Sem retorno",
  "Mudou de cidade ou região",
  "Mudou o tipo de imóvel procurado",
  "Oportunidade duplicada",
  "Outro",
] as const;

export type DestinoContaPerda = "oportunidade_futura" | "continuar_relacionamento" | "contato_cancelado";

export const DESTINOS_CONTA_PERDA: { id: DestinoContaPerda; label: string; desc: string }[] = [
  {
    id: "oportunidade_futura",
    label: "Oportunidade futura",
    desc: "Mantém a conta na categoria original, agenda o próximo contato e cria uma tarefa futura.",
  },
  {
    id: "continuar_relacionamento",
    label: "Continuar relacionamento",
    desc: "Mantém a conta em Contato estabelecido, sem oportunidade ativa, com uma próxima ação.",
  },
  {
    id: "contato_cancelado",
    label: "Contato cancelado",
    desc: "Move a conta para Contato cancelado (motivo obrigatório). Cadastro e histórico preservados.",
  },
];

export const STATUS_VISITA = [
  { id: "agendada", label: "Agendada" },
  { id: "confirmada", label: "Confirmada" },
  { id: "realizada", label: "Realizada" },
  { id: "cancelada", label: "Cancelada" },
  { id: "reagendada", label: "Reagendada" },
  { id: "nao_compareceu", label: "Cliente não compareceu" },
] as const;
export const statusVisitaLabel = (id?: string | null) => STATUS_VISITA.find((s) => s.id === id)?.label ?? id ?? "—";

export const STATUS_PROPOSTA = [
  { id: "em_preparacao", label: "Em preparação" },
  { id: "enviada", label: "Enviada" },
  { id: "em_analise", label: "Em análise" },
  { id: "contraproposta", label: "Contraproposta" },
  { id: "aceita", label: "Aceita" },
  { id: "recusada", label: "Recusada" },
  { id: "expirada", label: "Expirada" },
  { id: "cancelada", label: "Cancelada" },
] as const;
export const statusPropostaLabel = (id?: string | null) => STATUS_PROPOSTA.find((s) => s.id === id)?.label ?? id ?? "—";

export const STATUS_VINCULO_IMOVEL = [
  { id: "vinculado", label: "Vinculado" },
  { id: "apresentado", label: "Apresentado" },
  { id: "rejeitado", label: "Rejeitado" },
] as const;
export const statusVinculoLabel = (id?: string | null) => STATUS_VINCULO_IMOVEL.find((s) => s.id === id)?.label ?? id ?? "—";

export const categoriaLabel = (c?: string | null) =>
  c === "carteira" ? "Carteira" : c === "marketing" ? "Marketing" : null;

// Mínimos exigidos para sair de "Nova" (diagnóstico) para "Buscando imóvel"
export function diagnosticoPendencias(op: any): string[] {
  const p: string[] = [];
  if (!op?.conta_id) p.push("Conta vinculada");
  if (!op?.descricao_busca?.trim()) p.push("Descrição da busca");
  if (!op?.tipo_imovel?.trim()) p.push("Tipo de imóvel");
  if (!op?.cidade?.trim() && !op?.bairro?.trim()) p.push("Cidade ou região");
  if (!op?.valor_alvo) p.push("Valor-alvo");
  if (!op?.corretor_id) p.push("Corretor responsável");
  return p;
}

export function tempoNaEtapa(desde?: string | null): string {
  if (!desde) return "";
  const ms = Date.now() - new Date(desde).getTime();
  if (ms < 0) return "";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const m = Math.floor(d / 30);
  return `${m} ${m === 1 ? "mês" : "meses"}`;
}

export const PRIO_COLORS: Record<string, string> = {
  alta: "bg-red-500/15 text-red-500 border-red-500/30",
  media: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  baixa: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};
