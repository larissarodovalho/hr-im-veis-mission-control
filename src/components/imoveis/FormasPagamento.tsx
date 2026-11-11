import { Checkbox } from "@/components/ui/checkbox";

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

export function FormasPagamentoSection({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
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
    </section>
  );
}
