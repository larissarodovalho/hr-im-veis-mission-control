// Impede que textos exportados para CSV/Excel sejam interpretados como fórmulas
// (valores começando com =, +, -, @, tab ou CR). Números ficam inalterados.
export function safeCell<T>(v: T): T | string {
  if (typeof v !== "string") return v;
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

export function safeRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) out[k] = safeCell(v);
    return out as T;
  });
}
