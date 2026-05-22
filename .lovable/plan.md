## Objetivo
Criar um novo perfil de usuário **Marketing** que só consegue acessar a aba **Imóveis** do CRM (listar, criar, editar e subir fotos/descrições de imóveis). Sem acesso a Leads, Contas, WhatsApp, Relatórios, Configurações etc.

## Mudanças

### 1. Banco de dados (migration)
- Adicionar valor `'marketing'` ao enum `app_role`.
- Atualizar função `is_staff()` para incluir `marketing` (assim ele passa nas policies de INSERT/UPDATE de `imoveis` e storage).
- **Policies de `imoveis`**: hoje qualquer staff vê tudo. Marketing também precisa ver/criar/editar imóveis — as policies atuais já cobrem `corretor`, vou estender para incluir `marketing` (SELECT, INSERT, UPDATE).
- **Bloquear marketing nas demais tabelas sensíveis**: as policies atuais usam `has_role('admin')`, `has_role('gestor')` ou `corretor_id = auth.uid()` — marketing automaticamente não terá acesso a leads, contas, contratos, ligações etc., pois não é nenhum desses papéis.
- Storage bucket `imoveis` já é público para leitura; marketing precisa poder fazer upload — verificar/ajustar policy de storage se necessário.

### 2. Frontend — controle de acesso
- **`AuthContext.tsx`**: adicionar `isMarketing` (derivado de `roles.includes('marketing')`).
- **Novo `MarketingRoute.tsx`** (ou ampliar `StaffRoute`): redireciona marketing para `/crm/imoveis` se tentar acessar outra rota do CRM.
- **`App.tsx`**: rota índice do `/crm` redireciona marketing direto para `/crm/imoveis`.
- **`AppSidebar.tsx`**:
  - Marketing vê apenas o item "CRM — Comercial" com **apenas a sub-aba Imóveis** visível.
  - Esconder Marketing/Integrações/Operacional/Saúde/Administração para esse perfil.
- **`ProtectedRoute` / guards de página**: bloquear Leads, Contas, WhatsApp etc. para marketing (redirect para `/crm/imoveis`).

### 3. Tela de Usuários (`UsuariosAdminPage`)
- Incluir `marketing` como opção ao criar/editar papel de um usuário (dropdown de roles).
- Badge visual para o novo papel.

### 4. Edge function `admin-create-user`
- Permitir `role: 'marketing'` no payload (validação do enum).

## Detalhes técnicos

- Enum update: `ALTER TYPE public.app_role ADD VALUE 'marketing';` (precisa ser commitado antes de ser usado em policies — fazer em migration única com transação adequada ou em duas migrations, conforme requerido pelo Postgres).
- Comportamento da tela `Imoveis.tsx`: já permite criar/editar via `NovoImovelDialog` e `EditarImovelDialog`; nenhuma mudança de UI necessária além do guard de rota.
- Marketing **não** verá: dashboard, leads, contas, WhatsApp, ligações, visitas, agenda, tarefas, documentos, contratos, relatórios, usuários, configurações, newsletter, meta-ads.

## Pergunta antes de implementar
1. Marketing deve poder **excluir** imóveis ou só criar/editar? (hoje só admin deleta — manter assim?)
2. Marketing deve aparecer como **corretor captador** dos imóveis que sobe, ou ficar sem vínculo de corretor?
