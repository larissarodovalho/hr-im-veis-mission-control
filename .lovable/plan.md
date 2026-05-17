### Exibir Interesse na lista e no detalhe da conta

#### 1. Lista de contas — `src/pages/Accounts.tsx`
- Adicionar nova coluna **Interesse** na tabela desktop (entre "Qualificação" e "Responsável"), com `<Badge variant="outline">` em tom âmbar/accent exibindo `a.interesse`, ou "—" quando vazio.
- Adicionar linha "Interesse" no card mobile, com o mesmo badge.
- Atualizar `<thead>` para incluir a nova coluna e ajustar `colSpan` das linhas de loading/empty de 8 para 9.

#### 2. Detalhe da conta — `src/pages/AccountDetail.tsx`
- Substituir o badge atual `Interesse: {acc.interesse}` por um badge maior, destacado, com cor própria (tom âmbar/accent) e ícone, exibido na linha de status logo abaixo do nome.

#### Fora de escopo
- Filtros, banco de dados e exportação permanecem inalterados.