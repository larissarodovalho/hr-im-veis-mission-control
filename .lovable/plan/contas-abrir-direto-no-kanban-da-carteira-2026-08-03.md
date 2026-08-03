# Contas: abrir direto no Kanban da Carteira

## Objetivo
Ao clicar em "Contas" no menu, abrir diretamente na aba **Carteira** em visão **Kanban**, em vez de cair em "Todos" (visão lista).

## Causa atual
Em `src/pages/Accounts.tsx`, a aba ativa vem do parâmetro `lista` da URL. Quando o parâmetro não existe (ex.: clique no menu lateral), o código assume `"todos"` — e "Todos" é sempre exibido em lista. A Carteira já abre em Kanban por padrão quando selecionada.

## Mudanças

### 1. `src/pages/Accounts.tsx`
- Alterar o fallback da linha 136: quando não houver `lista` na URL, assumir `"carteira"` em vez de `"todos"`.
- Resultado: `/crm/contas` → abre na Carteira, visão Kanban (comportamento já existente para essa aba).
- As abas continuam funcionando normalmente: clicar em "Todos" ou "Marketing" grava `?lista=todos` / `?lista=marketing` na URL e mantém o comportamento atual.

### 2. `src/pages/Leads.tsx` (linha 143)
- O chip "convertidos em Conta" navega hoje para `/crm/contas` esperando a visão geral. Ajustar para `/crm/contas?lista=todos` para preservar a intenção original (mostrar todas as contas).

## O que não muda
- Redirecionamento de corretores (`StaffRoute`) passa a cair na Carteira Kanban — coerente com o pedido, pois é o workspace principal.
- Links dos relatórios e do detalhe do lead já usam `?lista=` explícito; não são afetados.
- Nenhuma mudança de dados, permissões ou filtros.

## Validação
- Abrir `/crm/contas` sem parâmetros → aba Carteira ativa, Kanban visível.
- Alternar entre as três abas e confirmar que a URL e a visão respondem corretamente.
- Conferir o chip "convertidos em Conta" na página Leads abrindo em "Todos".
