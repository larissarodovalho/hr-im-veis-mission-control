A causa do problema é o limite padrão do Supabase de 1000 linhas por consulta. Há 1.360 contas no banco, então o `select("id,nome")` no diálogo "Nova oportunidade" trunca em 1000 e ~360 contas ficam invisíveis no seletor.

## Correção

Em `src/components/imoveis/NovaOportunidadeDialog.tsx`, no `useEffect` (linha 37):

1. Substituir o `supabase.from("contas").select(...)` direto por uma função de paginação que faz `.range(start, start+999)` em loop até esgotar (mesmo padrão para `leads` por segurança).
2. Manter `order("nome")` e mapear para `{ id, nome }`.

Exemplo:
```ts
async function fetchAll(table: "contas" | "leads") {
  const rows: { id: string; nome: string }[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table).select("id,nome").order("nome")
      .range(from, from + pageSize - 1);
    if (error || !data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}
```

Usar `fetchAll("contas")` e `fetchAll("leads")` no `useEffect`. Resto do componente fica igual.

Assim todas as contas (e leads) aparecem no SearchableSelect ao criar a oportunidade.