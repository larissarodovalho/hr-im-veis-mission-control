## Problema

Ao clicar em **Relatórios** (`/crm/relatorios`), o `StaffRoute` redireciona para `/crm?tab=leads`, mesmo quando o usuário é admin/gestor.

## Causa

Em `src/contexts/AuthContext.tsx`, o `loading` é marcado como `false` assim que `getSession()` resolve, mas as roles são carregadas **depois**, dentro de um `setTimeout(..., 0)` em `loadUserData`.

Resultado: na primeira renderização após login (ou refresh direto em `/crm/relatorios`), `StaffRoute` vê `loading=false` e `roles=[]` → `isAdmin=false`, `isGestor=false` → redireciona. Quando as roles finalmente chegam, o usuário já foi mandado para o dashboard. Mesma causa afeta `/crm/usuarios`, `/crm/configuracoes` e `/crm/newsletter`.

Confirmado no banco: o usuário logado (ex.: `hans@gruporodovalho.com.br`) tem role `gestor`, então deveria passar.

## Correção

Manter `loading=true` até que as roles tenham sido carregadas pelo menos uma vez, para que `StaffRoute` não decida com estado incompleto.

### Mudanças em `src/contexts/AuthContext.tsx`

1. Remover o `setTimeout` de `loadUserData` e fazer a função `await` direto as queries de `profiles` e `user_roles`.
2. Em `onAuthStateChange` e em `getSession().then(...)`, só setar `loading=false` **após** `loadUserData` completar (ou quando não houver sessão).
3. Quando não houver `sess?.user`, zerar `profile`/`roles` e setar `loading=false`.

Nenhuma outra mudança é necessária — `StaffRoute` e `ProtectedRoute` já respeitam `loading`.

## Validação

- Login como gestor/admin → clicar em Relatórios → página abre normalmente.
- Refresh direto em `/crm/relatorios` → não redireciona.
- Login como corretor → continua sendo redirecionado para `/crm?tab=leads` (comportamento esperado).
