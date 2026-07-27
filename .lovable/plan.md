## Filtro de período por último contato — Kanban de Contas

Adicionar filtro de "Contato em" nos Kanbans da Carteira e do Marketing em `src/pages/Accounts.tsx`, baseado na data da última interação em `public.interacoes`.

### Comportamento
- Novo `<Select>` no cabeçalho ao lado dos filtros existentes.
- Opções: Todo o período (padrão), 7, 15, 30, 90, 180 dias.
- Uma conta aparece se possuir pelo menos uma interação dentro do período selecionado.
- Contas sem nenhuma interação ficam ocultas quando um período é escolhido; visíveis em "Todo o período".

### Implementação
- Buscar em paralelo `select conta_id, max(created_at)` de `interacoes` agrupado por `conta_id` e montar `Map<conta_id, lastContactAt>`.
- Aplicar o filtro em conjunto com os filtros já existentes (busca, responsável).
- Reagir ao canal Realtime existente: ao receber mudanças em `interacoes`, refazer o fetch do mapa.
- Sem alterações de schema, RLS ou backend.
