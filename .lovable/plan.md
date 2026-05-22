## Objetivo
No diálogo "Nova venda" (e "Editar venda"), substituir o campo **Cliente** (hoje texto livre) por um seletor de busca que puxa diretamente da tabela **Contas**, mantendo a possibilidade de digitar um nome avulso quando o cliente ainda não existe como conta.

## Mudanças

### `src/components/imoveis/NovaVendaDialog.tsx`
1. **Campo "Cliente *"** vira um `SearchableSelect` alimentado pela lista `contas` (já carregada no `useEffect`).
   - Ao selecionar uma conta: preenche `conta_id` e `cliente_nome` automaticamente (sobrescrevendo o nome atual, ao contrário do comportamento de hoje que só preenchia se vazio).
   - Mostra nome + (quando houver) e-mail/telefone no rótulo da opção, para diferenciar homônimos.
2. **Fallback "cliente avulso"**: abaixo do select, um link/botão pequeno "Cliente não está nas contas? Digitar nome manualmente" que revela o `Input` de texto livre atual e zera `conta_id`.
3. **Remover** o campo separado "Conta (opcional)" (agora redundante com o seletor principal). O campo "Lead (opcional)" permanece como está.
4. Carregar `contas` com `id, nome, email, telefone` (em vez de só `id, nome`) para enriquecer o rótulo.

### Nenhuma alteração de schema
- A coluna `conta_id` em `vendas` já existe e continua sendo gravada normalmente.
- `cliente_nome` continua sendo persistido (snapshot do nome no momento da venda).

## Pontos fora de escopo
- Não altera lógica de comissão, matriz HR, nem filtros do relatório.
- Não mexe em `EditarVendaDialog` separado (o mesmo componente é usado para edição).
