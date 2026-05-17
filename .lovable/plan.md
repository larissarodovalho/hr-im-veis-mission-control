## Problema
O relatório de funil de contas (`src/components/reports/FunilContasReport.tsx`) faz `supabase.from("contas").select(...)` sem paginação, e o Supabase corta em **1000 linhas por padrão**. Por isso só ~1000 das 1350+ contas aparecem.

## Correção
Buscar **todas** as contas em páginas de 1000 usando `.range(from, to)` num loop até esgotar.

### Arquivo
`src/components/reports/FunilContasReport.tsx` — no `useEffect` inicial:

- Substituir a chamada única por um loop tipo:
  ```ts
  const PAGE = 1000;
  let all: Conta[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("contas")
      .select("id, etapa_funil, tags, responsavel_id")
      .range(from, from + PAGE - 1);
    if (error) break;
    all = all.concat((data ?? []) as Conta[]);
    if (!data || data.length < PAGE) break;
  }
  setContas(all);
  ```
- Manter `profiles` como está (são poucos).

## Verificar outros pontos com o mesmo bug
Rodar um `rg` por `.from("contas").select` em todo o projeto para listar onde mais isso pode estar acontecendo (Kanban de contas, Accounts, Dashboard). Se algum desses também depender de carregar a lista inteira para somar/contar, aplicar a mesma paginação. Caso contrário, deixar como está e só mencionar no fim.

## Escopo
- Apenas leitura, sem mudar banco.
- Sem alterar a UI/cálculos — só garantir que todos os registros chegam ao cliente.
