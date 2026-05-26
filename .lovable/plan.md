# Permissões por usuário (acesso ao menu lateral)

Adiciona uma seção "Permissões" em cada usuário na página `/crm/usuarios` para liberar/bloquear itens do menu lateral individualmente, sobrescrevendo o padrão do papel.

## 1. Banco de dados

Nova tabela `user_menu_access`:
- `user_id` (uuid)
- `menu_key` (text) — ex.: `dashboard`, `leads`, `contas`, `whatsapp`, `reunioes`, `agenda`, `tarefas`, `documentos`, `contratos`, `relatorios`, `newsletter`, `imoveis`, `captacoes`, `parceiros`, `usuarios`, `configuracoes`, `minha-conta`
- `allowed` (boolean)
- Único `(user_id, menu_key)`

RLS:
- admin/gestor leem e escrevem para qualquer usuário
- usuário lê os próprios registros

Regra: se não houver registro → usa o padrão do papel. Se `allowed = true` → libera. Se `allowed = false` → bloqueia.

## 2. Hook `src/hooks/useMenuAccess.tsx`

- Carrega os overrides do usuário logado uma vez
- Expõe `canAccess(menuKey)` que combina papel + override
- `usuarios` e `configuracoes` continuam restritos a admin no nível de rota mesmo se liberados na UI

## 3. Sidebar (`src/components/AppLayout.tsx`)

- Adiciona `key` estável em cada item de `baseNav`, `adminNav`, `personalNav`
- Filtra cada lista por `canAccess(item.key)`
- Redirect: se a rota atual estiver bloqueada, manda para o primeiro item permitido

## 4. UI em `src/pages/UsuariosAdminPage.tsx`

- Novo botão "Permissões" (ícone cadeado) em cada linha de usuário
- Abre um Dialog grande com os itens agrupados por seção (CRM, Administração, Pessoal)
- Cada item tem um Switch **Liberado / Bloqueado**
- Estado inicial reflete o padrão do papel; mudar grava override via upsert
- Botão "Restaurar padrão do papel" (apaga todos os overrides do usuário)

## Detalhes técnicos

- Acesso a dados (RLS das tabelas) **não muda** — o override só controla o que aparece no menu e o guard de rota
- Liberar "Relatórios" para um corretor mostra o link, mas as queries continuam respeitando as policies existentes (pode aparecer vazio se o papel não tiver acesso aos dados)
- Sem níveis "editar próprio/editar todos" por enquanto — só Liberado/Bloqueado

Posso prosseguir?