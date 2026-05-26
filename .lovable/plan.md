As 2 ligações que aparecem no Dashboard estão armazenadas em `interacoes` (tipo='ligacao'), mas a página Ligações lê apenas da tabela `ligacoes` (que está vazia). Por isso a lista fica vazia.

## Correção

Em `src/pages/Calls.tsx`, no `load()`:

1. Buscar em paralelo também `supabase.from("interacoes").select("id,lead_id,conta_id,resultado,descricao,created_at,created_by").eq("tipo","ligacao")`.
2. Normalizar cada `interacao` para o mesmo formato usado pela tabela: `{ id, data: created_at, lead_id, conta_id, resultado, notas: descricao, duracao_seg: 0, _source: "interacao" }`. Itens de `ligacoes` recebem `_source: "ligacao"`.
3. Mesclar ambos arrays, hidratar `leads`/`contas` (já existe lógica) e ordenar por `data` desc.
4. No clique para editar (`openEdit`) e em `quickResult`/`saveEdit`/`remove`, usar `_source` para decidir a tabela: `interacoes` ou `ligacoes`. Campos mapeados: `data ↔ created_at`, `notas ↔ descricao`. Exclusão e update vão para a tabela de origem.

Assim a aba Ligações passa a listar tanto registros antigos (interacoes) quanto novos (ligacoes), e edição/exclusão preservam a origem.