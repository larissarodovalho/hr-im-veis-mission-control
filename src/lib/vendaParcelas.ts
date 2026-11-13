export type Parcela = { status: string; valor: number; vencimento: string };

/** Status geral da comissão a partir das parcelas. null = sem parcelas (mantém status atual). */
export function statusGeralComissao(parcelas: Parcela[]): "Pagamento pendente" | "Pagamento parcial" | "Finalizada" | null {
  if (!parcelas.length) return null;
  const pagas = parcelas.filter((p) => p.status === "paga").length;
  if (pagas === parcelas.length) return "Finalizada";
  if (pagas > 0) return "Pagamento parcial";
  return "Pagamento pendente";
}

/** Divide o total em N parcelas com centavos exatos (sobra vai na última). */
export function dividirValor(total: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const arr = Array(n).fill(base);
  arr[n - 1] += cents - base * n;
  return arr.map((c) => c / 100);
}

/** Datas de vencimento a partir de uma data inicial (YYYY-MM-DD), a cada `meses`. */
export function gerarVencimentos(inicio: string, n: number, meses: number): string[] {
  const [y, m, d] = inicio.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const total = m - 1 + i * meses;
    const yy = y + Math.floor(total / 12);
    const mm = (total % 12) + 1;
    const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    return `${yy}-${String(mm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
  });
}

export function isAtrasada(p: Parcela, hoje: string): boolean {
  return p.status !== "paga" && p.vencimento < hoje;
}
