export const formatBRL = (
  v: number | string | null | undefined,
  opts?: { dash?: boolean }
) => {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) {
    return opts?.dash === false ? "R$ 0,00" : "—";
  }
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
