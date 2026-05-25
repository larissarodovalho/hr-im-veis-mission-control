## Problema

O dialog "Editar imóvel" mostra "Sem proprietário" mesmo quando o imóvel tem `proprietario_id` salvo. Na listagem da aba Imóveis o nome aparece normalmente.

**Causa:** a tabela `contas` tem 1.358 registros e o Supabase corta em 1.000 por padrão. O `ResponsavelProprietarioSection` busca `contas` ordenadas por nome — contas no fim do alfabeto ficam fora. Quando o `proprietario_id` salvo não está na lista, o `SearchableSelect` exibe o `emptyLabel` ("Sem proprietário").

## Mudanças

Apenas em `src/components/imoveis/ResponsavelProprietarioSection.tsx`:

1. Após carregar a lista (`loadContas`), verificar se o `proprietarioId` atual já está presente.
2. Se não estiver, fazer uma busca pontual pelo id e mesclar essa conta no estado `contas`.
3. Repetir o mesmo check sempre que `proprietarioId` mudar (via `useEffect` dependente).
4. Como salvaguarda, aumentar o `range` da listagem principal para `0..1999` para cobrir a base atual (1.358 contas) sem mudar o comportamento de busca do `SearchableSelect`.

Sem mudanças de banco, sem mudanças no Imoveis.tsx, sem alterar `NovoImovelDialog`.

## Resultado esperado

Ao abrir o editor, o proprietário salvo aparece selecionado e com nome/telefone visíveis abaixo do campo, independentemente da posição alfabética da conta.
