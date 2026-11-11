import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const FORMAS_PAGAMENTO = [
  { value: "a_vista", label: "À vista" },
  { value: "financiamento", label: "Financiamento" },
  { value: "anual", label: "Pagamento anual" },
  { value: "safra", label: "Safra" },
  { value: "permuta", label: "Permuta (imóvel)" },
  { value: "veiculos", label: "Veículos" },
] as const;

export const formaPagamentoLabel = (v: string) =>
  FORMAS_PAGAMENTO.find((f) => f.value === v)?.label ?? v;

export const formaPagamentoLabelComAnos = (v: string, anos?: number | null) =>
  v === "anual" && anos ? `Pagamento anual — até ${anos} ano${anos > 1 ? "s" : ""}` : formaPagamentoLabel(v);

export function FormasPagamentoSection({ value, onChange, anos, onAnosChange }: { value: string[]; onChange: (v: string[]) => void; anos?: number | null; onAnosChange?: (n: number | null) => void }) {
  const toggle = (v: string) => {
    const on = value.includes(v);
    onChange(on ? value.filter((x) => x !== v) : [...value, v]);
    if (v === "anual" && on) onAnosChange?.(null);
  };
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Condições de pagamento aceitas</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FORMAS_PAGAMENTO.map((f) => (
          <label key={f.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={value.includes(f.value)} onCheckedChange={() => toggle(f.value)} />
            <span>{f.label}</span>
          </label>
        ))}
      </div>
      {value.includes("anual") && onAnosChange && (
        <div className="space-y-2 rounded-md border p-3">
          <div className="text-sm font-medium">Em quantos anos o proprietário aceita receber?</div>
          <div className="flex flex-wrap items-center gap-2">
            {[2, 3, 4, 5].map((n) => (
              <Button key={n} type="button" size="sm" variant={anos === n ? "default" : "outline"} onClick={() => onAnosChange(n)}>{n} anos</Button>
            ))}
            <Input type="number" min={1} max={30} placeholder="Outro" className="w-24 h-9" value={anos ?? ""}
              onChange={(e) => { const n = parseInt(e.target.value, 10); onAnosChange(Number.isFinite(n) ? Math.min(30, Math.max(1, n)) : null); }} />
            <span className="text-xs text-muted-foreground">anos</span>
          </div>
        </div>
      )}
    </section>
  );
}
