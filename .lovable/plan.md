## Objetivo

Adicionar uma quarta opção de papel na aba **Usuários**: **"Gestor + Corretor"** — usuário com permissões de gestor (vê tudo, acessa Relatórios/Newsletter/Usuários/Configurações) e que também aparece como corretor responsável em leads, contas e imóveis.

Sem migração de banco. Usa o enum `app_role` atual e a tabela `user_roles` (que já permite múltiplas linhas por usuário via `unique(user_id, role)`).

## Como funciona

Internamente o usuário fica com **duas linhas** em `user_roles`: uma `gestor` + uma `corretor`. O front exibe esse caso como um único valor "Gestor + Corretor" no dropdown.

Comportamento resultante:
- RLS de gestor → vê todos os dados da empresa (já existe via `has_role(uid, 'gestor')`)
- RLS de corretor → aparece como responsável próprio quando atribuído em `leads.corretor_id`, `contas.responsavel_id`, etc.
- Rotas admin/gestor (`StaffRoute`) → libera (porque tem `gestor`)
- `isAdmin` / `isGestor` no AuthContext → `isGestor=true`, `isAdmin=false`

## Mudanças

### 1. Edge function `supabase/functions/admin-create-user/index.ts`

Aceitar `role: "gestor_corretor"` (valor virtual, apenas no payload do front) nas 3 ações que mexem em roles:

- `create`, `update_role`, `update_profile`:
  - Validar role aceitando o novo valor virtual.
  - Quando `role === "gestor_corretor"`: após `delete` das roles atuais, inserir **duas linhas** (`gestor` e `corretor`) em vez de uma.
  - Demais roles: comportamento atual inalterado.

### 2. `src/pages/UsuariosAdminPage.tsx`

- Adicionar tipo local `UiRole = AppRole | "gestor_corretor"`. Estado do form e da row passa a usar `UiRole`.
- Em `fetchUsers`, trocar lógica de prioridade: agrupar **todas** as roles por `user_id` num `Set`. Se contém `gestor` **e** `corretor` (e não `admin`) → exibir como `"gestor_corretor"`. Senão, manter prioridade admin > gestor > corretor.
- Em todos os 3 `<Select>` de papel (criação, edição, linha da tabela), adicionar `<SelectItem value="gestor_corretor">Gestor + Corretor</SelectItem>`.
- Largura do select da tabela: aumentar `w-32` para `w-44` para caber o novo rótulo.
- `callAdmin` continua igual — só repassa a string.

### 3. Sem alterações em

- Schema do banco / enum `app_role`
- RLS policies
- `AuthContext` / `StaffRoute` / `useRole` (já funcionam corretamente quando o usuário tem ambas as roles: `isGestor` retorna true porque inclui `gestor`)
- Demais telas

## Validações

- Após salvar, `fetchUsers` deve reler e exibir "Gestor + Corretor" para o usuário alvo.
- Trocar de "Gestor + Corretor" para qualquer outro papel limpa as duas linhas e insere a nova (já feito pelo `delete` + `insert` existente).
- Auto-proteção: ao editar o próprio usuário admin, o select continua desabilitado (lógica atual mantida).
