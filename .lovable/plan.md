No Kanban de contas (Carteira/Marketing), adicionar exibição do responsável (corretor) em cada card, além da tag de interesse.

Alterações necessárias:

1. **src/components/contas/ContasKanban.tsx**
   - Incluir `responsavel_id: string | null` no tipo `Account`.
   - Adicionar prop `ownerMap: Record<string, string>`.
   - No `ContaCard`, exibir um `<Badge>` com o nome do responsável (ex: "👤 Nome do Corretor") quando `responsavel_id` estiver presente e existir no `ownerMap`.

2. **src/pages/Accounts.tsx**
   - Passar `ownerMap={ownerMap}` para o componente `<ContasKanban>`.

Nenhuma alteração no backend ou banco de dados é necessária — o `ownerMap` e `responsavel_id` já estão sendo carregados na página.