// Cálculos e formatações do relatório de performance dos links dos imóveis.
export interface LinksPerfKpis {
  gerados: number;
  compartilhados: number;
  envios_confirmados: number;
  abertos: number;
  nao_abertos: number;
  expirados_sem_abertura: number;
  expirados_com_abertura: number;
  total_acessos: number;
  visitantes_unicos: number;
  cliques_whatsapp: number;
  gostei: number;
  rejeicoes: number;
  solicitacoes_info: number;
  solicitacoes_visita: number;
  oportunidades: number;
  vendas: number;
  tempo_medio_min: number;
  taxa_abertura: number;
  taxa_interesse: number;
  taxa_visita: number;
  taxa_conversao: number;
}

export interface LinksPerfGrupo {
  chave: string;
  gerados: number;
  abertos: number;
  gostei: number;
  visitas: number;
}

/** Divisão protegida contra zero, em pontos percentuais com 1 casa. */
export function taxa(parte: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((parte * 1000) / total) / 10;
}

export function pct(valor: number | null | undefined): string {
  const n = Number(valor ?? 0);
  return `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;
}

/** Tempo médio entre compartilhamento e primeiro acesso. */
export function tempoMedioLabel(minutos: number | null | undefined): string {
  const m = Math.max(0, Math.round(Number(minutos ?? 0)));
  if (!m) return "—";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}
