export type OrigemNegocio = "base_corretor" | "base_institucional" | "base_hrx";
export type NivelCorretor = "junior" | "senior";
export type ComissaoSplit = { captador: number; vendedor: number; hr: number };

export const ORIGENS: { id: OrigemNegocio; label: string }[] = [
  { id: "base_corretor", label: "Base do Corretor (Orgânico)" },
  { id: "base_institucional", label: "Base Institucional (CRM Interno)" },
  { id: "base_hrx", label: "Base HRX (Tráfego/Marketing)" },
];

export const NIVEIS: { id: NivelCorretor; label: string }[] = [
  { id: "junior", label: "Júnior" },
  { id: "senior", label: "Sênior" },
];

export const origemLabel = (id?: string | null) =>
  ORIGENS.find((o) => o.id === id)?.label ?? "—";
export const nivelLabel = (id?: string | null) =>
  NIVEIS.find((n) => n.id === id)?.label ?? "—";

// Splits em % do VGV. Total = 5% em todas as combinações.
export const COMISSAO_MATRIZ: Record<
  OrigemNegocio,
  Record<NivelCorretor, ComissaoSplit>
> = {
  base_corretor: {
    junior: { captador: 0.5, vendedor: 1.0, hr: 3.5 },
    senior: { captador: 1.0, vendedor: 2.0, hr: 2.0 },
  },
  base_institucional: {
    junior: { captador: 0.5, vendedor: 0.5, hr: 4.0 },
    senior: { captador: 0.5, vendedor: 2.0, hr: 2.5 },
  },
  base_hrx: {
    junior: { captador: 0.5, vendedor: 0.5, hr: 4.0 },
    senior: { captador: 0.5, vendedor: 1.5, hr: 3.0 },
  },
};

export function getSplit(origem: OrigemNegocio, nivel: NivelCorretor) {
  return COMISSAO_MATRIZ[origem][nivel];
}

export const getPercentTotal = (split: ComissaoSplit) =>
  (Number(split.captador) || 0) + (Number(split.vendedor) || 0) + (Number(split.hr) || 0);

export const calculateCommissionPart = (valorVenda: number, percent: number) =>
  (Number(valorVenda) || 0) * ((Number(percent) || 0) / 100);

export const calculateCommissionValue = (valorVenda: number, split: ComissaoSplit) =>
  calculateCommissionPart(valorVenda, getPercentTotal(split));

export const DEFAULT_ORIGEM: OrigemNegocio = "base_corretor";
export const DEFAULT_NIVEL: NivelCorretor = "senior";
