## Problema

Em `src/components/AppSidebar.tsx` linha 81:
```ts
const isCRM = location.pathname === "/crm";
```
Como a subtab "Tarefas" agora aponta para `/crm/tarefas`, ao clicar nela o `isCRM` vira `false` e o painel inteiro de subtabs (Leads, Contatos, …, Tarefas) some. O mesmo acontece em `/crm/agenda`, `/crm/visitas`, etc.

## Correção

1. Trocar a detecção para cobrir qualquer rota dentro do CRM:
   ```ts
   const isCRM = location.pathname === "/crm" || location.pathname.startsWith("/crm/");
   ```
2. Ajustar `activeTab` para que, quando estivermos numa rota CRM filha conhecida, ela aponte para o subtab correto (ex.: `/crm/tarefas` → `tarefas`). Mantém realce visual ao navegar entre subtabs.

Só isso. Sem mudanças de schema/RLS/edge.
