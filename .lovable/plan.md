# Corrigir alerta de duplicidade que esconde o botão Unificar

## Diagnóstico (confirmado)
Ao abrir "Converter lead em Conta Cliente", o formulário vem pré-preenchido com o telefone e e-mail **do próprio lead**. A verificação de duplicidade então encontra o próprio lead ("Ivan Jorge Winter · Lead · Conversa Ativa") e o exibe como duplicidade. Confirmei no banco: não existe nenhuma conta nem outro lead com esse telefone/e-mail — o único registro é o próprio lead (`d5114cdc-...`).

Consequências:
- O botão **Unificar** só aparece em duplicidades do tipo **Conta** — como o "duplicado" aqui é o próprio lead, o botão não aparece.
- O botão "Converter em Conta Cliente" fica bloqueado por uma duplicidade falsa (auto-correspondência).

## Mudança

### `src/pages/LeadDetail.tsx` (dialog de conversão)
- No `useEffect` de verificação de duplicidade (linhas ~385-419), filtrar o resultado: ignorar correspondências onde `table === "leads"` **e** `id === lead.id` (o próprio lead em conversão).
- Com isso, neste caso o alerta some completamente e a conversão flui normal.
- Quando houver duplicidade real:
  - **Conta existente** → aparece o botão **Unificar** (já implementado: vincula o lead à conta e transfere interações, tarefas e reuniões).
  - **Outro lead** (pessoa diferente cadastrada duas vezes) → continua apenas informativo, com link para abrir o outro lead.

## Resultado
- Nenhum alerta falso de duplicidade ao converter um lead que não tem conta correspondente.
- "Unificar" e "Editar dados" aparecem somente quando há uma conta realmente duplicada.

## Verificação
- Playwright: abrir o lead Ivan Jorge Winter, clicar em "Conta Cliente" e confirmar que o alerta de duplicidade não aparece e o botão "Converter em Conta Cliente" fica habilitado.
