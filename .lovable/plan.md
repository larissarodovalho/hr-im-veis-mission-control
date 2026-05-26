## Objetivo
Permitir que TODOS os usuários (incluindo os de marketing) tenham acesso à aba "Agenda" do CRM.

## Situação atual
- A rota `/crm/agenda` está envolvida por `MarketingRoute`, que redireciona usuários "marketing-only" para `/crm/imoveis`.
- No sidebar (`AppLayout.tsx`), usuários marketing-only só veem o item "Imóveis" — "Agenda" fica oculto.
- Demais perfis (admin, gestor, corretor) já têm acesso normal.

## Mudanças

### 1. `src/App.tsx`
Remover o `MarketingRoute` apenas da rota da Agenda:
```tsx
<Route path="agenda" element={<Schedule />} />
```
(Mantém `ProtectedRoute` para exigir login.)

### 2. `src/components/AppLayout.tsx`
Ajustar o filtro do menu para que usuários marketing-only também vejam o item "Agenda" (além de "Imóveis"):
```tsx
const nav = isMarketingOnly
  ? baseNav.filter((n) => n.to === "/crm/imoveis" || n.to === "/crm/agenda")
  : ...
```

## Fora de escopo
- Nenhuma alteração em RLS/banco — a página `Schedule` já lê dados públicos para usuários autenticados, e o objetivo é apenas visualização compartilhada do calendário.
- Permissões de edição/criação dos agendamentos permanecem como estão.
