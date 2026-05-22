## Adicionar etapa "Parceiros" no funil de Contas

Adiciona uma nova etapa do funil chamada **Parceiros**, exibida como última coluna do Kanban (após "Followup"). Funciona como qualquer outra etapa: o card só aparece nela quando movido manualmente (drag-and-drop ou via menu "Mover para etapa").

### Mudanças

1. **`src/lib/contasFunil.ts`**
   - Adicionar `"parceiros"` ao tipo `EtapaFunil`.
   - Adicionar entrada `{ id: "parceiros", label: "Parceiros", color: "bg-accent/15 text-accent-foreground border-accent/30" }` ao final do array `ETAPAS` (após `perdido`/Followup).

2. **Sem alteração de schema**
   - A coluna `contas.etapa_funil` é `text` livre, então aceita o novo valor sem migration.

3. **Sem alterações em `ContasKanban.tsx`, `Accounts.tsx`, filtros de etapa ou export**
   - O Kanban já renderiza dinamicamente a partir de `ETAPAS`.
   - O `<Select>` de filtro por etapa em `Accounts.tsx` também usa `ETAPAS.map(...)`, então a nova opção aparece automaticamente.
   - Visível nas três abas (Todos, Carteira, Marketing) — não há restrição por aba para etapas.

### Fora de escopo
- Não vincular automaticamente à flag `is_partner` (continuam independentes).
- Não alterar permissões/RLS.
- Sem mudanças em Leads ou Imóveis.