// Adapter mapping HR Imóveis schema → Brazil Lands canonical types.
// Tabelas HR: leads, contas, interacoes, reunioes, ligacoes, imoveis, visitas, profiles, user_roles, whatsapp_*

import { fmtDayMonthTime } from './datetime';

export type ActiveStage =
  | 'Novo Lead'
  | 'Pré-atendimento'
  | 'Em Contato'
  | 'Conversa Ativa'
  | 'Perdido';

export type Stage = ActiveStage;

export type Temperature = 'frio' | 'morno' | 'quente';

export const TEMPERATURES: Record<Temperature, { label: string; emoji: string; className: string }> = {
  frio: { label: 'Frio', emoji: '🧊', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  morno: { label: 'Morno', emoji: '🌤️', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  quente: { label: 'Quente', emoji: '🔥', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

// Funil principal da aba Leads (5 colunas — todas visíveis no Kanban)
export const STAGES: { id: ActiveStage; label: string; color: string }[] = [
  { id: 'Novo Lead', label: 'Novo Lead', color: 'bg-blue-500' },
  { id: 'Pré-atendimento', label: 'Pré-atendimento', color: 'bg-cyan-500' },
  { id: 'Em Contato', label: 'Em Contato', color: 'bg-indigo-500' },
  { id: 'Conversa Ativa', label: 'Conversa Ativa', color: 'bg-violet-500' },
  { id: 'Perdido', label: 'Perdido', color: 'bg-danger' },
];

export const ALL_STAGES: { id: Stage; label: string; color: string }[] = STAGES;

export const stageLabel = (id: string | null | undefined): string =>
  ALL_STAGES.find((s) => s.id === id)?.label ?? id ?? '—';

// Tipo de acompanhamento (IA e manual são formas de acompanhamento, não etapas)
export type TipoAcompanhamento = 'ia' | 'manual' | 'corretor';

export const TIPO_ACOMPANHAMENTO: Record<TipoAcompanhamento, { label: string; emoji: string; className: string }> = {
  ia: { label: 'IA', emoji: '🤖', className: 'bg-violet-500/15 text-violet-600 border-violet-500/30' },
  manual: { label: 'Manual', emoji: '👤', className: 'bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30' },
  corretor: { label: 'Corretor', emoji: '🧑‍💼', className: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30' },
};

// Sequência de tentativas da etapa "Em Contato" (registradas no histórico, não são colunas)
// prazoHoras: vencimento em horas corridas a partir da entrada do lead no sistema
export const TENTATIVA_SEQ = [
  { ordem: 1, tipo: 'mensagem', label: 'Mensagem', titulo: '1ª tentativa · Mensagem', prazoHoras: 0 },
  { ordem: 2, tipo: 'audio', label: 'Áudio', titulo: '2ª tentativa · Áudio', prazoHoras: 24 },
  { ordem: 3, tipo: 'ligacao', label: 'Ligação', titulo: '3ª tentativa · Ligação', prazoHoras: 48 },
] as const;

export const TENTATIVA_TIPOS: string[] = TENTATIVA_SEQ.map((t) => t.tipo);

export const INTERACAO_CANAIS = ['WhatsApp', 'Ligação', 'SMS', 'E-mail'];

export const TENTATIVA_RESULTADOS: { id: string; label: string }[] = [
  { id: 'enviado', label: 'Enviado' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'visualizado', label: 'Visualizado' },
  { id: 'respondeu', label: 'Respondeu' },
  { id: 'atendeu', label: 'Atendeu' },
  { id: 'nao_atendeu', label: 'Não atendeu' },
  { id: 'caixa_postal', label: 'Caixa postal' },
  { id: 'numero_invalido', label: 'Número inválido' },
];

// ===== Prazos das tentativas de contato (ancorados na entrada do lead) =====

export type TentativaStatus = 'feita' | 'vencida' | 'pendente';
export type TentativaTone = 'success' | 'warning' | 'danger' | 'muted';

export const TENTATIVA_TONE_CLASS: Record<TentativaTone, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

export const TENTATIVA_EMOJI: Record<string, string> = {
  mensagem: '💬',
  audio: '🎧',
  ligacao: '📞',
};

type LeadPrazoRef = { data_entrada?: string | null; created_at?: string | null };

function tentativaBaseMs(lead: LeadPrazoRef): number | null {
  const base = lead.data_entrada ?? lead.created_at;
  if (!base) return null;
  const t = new Date(base).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Data/hora de vencimento da tentativa idx (0-based): entrada do lead + prazoHoras. */
export function tentativaPrazo(lead: LeadPrazoRef, idx: number): Date | null {
  const base = tentativaBaseMs(lead);
  if (base === null) return null;
  const item = TENTATIVA_SEQ[Math.min(idx, TENTATIVA_SEQ.length - 1)];
  return new Date(base + item.prazoHoras * 3600000);
}

export function tentativaStatus(lead: LeadPrazoRef, tentativasFeitas: number, idx: number): TentativaStatus {
  if (tentativasFeitas > idx) return 'feita';
  const prazo = tentativaPrazo(lead, idx);
  if (prazo && Date.now() > prazo.getTime()) return 'vencida';
  return 'pendente';
}

/** Duração amigável: "45min", "5h", "2d 3h". */
export function fmtDuracao(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const restH = h % 24;
  return restH ? `${d}d ${restH}h` : `${d}d`;
}

/** Data/hora exata do prazo: "31/07 às 15:00" (sempre no fuso de Cuiabá). */
export function prazoDataLabel(prazo: Date | null): string {
  if (!prazo) return '—';
  return fmtDayMonthTime(prazo);
}

/** Contagem regressiva de uma tentativa ainda não registrada. */
export function prazoCountdown(lead: LeadPrazoRef, idx: number): { texto: string; tone: TentativaTone } {
  const prazo = tentativaPrazo(lead, idx);
  if (!prazo) return { texto: 'sem prazo', tone: 'muted' };
  const diff = prazo.getTime() - Date.now();
  if (diff > 0) return { texto: `vence em ${fmtDuracao(diff)}`, tone: 'warning' };
  const atraso = -diff;
  if (atraso < 3600000) return { texto: 'fazer agora', tone: 'warning' };
  return { texto: `atrasada há ${fmtDuracao(atraso)}`, tone: 'danger' };
}

// ===== Pontualidade das tentativas (check de cumprimento do cronograma) =====

export type Pontualidade = 'adiantada' | 'no_prazo' | 'atrasada';

export const PONTUALIDADE_INFO: Record<Pontualidade, { label: string; emoji: string; tone: TentativaTone }> = {
  no_prazo: { label: 'no prazo', emoji: '✓', tone: 'success' },
  adiantada: { label: 'adiantada', emoji: '⏩', tone: 'warning' },
  atrasada: { label: 'atrasada', emoji: '⚠', tone: 'danger' },
};

const PONTUALIDADE_TOLERANCIA_MS = 3600000; // 1h após o vencimento ainda conta como "no prazo"

/** Classifica se a tentativa foi registrada adiantada, no prazo ou atrasada (vs. vencimento). */
export function tentativaPontualidade(
  prazo: Date | null,
  feitaEm: Date | string | null | undefined,
): { id: Pontualidade; label: string; emoji: string; tone: TentativaTone; detalhe: string } | null {
  if (!prazo || !feitaEm) return null;
  const t = new Date(feitaEm).getTime();
  if (Number.isNaN(t)) return null;
  const diff = t - prazo.getTime();
  let id: Pontualidade;
  let detalhe: string;
  if (diff < -PONTUALIDADE_TOLERANCIA_MS) {
    id = 'adiantada';
    detalhe = `${fmtDuracao(-diff)} antes do prazo`;
  } else if (diff <= PONTUALIDADE_TOLERANCIA_MS) {
    id = 'no_prazo';
    detalhe = 'registrada dentro do prazo';
  } else {
    id = 'atrasada';
    detalhe = `${fmtDuracao(diff)} de atraso`;
  }
  const info = PONTUALIDADE_INFO[id];
  return { id, ...info, detalhe };
}

// Motivos de desclassificação (conta desclassificada)
export const MOTIVOS_DESCLASSIFICACAO = [
  'Sem interesse',
  'Contato inválido',
  'Cadastro duplicado',
  'Fora do perfil',
  'Fora da região de atuação',
  'Não procura mais imóvel',
  'Solicitou não receber contatos',
  'Spam',
  'Outro',
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

// --- Acompanhamento de tempo do lead ---

/** Idade do lead na base (em dias inteiros desde created_at). */
export function ageInDays(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

/** Dias sem contato. Retorna null se nunca houve contato registrado. */
export function idleDays(lastContactedAt: string | null | undefined): number | null {
  if (!lastContactedAt) return null;
  const ms = Date.now() - new Date(lastContactedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export function ageLabel(days: number): string {
  if (days <= 0) return 'Hoje na base';
  if (days === 1) return '1d na base';
  return `${days}d na base`;
}

export function ageColor(_days: number): string {
  return 'bg-muted text-muted-foreground border-border';
}

export function idleLabel(days: number | null): string {
  if (days === null) return 'Nunca atendido';
  if (days <= 0) return 'Contato hoje';
  if (days === 1) return '1d sem contato';
  return `${days}d sem contato`;
}

export function idleColor(days: number | null): string {
  if (days === null) return 'bg-danger/15 text-danger border-danger/30';
  if (days <= 0) return 'bg-success/15 text-success border-success/30';
  if (days <= 3) return 'bg-warning/15 text-warning border-warning/30';
  if (days <= 7) return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
  return 'bg-danger/15 text-danger border-danger/30';
}

export function formatDateBR(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== Compatibilidade com componentes antigos do HR (serão removidos depois) =====
export const ETAPAS = STAGES.map(s => s.id);
export const ORIGENS = Object.keys(SOURCES);
export const STATUS = ['Novo', 'Em contato', 'Qualificado', 'Convertido', 'Perdido'];
export const TEMPERATURAS = TEMPERATURES;
export const ETAPA_COLORS: Record<string, string> = ALL_STAGES.reduce((acc, s) => {
  acc[s.id] = s.color;
  return acc;
}, {} as Record<string, string>);
export const TEMP_META = TEMPERATURES;
export const INTERACAO_TIPOS = ['ligacao', 'mensagem', 'audio', 'email', 'visita', 'reuniao', 'nota'];
export const INTERACAO_RESULTADOS = ['atendeu', 'nao_atendeu', 'retornar', 'interessado', 'sem_interesse', 'agendou'];
