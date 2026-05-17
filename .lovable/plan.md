## Objetivo
Nas abas **Ligações** e **Visitas** (modo "Registrar manualmente"), permitir selecionar o vínculo digitando o nome — tanto **Lead** quanto **Conta** — como já fizemos na aba Reuniões.

## 1. Componente compartilhado
Extrair o `SearchableSelect` que hoje vive dentro de `src/pages/Meetings.tsx` para um arquivo reutilizável: `src/components/SearchableSelect.tsx` (input com filtro por nome, opção "Sem vínculo", ícones check/chevron). Atualizar `Meetings.tsx` para importar deste novo arquivo (sem mudar comportamento).

## 2. `src/pages/Calls.tsx`
- Carregar `contas` em paralelo no `useEffect` (`select("id, nome").order("nome")`).
- Adicionar `conta_id` ao state `form` e `editForm`.
- Substituir o `<Select>` de Lead no diálogo "Nova ligação" por dois `<SearchableSelect>`: **Lead** e **Conta** (cada um com "Sem vínculo").
- Incluir `conta_id` no `insert` e no `update` de `ligacoes`.
- No `openEdit`, popular `conta_id` a partir da ligação.
- No `load()`, também resolver `contasById` (igual ao que já é feito com leads) e adicionar `c.conta` ao item.
- Na tabela, coluna "Lead" passa a mostrar conta (link para `/app/contas/:id`) quando não houver lead.

## 3. `src/pages/Visits.tsx`
- Carregar `contas` em paralelo no `useEffect`.
- Adicionar `conta_id` a `form` e `editForm`.
- Substituir o `<Select>` de Lead no diálogo "Nova visita" por `<SearchableSelect>` de **Lead** e adicionar `<SearchableSelect>` de **Conta**.
- Validação: exigir lead **ou** conta (não mais "Selecione um lead").
- Incluir `conta_id` no `insert` e `update` de `visitas`.
- No `load()`, ajustar o select para também trazer `contas(id,nome)` (via segunda query com `in`, no mesmo padrão de Calls) e mostrar nome da conta na coluna/calendário como fallback do lead.
- No edit dialog, expor `<SearchableSelect>` de Lead e Conta também.

## 4. Sem mudanças de schema
As tabelas `ligacoes` e `visitas` já têm `conta_id` (visitas recebeu a coluna na alteração anterior). RLS atuais cobrem os inserts.
