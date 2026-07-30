export type EtapaFunil =
  | "a_contatar"
  | "contatado"
  | "sem_retorno"
  | "contato_estabelecido"
  | "contato_cancelado";

export type EtapaFunilLegado =
  | "captacao_imovel"
  | "reuniao"
  | "visita"
  | "permuta"
  | "proposta"
  | "fechado"
  | "perdido"
  | "parceiros";

export const ETAPAS: { id: EtapaFunil; label: string; color: string }[] = [
  { id: "a_contatar", label: "A contatar", color: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
  { id: "contatado", label: "Contatado", color: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  { id: "sem_retorno", label: "Sem retorno", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { id: "contato_estabelecido", label: "Contato estabelecido", color: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30" },
  { id: "contato_cancelado", label: "Contato cancelado", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

// Etapas comerciais antigas — preservadas no banco como legado até o módulo de Oportunidades
export const ETAPAS_LEGADO: { id: EtapaFunilLegado; label: string; color: string }[] = [
  { id: "captacao_imovel", label: "Captação/Imóvel", color: "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30" },
  { id: "reuniao", label: "Reunião", color: "bg-violet-500/15 text-violet-700 border-violet-500/30" },
  { id: "visita", label: "Visita", color: "bg-teal-500/15 text-teal-700 border-teal-500/30" },
  { id: "permuta", label: "Permuta", color: "bg-orange-500/15 text-orange-700 border-orange-500/30" },
  { id: "proposta", label: "Proposta", color: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  { id: "fechado", label: "Fechado", color: "bg-success/15 text-success border-success/30" },
  { id: "perdido", label: "Oportunidade futura", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { id: "parceiros", label: "Parceiros", color: "bg-accent/15 text-accent-foreground border-accent/30" },
];

export const isEtapaLegado = (id?: string | null) =>
  !!id && ETAPAS_LEGADO.some((e) => e.id === id);

export const etapaLabel = (id: string) =>
  ETAPAS.find((e) => e.id === id)?.label ??
  ETAPAS_LEGADO.find((e) => e.id === id)?.label ??
  "A contatar";

export const etapaColor = (id: string) =>
  ETAPAS.find((e) => e.id === id)?.color ??
  ETAPAS_LEGADO.find((e) => e.id === id)?.color ??
  ETAPAS[0].color;

// ---- Categoria principal da conta ----
export type CategoriaConta = "carteira" | "marketing";

export const categoriaDe = (c: { categoria?: string | null; tags?: string[] | null }): CategoriaConta | null => {
  if (c.categoria === "carteira" || c.categoria === "marketing") return c.categoria;
  const tags = (c.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes("carteira")) return "carteira";
  if (tags.includes("marketing")) return "marketing";
  return null;
};

export const CATEGORIA_LABEL: Record<CategoriaConta, string> = {
  carteira: "Carteira",
  marketing: "Marketing",
};

// ---- Destino comercial (ação da etapa Contato estabelecido — não é coluna do funil) ----
export type DestinoComercial =
  | "captacao_reuniao"
  | "comprar_oportunidade"
  | "vender_hrx_producoes"
  | "oportunidade_futura";

export const DESTINOS_COMERCIAIS: { id: DestinoComercial; label: string }[] = [
  { id: "captacao_reuniao", label: "Captação / Reunião" },
  { id: "comprar_oportunidade", label: "Comprar — Oportunidade" },
  { id: "vender_hrx_producoes", label: "Vender — HRX Produções" },
  { id: "oportunidade_futura", label: "Oportunidade futura" },
];

export const destinoLabel = (id?: string | null) =>
  DESTINOS_COMERCIAIS.find((d) => d.id === id)?.label ?? null;

// ---- Motivos de cancelamento (etapa Contato cancelado) ----
export const MOTIVOS_CANCELAMENTO = [
  "Sem interesse",
  "Contato inválido",
  "Não procura mais imóvel",
  "Fora do perfil",
  "Fora da região de atuação",
  "Cadastro duplicado",
  "Solicitou não receber contatos",
  "Spam",
  "Outro",
];
