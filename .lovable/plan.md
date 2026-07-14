## Correção de "Conversões" no relatório de Performance por Corretor

### O que fazer

Em `src/pages/Reports.tsx`, na tabela **Performance por Corretor**:

1. **Corrigir o filtro de conversões**
   - Trocar `l.etapa_funil === "Fechado"` por `l.etapa_funil === "fechado"` para bater com os ids em minúsculas definidos em `src/lib/leads.ts`.

2. **Adicionar tooltip explicativo no cabeçalho "Conversões"**
   - Colocar um ícone `Info` (lucide-react) ao lado do texto "Conversões" no `<TableHead>`.
   - Usar `Tooltip` do shadcn (`@/components/ui/tooltip`) com o texto:
     > "Leads do corretor cuja etapa do funil chegou a 'Fechado' (negócio ganho). Taxa = Conversões ÷ Leads × 100."

### Escopo

- Apenas `src/pages/Reports.tsx`.
- Sem mudanças de schema, RLS ou outros relatórios.
