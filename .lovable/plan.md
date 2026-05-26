# Manter filtros aplicados ao voltar do detalhe da conta

Hoje na página `Contas` os filtros (Responsável, Status, Interesse, Tipo, Temperatura, Busca) ficam apenas em `useState`. Ao clicar num cliente e navegar para `/crm/contas/:id`, o componente é desmontado e o estado é perdido — quando o usuário volta, tudo reseta para "Todos".

## Solução

Persistir os filtros aplicados na URL via `useSearchParams` (a página já usa para `lista` e `view`). Assim:

- O React Router preserva a URL quando o usuário usa o botão "voltar".
- O usuário pode também compartilhar/recarregar a URL e manter a mesma visão.
- Não precisa de storage extra nem mudanças no backend.

## Mudanças (apenas em `src/pages/Accounts.tsx`)

1. Ao montar a página, hidratar os estados `search`, `statusFilter`, `interestFilter`, `typeFilter`, `tempFilter`, `ownerFilter` (e seus respectivos `draft*`) a partir de `searchParams` (`q`, `status`, `interesse`, `tipo`, `temp`, `responsavel`).
2. Sempre que um filtro for **aplicado** (no handler "Aplicar filtros" / chips de limpar / busca enviada), atualizar `searchParams` via `setSearchParams(..., { replace: true })` mantendo os params existentes (`lista`, `view`).
3. Quando o filtro voltar para o valor padrão (`todos` / vazio), remover a chave correspondente da URL para mantê-la limpa.
4. Não alterar UI, estilos, dados ou outras abas — somente sincronização de estado ↔ URL.

## Resultado

Filtrando por "Responsável: João" e clicando num cliente, a URL fica `/crm/contas?lista=carteira&responsavel=<id>`. Ao voltar, a aba reabre já com o filtro aplicado.
