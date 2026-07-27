## Objetivo
No Kanban de "Oportunidades de negócio", fazer com que cada coluna do funil tenha rolagem vertical independente (mesmo comportamento já aplicado em Leads e Contas).

## Onde
`src/pages/imoveis/OportunidadesTab.tsx`

## Mudanças
- Definir altura fixa para cada coluna com base na viewport (ex.: `h-[calc(100vh-320px)]`) em vez do atual `min-h`, para que o overflow interno seja acionado.
- Manter `overflow-y-auto` na coluna, para rolagem individual dos cards.
- Ajustar o container das colunas para não rolar verticalmente em conjunto (mantendo o scroll horizontal apenas no mobile, como já é hoje).
- Cabeçalho da coluna (título + contador) fica fixo no topo (`sticky top-0` com fundo) para permanecer visível durante a rolagem.

## Resultado
Cada uma das 6 colunas (Nova, Buscando, Visita, Proposta, Ganha, Perdida) rola independente, sem arrastar as demais.
