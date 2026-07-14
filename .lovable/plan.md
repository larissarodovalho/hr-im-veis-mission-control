Fazer cada coluna do Kanban rolar de forma independente, tanto em Leads quanto em Contas.

**Problema atual**: as colunas usam `min-h-[calc(100vh-XXXpx)]` junto com `overflow-y-auto`. Como `min-h` força a coluna a crescer com o conteúdo, o `overflow-y-auto` nunca ativa e a página inteira rola.

**Correção** (apenas troca de classes de altura, sem lógica):

1. `src/pages/Leads.tsx` linha 247 — na `Column`, trocar `min-h-[calc(100vh-220px)]` por `h-[calc(100vh-220px)]` para dar altura fixa à coluna. O filho já tem `flex-1 overflow-y-auto` e passará a rolar sozinho.

2. `src/components/contas/ContasKanban.tsx` linha 286 — trocar `min-h-[calc(100vh-260px)]` por `h-[calc(100vh-260px)]` no container droppable. Já tem `overflow-y-auto`.

Nenhuma alteração de dados ou comportamento — apenas apresentação.