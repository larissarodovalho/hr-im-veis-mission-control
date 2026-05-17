## Problema

A página `/app/contas` mostra **1.000 contas**, mas o banco tem **1.355**. Os 355 ausentes não foram perdidos — o Supabase aplica um limite padrão de 1.000 linhas por requisição e a query atual não pagina.

Arquivo: `src/pages/Accounts.tsx`, linha 143:
```ts
supabase.from("contas").select("...").order("created_at", { ascending: false })
```

## Solução

Buscar as contas em páginas de 1.000 linhas usando `.range(from, to)` até esgotar os resultados, e concatenar antes de seguir o fluxo atual de `load()`.

### Mudança em `src/pages/Accounts.tsx`

Substituir a chamada única dentro do `Promise.all` por um helper:

```ts
async function fetchAllContas() {
  const PAGE = 1000;
  let from = 0;
  const all: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("contas")
      .select("id, nome, email, telefone, documento, tipo, responsavel_id, status, observacoes, created_at, interesse, is_partner, tags, etapa_funil")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
```

E usar `fetchAllContas()` no lugar da query direta no `Promise.all`. O restante do `load()` (profiles, mapeamento, contagem do header) continua igual e passará a refletir os 1.355 registros automaticamente.

### Notas

- RLS permanece respeitada (admin/gestor vê tudo; corretor vê só as suas — para esses, o total real já é menor que 1.000 e nada muda).
- Sem alterações de schema, RLS ou outras telas.
- Kanban de contas (`ContasKanban`) deve ser revisado em seguida se também listar contas — fora do escopo desta correção, mas posso incluir se quiser.
