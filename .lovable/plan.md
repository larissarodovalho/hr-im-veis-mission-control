## Objetivo
Alinhar as opções do filtro **Interesse** (página Contas) aos valores realmente salvos no cadastro do contato (em `AccountDetail`).

## Contexto
- O Select de edição da conta salva strings: `Comprar`, `Vender`, `Alugar`, `Incorporar`, `Investimento`, `Ocasião de oportunidade`, `Permuta`.
- O filtro em `Accounts.tsx` ainda usa valores antigos (`compra`, `venda`, `arrendamento`, `compra_arrendamento`, `outro`) — por isso filtrar nunca casa com nada salvo.

## Mudança (`src/pages/Accounts.tsx`)
Substituir os `<SelectItem>` do filtro Interesse pelos mesmos valores usados no cadastro:
- Todos os interesses
- Comprar
- Vender
- Alugar
- Incorporar
- Investimento
- Ocasião de oportunidade
- Permuta

Ajustar o tipo `Interest` e o estado `interestFilter` para aceitar string (já que os valores agora são livres, idênticos ao que está salvo). Remover constantes `INTEREST_LABEL` se não usadas.

## Fora de escopo
Banco, formulário de edição (já correto) e exibição das badges.