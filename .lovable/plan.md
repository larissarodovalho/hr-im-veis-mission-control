### Ajuste: Ordenação alfabética por nome na lista de contas

#### Contexto
Atualmente a listagem de contas vem ordenada do banco por `created_at` decrescente (mais recentes primeiro). O usuário solicitou que a coluna de nomes seja exibida em ordem alfabética.

#### Alteração proposta
1. **Mudar a ordenação padrão do fetch** de `created_at DESC` para `nome ASC` na função `fetchAllContas` em `src/pages/Accounts.tsx`.
2. Essa mudança se aplica a todas as abas (Todos, Carteira, Marketing) pois o mesmo `fetchAllContas` alimenta a tabela.

#### Resultado esperado
A lista de contas será exibida ordenada de A-Z pelo campo **Nome**, tanto na visualização desktop quanto mobile.