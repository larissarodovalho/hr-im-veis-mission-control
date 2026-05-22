## Objetivo
Adicionar um menu de três pontinhos (⋮) em cada card do Kanban de Contas (aba "A Contatar" e demais etapas) permitindo alterar rapidamente:
1. **Responsável** pelo contato
2. **Etapa do funil** (qualificação no Kanban)

## Mudanças

### `src/components/contas/ContasKanban.tsx`
- Adicionar botão `MoreVertical` (lucide) no canto superior direito do `ContaCard`, ao lado do badge "Parceiro".
- Envolver em `DropdownMenu` (shadcn) com dois submenus:
  - **"Mover para etapa"** → lista todas as `ETAPAS` de `contasFunil.ts`; ao clicar chama `onMoveStage(conta.id, etapa)` (já existe).
  - **"Responsável"** → lista de usuários (corretores/gestores/admins) vinda de uma nova prop `owners: { id: string; nome: string }[]`; ao clicar chama nova prop `onChangeOwner(contaId, userId)`.
- Impedir propagação de pointer/click no trigger pra não disparar o drag do `useDraggable`.

### `src/pages/Accounts.tsx` (página que renderiza o Kanban)
- Já carrega `ownerMap`; carregar também a lista bruta `owners` (id + nome) — provavelmente já existe; reusar.
- Implementar `handleChangeOwner(contaId, userId)`:
  - `supabase.from("contas").update({ responsavel_id: userId }).eq("id", contaId)`
  - Toast + refetch (mesmo padrão de `onMoveStage`).
- Passar `owners` e `onChangeOwner` para `<ContasKanban />`.

## Detalhes técnicos
- Usar `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` (já disponíveis em `@/components/ui/dropdown-menu`).
- No trigger do menu: `onPointerDown={(e) => e.stopPropagation()}` e `onClick={(e) => e.stopPropagation()}` pra não conflitar com `useDraggable`.
- Marcar a etapa atual e o responsável atual com check (`Check` icon) pra feedback visual.
- Nenhuma alteração de schema necessária — coluna `responsavel_id` e `etapa_funil` já existem em `contas`.

## Fora de escopo
- Não mexer em outras visualizações (lista/tabela) nem na lógica do drag-and-drop existente.
