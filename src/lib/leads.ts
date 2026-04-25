// Adapter mapping HR Imóveis schema → Brazil Lands canonical types.
// Tabelas HR: leads, contas, interacoes, reunioes, ligacoes, imoveis, visitas, profiles, user_roles, whatsapp_*

export type Stage =
  | 'Prospecção'
  | 'Qualificação'
  | 'Apresentação'
  | 'Visita'
  | 'Proposta'
  | 'Negociação'
  | 'Fechamento'
  | 'Perdido';

export type Temperature = 'frio' | 'morno' | 'quente';

export const TEMPERATURES: Record<Temperature, { label: string; emoji: string; className: string }> = {
  frio: { label: 'Frio', emoji: '🧊', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  morno: { label: 'Morno', emoji: '🌤️', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  quente: { label: 'Quente', emoji: '🔥', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'Prospecção', label: 'Prospecção', color: 'bg-blue-500' },
  { id: 'Qualificação', label: 'Qualificação', color: 'bg-cyan-500' },
  { id: 'Apresentação', label: 'Apresentação', color: 'bg-indigo-500' },
  { id: 'Visita', label: 'Visita', color: 'bg-amber-500' },
  { id: 'Proposta', label: 'Proposta', color: 'bg-orange-500' },
  { id: 'Negociação', label: 'Negociação', color: 'bg-purple-500' },
  { id: 'Fechamento', label: 'Fechamento', color: 'bg-success' },
  { id: 'Perdido', label: 'Perdido', color: 'bg-danger' },
];

export const SOURCES: Record<string, { label: string; emoji: string }> = {
  meta_ads: { label: 'Meta Ads', emoji: '📘' },
  google_ads: { label: 'Google Ads', emoji: '🔍' },
  ia_chat: { label: 'Chat IA', emoji: '🤖' },
  webhook: { label: 'Webhook', emoji: '🔗' },
  manual: { label: 'Manual', emoji: '✍️' },
  whatsapp: { label: 'WhatsApp', emoji: '💬' },
  indicacao: { label: 'Indicação', emoji: '🤝' },
  site: { label: 'Site', emoji: '🌐' },
};

export const INTERESTS: Record<string, string> = {
  compra: 'Compra',
  venda: 'Venda',
  locacao: 'Locação',
  arrendamento: 'Arrendamento',
  outro: 'Outro',
};

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function slaColor(days: number | null): string {
  if (days === null) return 'bg-muted text-muted-foreground';
  if (days < 1) return 'bg-success/15 text-success border-success/30';
  if (days <= 3) return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-danger/15 text-danger border-danger/30';
}

export function slaLabel(days: number | null): string {
  if (days === null) return 'Sem contato';
  if (days < 1) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

// ===== Compatibilidade com componentes antigos do HR (serão removidos depois) =====
export const ETAPAS = STAGES.map(s => s.id);
export const ORIGENS = Object.keys(SOURCES);
export const STATUS = ['Novo', 'Em contato', 'Qualificado', 'Convertido', 'Perdido'];
export const TEMPERATURAS = TEMPERATURES;
export const ETAPA_COLORS: Record<string, string> = STAGES.reduce((acc, s) => {
  acc[s.id] = s.color;
  return acc;
}, {} as Record<string, string>);
export const TEMP_META = TEMPERATURES;
export const INTERACAO_TIPOS = ['ligacao', 'mensagem', 'email', 'visita', 'reuniao', 'nota'];
export const INTERACAO_RESULTADOS = ['atendeu', 'nao_atendeu', 'retornar', 'interessado', 'sem_interesse', 'agendou'];
