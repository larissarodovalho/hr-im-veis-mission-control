Adicionar coluna "Permuta" no Kanban de Leads, entre "Proposta" e "Fechado".

Alteração única em `src/lib/leads.ts`:
1. Adicionar `'Permuta'` ao union `Stage` (entre `'Proposta'` e `'Fechado'`).
2. Inserir `{ id: 'Permuta', label: 'Permuta', color: 'bg-amber-600' }` no array `STAGES` na mesma posição.

Como `etapa_funil` é `text` livre no banco (sem CHECK), nenhuma migração é necessária. Leads existentes continuam funcionando; apenas surgirá a nova coluna vazia que poderá receber cards por drag-and-drop.