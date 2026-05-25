export type ExclusividadeStatus =
  | { kind: "none" }
  | { kind: "ativa"; diasRestantes: number; alerta: boolean }
  | { kind: "vencida"; diasAtras: number };

export function calcExclusividade(fim?: string | null): ExclusividadeStatus {
  if (!fim) return { kind: "none" };
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimD = new Date(fim + "T00:00:00");
  const diffMs = fimD.getTime() - hoje.getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (dias < 0) return { kind: "vencida", diasAtras: -dias };
  return { kind: "ativa", diasRestantes: dias, alerta: dias <= 30 };
}

export function formatDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
}
