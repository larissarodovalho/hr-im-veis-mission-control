// Helpers compartilhados de Leads/CRM

export const ETAPAS = [
  "Prospecção",
  "Qualificação",
  "Visita",
  "Proposta",
  "Negociação",
  "Fechamento",
  "Desqualificado",
] as const;
export type Etapa = (typeof ETAPAS)[number];

export const ORIGENS = [
  "Site",
  "Instagram",
  "Facebook",
  "Google Ads",
  "Indicação",
  "Portais",
  "Carteira",
  "Outro",
];

export const STATUS = [
  "Novo",
  "Em atendimento",
  "Aguardando retorno",
  "Convertido",
  "Perdido",
];

export const TEMPERATURAS = ["frio", "morno", "quente"] as const;
export type Temperatura = (typeof TEMPERATURAS)[number];

export const ETAPA_COLORS: Record<string, string> = {
  "Prospecção": "border-t-blue-500",
  "Qualificação": "border-t-cyan-500",
  Visita: "border-t-violet-500",
  Proposta: "border-t-amber-500",
  Negociação: "border-t-orange-500",
  Fechamento: "border-t-emerald-500",
  Desqualificado: "border-t-rose-500",
};

export const TEMP_META: Record<Temperatura, { label: string; emoji: string; cls: string }> = {
  frio: { label: "Frio", emoji: "🧊", cls: "bg-sky-500/10 text-sky-700 border-sky-500/30" },
  morno: { label: "Morno", emoji: "🌤️", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  quente: { label: "Quente", emoji: "🔥", cls: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
};

export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function slaColor(days: number | null): string {
  if (days === null) return "bg-muted text-muted-foreground";
  if (days < 3) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  if (days <= 7) return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  return "bg-rose-500/15 text-rose-700 border-rose-500/30";
}

export function slaLabel(days: number | null): string {
  if (days === null) return "sem contato";
  if (days === 0) return "hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const INTERACAO_TIPOS = [
  { value: "ligacao", label: "Ligação", icon: "📞" },
  { value: "mensagem", label: "Mensagem", icon: "💬" },
  { value: "visita", label: "Visita", icon: "🏠" },
  { value: "reuniao", label: "Reunião", icon: "📅" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "nota", label: "Nota", icon: "📝" },
] as const;

export const INTERACAO_RESULTADOS = [
  "atendeu",
  "nao_atendeu",
  "retornar",
  "sem_interesse",
  "interessado",
  "agendou",
  "outro",
];
