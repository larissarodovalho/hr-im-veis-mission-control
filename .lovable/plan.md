## Objetivo

Na seção "Responsável e proprietário" (usada em Novo/Editar imóvel), assim que o usuário selecionar uma conta no campo "Proprietário (conta)", exibir logo abaixo do select uma linha discreta com **nome** e **telefone** do proprietário selecionado.

## Mudanças

Arquivo único: `src/components/imoveis/ResponsavelProprietarioSection.tsx`

1. Ampliar a query de `contas` para trazer também `telefone` (hoje busca `id, nome, documento`).
2. Quando `proprietarioId` estiver preenchido, localizar a conta correspondente na lista já carregada e renderizar abaixo do `SearchableSelect`:
   - Nome do proprietário
   - Telefone (com link `tel:` clicável); se não houver telefone cadastrado, mostrar "Sem telefone cadastrado" em tom suave.
3. Estilo: texto pequeno (`text-xs text-muted-foreground`), ícone `Phone` do lucide ao lado do telefone. Sem mudanças de layout no grid.

## Fora de escopo

- Não alterar o card de Conta em outras telas.
- Não adicionar e-mail ou outros campos (só nome + telefone, conforme pedido).
- Sem mudanças no banco.
