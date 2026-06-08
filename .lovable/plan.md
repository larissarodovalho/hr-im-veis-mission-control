## Objetivo
- Corretor (sem admin/gestor/marketing) não vê mais o Dashboard.
- Ao entrar em `/crm`, o corretor é redirecionado para `/crm/contas`.
- Dashboard fica visível apenas para admin, gestor e marketing.

## Mudanças

### 1. `src/components/StaffRoute.tsx`
Hoje redireciona não-staff para `/crm?tab=leads`. Vamos:
- Manter staff = admin OR gestor.
- Adicionar prop opcional `allowMarketing` (default false) — quando true, marketing também passa.
- Mudar o fallback de não autorizado para `/crm/contas` (em vez de `/crm`), para evitar loop quando aplicado ao Dashboard.

### 2. `src/App.tsx`
Trocar a rota index do `/crm`:
```
<Route index element={<StaffRoute allowMarketing><Dashboard /></StaffRoute>} />
```
Assim corretor (que não é admin/gestor/marketing) é redirecionado para `/crm/contas` automaticamente ao acessar `/crm`.

### 3. `src/hooks/useMenuAccess.tsx` — `defaultForRole`
Atualizar visibilidade padrão do item `dashboard`:
- admin/gestor/marketing: visível
- corretor puro: oculto
- secretariaOnly / marketingOnly atuais: manter regras já existentes (secretariaOnly só agenda+minha-conta; marketingOnly ganha dashboard além de imoveis/agenda/minha-conta).

Isso garante que o item "Dashboard" desaparece do menu lateral para corretor puro.

### 4. Nenhuma mudança em banco, RLS ou outras páginas.

## Resultado
- Corretor abre o CRM → cai em `/crm/contas`, sem item Dashboard no menu.
- Admin, gestor e marketing continuam vendo e acessando o Dashboard normalmente.