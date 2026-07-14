## Alteração

No funil Kanban da aba **Contas** (tanto Carteira quanto Marketing), inserir uma nova coluna **Permuta** logo após **Visita** e antes de **Proposta**.

## Arquivo a editar

- `src/lib/contasFunil.ts`: adicionar `"permuta"` ao tipo `EtapaFunil` e inserir o item `{ id: "permuta", label: "Permuta", color: "bg-orange-500/15 text-orange-700 border-orange-500/30" }` no array `ETAPAS`, posicionado entre `visita` e `proposta`.

Como o Kanban (`ContasKanban.tsx`), os relatórios de funil e demais componentes iteram sobre `ETAPAS` dinamicamente, a nova coluna aparece automaticamente em Carteira e Marketing sem outras mudanças de UI.

Nenhuma migração de banco é necessária — `contas.etapa_funil` é texto livre e aceita o novo valor `"permuta"`.
