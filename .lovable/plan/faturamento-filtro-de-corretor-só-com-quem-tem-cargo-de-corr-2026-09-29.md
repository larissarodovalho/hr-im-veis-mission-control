# Faturamento: filtro de corretor só com quem tem cargo de corretor

## Diagnóstico (confirmado no banco e no código)
- O seletor "Corretor" da subaba Faturamento (`FaturamentoReport.tsx`) lista **todos os usuários** do sistema (marketing, secretaria, admins), porque carrega `profiles` sem filtrar por papel.
- Hoje só existe 1 venda registrada (30/01/2026): vendedor Rafael Filimberti, captador Hans Rodovalho. Se o período escolhido não incluir janeiro/2026, qualquer corretor selecionado mostra "Sem vendas no período" — o que dá a impressão de filtro quebrado.
- A lógica do filtro em si está correta (compara o corretor selecionado com vendedor/captador da venda); o problema é a lista de opções e a falta de retorno visual.

## Mudança (arquivo único: `src/components/reports/FaturamentoReport.tsx`)
1. No carregamento, buscar também `user_roles` e montar a lista do seletor apenas com quem tem papel **corretor** (hoje: Douglas Torres, Gabriel Souza e Rafael Filimberti).
2. Hans e Larissa são admin (sem papel corretor), então saem do seletor — mas continuam aparecendo no ranking quando participam de uma venda (ex.: Hans como captador), com o nome correto.
3. Manter a opção "Todos".

## O que não muda
- Ranking, KPIs, gráfico, exportação e demais filtros (Papel, Origem, Nível).
- Nenhum dado do banco é alterado.

## Validação
- Typecheck e build.
- Playwright: abrir Relatórios → Faturamento, confirmar que o seletor mostra só os 3 corretores e que selecionar Rafael Filimberti (com período incluindo jan/2026) filtra a venda de R$ 1.800.000.
