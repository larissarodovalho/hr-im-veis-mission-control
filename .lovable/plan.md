## Ajustar Reuniões para mobile

Em viewport pequeno (~440px), a aba `src/pages/Meetings.tsx` mostra uma `<table>` de 5 colunas dentro de `overflow-x-auto`, o que força scroll horizontal e quebra a leitura. Vou criar uma visualização em cards para mobile, mantendo a tabela em telas ≥ md.

### Mudanças em `src/pages/Meetings.tsx`

1. Envolver o `Card` da tabela atual em `hidden md:block` para preservá-la no desktop.
2. Adicionar logo abaixo uma lista de cards `md:hidden`, gerada do mesmo `items.map(...)`, com:
   - Data/hora formatada (`format(..., "Pp")`) em destaque.
   - Nome do lead/conta como `Link` (ou "Sem lead").
   - Telefone/email quando existirem.
   - Badge do tipo (presencial/videochamada/ligação) e badge de status com os mesmos estilos atuais.
   - Local ou link (link clicável, truncado).
   - Botão "Aprovar" full-width quando status ≠ confirmada/realizada.
   - Card inteiro clicável → `openEdit(m)` (com `stopPropagation` nos elementos interativos internos).
3. Empty state equivalente quando `items.length === 0`.
4. Dialog "Nova reunião" e "Editar reunião": já funcionam no mobile, apenas trocar o grid `grid-cols-2` (Lead/Conta e Tipo/Status) para `grid-cols-1 sm:grid-cols-2` para não espremer os selects em 440px.

Apenas mudanças de UI/Tailwind; nenhuma alteração em queries, lógica ou schema.
