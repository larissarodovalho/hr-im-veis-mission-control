## Objetivo
Ocultar do funil de Leads (Kanban e Lista) todos os leads que já foram convertidos em conta, para que apareçam apenas na aba Contas (subaba Marketing).

## Mudanças

**`src/pages/Leads.tsx`**
- Aplicar filtro adicional em `filtered` para excluir leads cujo `id` esteja em `convertedIds` (que já é carregado via `contas.lead_id_origem`).
- Vale para as duas visualizações (Kanban e Lista).
- Remover o badge "Conta" (não é mais necessário, já que esses leads não aparecem mais na aba).
- KPIs do topo (se existirem contagens locais) passam a refletir apenas leads ativos (não convertidos).

## Observações
- Nenhuma alteração no banco. Os leads continuam existindo em `public.leads` — apenas são omitidos da UI da aba Leads.
- Dashboard e Relatórios não são afetados por esta mudança (podem ser tratados depois, se você quiser).