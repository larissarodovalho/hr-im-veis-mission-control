## Adicionar "Não definida" ao campo Interesse nas contas

### O que será feito
1. **AccountDetail.tsx** — Adicionar opção "Não definido" no Select de Interesse do diálogo de edição.
2. **Accounts.tsx** — Adicionar opção "Não definido" no filtro de Interesse da listagem; permitir filtrar contas que não possuem interesse cadastrado (`null`).
3. **NovaContaDialog.tsx** — Adicionar campo "Interesse" no formulário de criação de conta (hoje não existe), com opção "Não definido".

### Como funciona
- Quando o usuário selecionar "Não definido", o valor salvo no banco será `null` (a coluna `interesse` da tabela `contas` já aceita nulo).
- O filtro na listagem ganhará uma opção para mostrar apenas contas sem interesse definido.
- A exibição no detalhe continua mostrando "—" quando o interesse é nulo.