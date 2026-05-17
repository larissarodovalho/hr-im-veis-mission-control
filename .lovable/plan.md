### Ajuste: Novas opções de Interesse no contato

#### Contexto
Hoje, ao editar um contato em `src/pages/AccountDetail.tsx`, o campo **Interesse** só oferece: Compra, Venda, Permuta, Outro. O usuário quer ampliar para 7 opções específicas.

O campo `contas.interesse` no banco é `text` (sem enum), então não há necessidade de migração.

#### Alteração proposta
**`src/pages/AccountDetail.tsx`** — substituir os `<SelectItem>` do campo Interesse pelas opções:
- Comprar
- Vender
- Alugar
- Incorporar
- Investimento
- Ocasião de oportunidade
- Permuta

#### Fora de escopo (manter como está)
- Filtro de Interesse na listagem `/app/contas` (`Accounts.tsx`) continua com as opções atuais. Se desejar alinhar o filtro às novas opções depois, abrir outro ajuste.
- Sem mudanças no banco de dados.