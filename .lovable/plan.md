Filtrar a tabela "Performance por corretor" em `src/pages/Reports.tsx` para incluir apenas usuários com role `corretor`, excluindo admin/gestor/marketing puros.

## Mudança

No `load()`:
1. Buscar `user_roles` em paralelo com os demais selects: `supabase.from("user_roles").select("user_id, role")`.
2. Montar `Set<string>` com `user_id` que possuam role `corretor`.
3. Ao construir o `map` a partir de `profiles`, incluir apenas os user_ids presentes nesse set.

Resto da lógica (contagem de leads/reuniões/ligações/conversões) permanece igual.