## Objetivo
Adicionar um filtro por período na aba "Oportunidades de negócio" (dentro de Imóveis) para filtrar os cards do Kanban por data.

## Onde
`src/pages/imoveis/OportunidadesTab.tsx`

## Opções do filtro
Um `<select>` ao lado do filtro de corretor, com:
- Todas (padrão)
- 7 dias
- 15 dias
- 30 dias
- 3 meses
- 6 meses

## Comportamento
- Filtra pelo campo `created_at` da oportunidade (data em que foi criada).
- Aplicado no mesmo `useMemo` que já filtra por busca e corretor — mantém o Kanban, drag-and-drop e contadores por coluna funcionando normalmente.
- "Todas" desativa o filtro.
- Combina com os filtros existentes (busca + corretor).

## Observação
Se preferir filtrar por outro campo (ex.: `updated_at` = última movimentação, ou data de fechamento em "Ganha"/"Perdida"), me avise antes de eu implementar — o padrão do plano é `created_at`.
