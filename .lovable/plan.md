## Novo papel: Secretaria

Cria o papel **Secretaria** com acesso restrito apenas à aba **Agenda** do CRM, com autonomia para agendar e confirmar reuniões.

### 1. Banco de dados (migração)
- Adicionar `'secretaria'` ao enum `public.app_role`.
- Atualizar `public.is_staff()` para incluir `secretaria` (assim as policies existentes de `reunioes`, `leads`, `bloqueios_agenda` etc. liberam SELECT/INSERT/UPDATE de reuniões para a secretaria).

### 2. Auth / contexto (`src/contexts/AuthContext.tsx`)
- Adicionar `"secretaria"` ao tipo `AppRole`.
- Expor `isSecretariaOnly` (true quando o usuário tem só a role `secretaria`).

### 3. Tela de Usuários (`src/pages/UsuariosAdminPage.tsx`)
- Adicionar `secretaria: "Secretaria"` em `ROLE_LABELS`.
- Adicionar opção "Secretaria" nos 3 `<Select>` de papel (criação, edição, filtro).
- Atualizar `resolve()` para mapear a role `secretaria`.

### 4. Sidebar (`src/components/AppSidebar.tsx`)
- Adicionar item de subtab **"Agenda"** em `CRM_SUBTABS` (rota `/crm/agenda`) e mapear em `CRM_SUBTAB_ROUTES`.
- Para `isSecretariaOnly`:
  - Esconder todos os itens de menu superiores exceto **CRM — Comercial** e **Minha conta**.
  - Na sublista do CRM, mostrar apenas **Agenda**.
  - Link do CRM redireciona direto para `/crm/agenda`.

### 5. Guard de rotas (`src/App.tsx` + redirect)
- Quando `isSecretariaOnly`, qualquer rota fora de `/crm/agenda` e `/crm/minha-conta` redireciona para `/crm/agenda` (guarda leve dentro do layout do CRM).

### 6. Página Agenda (`src/pages/Schedule.tsx`)
- Sem mudança funcional: secretaria já consegue criar/editar reuniões via RLS de staff. Confirmar = alterar o campo `status` para `confirmada` no formulário existente (já suportado).

### Considerações
- O papel é **somente leitura** para o resto do sistema porque as rotas estão escondidas e o redirect leva sempre para a Agenda; as policies de outras tabelas continuam exigindo admin/gestor/corretor para escrita sensível.
- Não altera papéis existentes nem dados.
