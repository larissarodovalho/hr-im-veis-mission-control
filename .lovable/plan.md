## Diagnóstico

Verifiquei o fluxo atual e o comportamento que você quer **já acontece** no site — mas vale confirmar e deixar isso explícito/documentado para não quebrar no futuro.

### Como funciona hoje

1. **CRM (`Imoveis.tsx`)** — As abas "Em Proposta" e "Em Fechamento" são derivadas das **propostas** vinculadas ao imóvel, **não** mudam o campo `imoveis.status`. O status do imóvel só muda em dois pontos:
   - `confirmarVenda()` em `Imoveis.tsx` → seta `status = 'Vendido'`
   - `NovaVendaDialog.tsx` → seta `status = 'Vendido'`
2. **Site público** consome a view `imoveis_public`, que filtra `WHERE status = 'Disponível'`. Como o status não muda enquanto a proposta está em análise/fechamento, **o imóvel continua aparecendo no site** durante todo esse período.
3. Só quando a venda é confirmada (status vira "Vendido") ele sai do site e entra na aba "Vendidos" do CRM.

Ou seja: o comportamento que você descreveu **já está implementado corretamente**.

## Plano de ajustes (limpeza preventiva)

Para garantir que ninguém quebre isso sem querer e para deixar o código mais claro:

1. **`src/pages/site/ImoveisPage.tsx`** — Remover `"Em negociação"` do `STATUS_FILTER` (linha 66). Esse valor nunca é usado em lugar nenhum do sistema (só `Disponível` e `Vendido` aparecem) e cria confusão. Fica apenas `["Disponível"]`.

2. **Adicionar um comentário no topo de `Imoveis.tsx`** explicando a regra: "o campo `imoveis.status` permanece `Disponível` enquanto há propostas em análise ou em fechamento; só muda para `Vendido` na confirmação da venda. O site usa esse campo via `imoveis_public`."

3. **Nenhuma migração de banco** é necessária.

### Fora do escopo

- Não vou mexer na view `imoveis_public` (já filtra corretamente).
- Não vou mexer no `NovaPropostaDialog` (já não toca em `imoveis.status`).
- Não vou alterar o badge do site em `ImovelDetalhePage` (continua mostrando "Disponível").

Se preferir, posso pular essa limpeza e só confirmar o comportamento — me diga.