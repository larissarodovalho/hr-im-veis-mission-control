Adicionar um tooltip explicativo ao card **"Fechados"** no relatório do funil de contas.

## Mudança

Em `src/components/reports/FunilContasReport.tsx`, envolver o `<Kpi label="Fechados" ...>` com o componente `Tooltip` do shadcn (`@/components/ui/tooltip`) exibindo:

> "Contas cuja etapa do funil é **Fechado** — negócios ganhos/concluídos. A taxa de conversão considera Fechados ÷ (Fechados + Perdidos)."

Um pequeno ícone de `Info` (lucide) aparece ao lado do rótulo "Fechados", e o tooltip abre no hover/focus. Nenhuma mudança de lógica ou dados.
