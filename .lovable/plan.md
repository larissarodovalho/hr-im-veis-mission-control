## Objetivo

Permitir que **qualquer usuário autenticado** visualize os agendamentos em `/crm/agenda`, mantendo criação/edição/exclusão restritas aos papéis staff (admin, gestor, corretor, secretaria).

## Mudanças

### 1. Banco — RLS

**`reunioes`**: substituir a policy de SELECT atual por uma que libere leitura a qualquer `authenticated`.

**`agenda_bloqueios`**: mesmo ajuste, para que bloqueios apareçam no calendário compartilhado.

Policies de INSERT/UPDATE/DELETE permanecem inalteradas (continuam exigindo staff).

### 2. Sidebar (`src/components/AppSidebar.tsx`)

- Mostrar o item "CRM → Agenda" para todos os papéis autenticados (hoje fica oculto para `marketing` e futuros papéis sem acesso ao CRM).
- Demais subtabs do CRM continuam respeitando os papéis atuais.

### 3. Guardas de rota

- `StaffRoute.tsx` / `MarketingRoute.tsx` / `AppLayout.tsx`: liberar acesso à rota `/crm/agenda` para qualquer usuário autenticado (sem exigir staff). Outras rotas do CRM seguem protegidas.

### 4. Página `Schedule.tsx`

- Ocultar/desabilitar botões de ação (novo agendamento, confirmar, editar, bloquear horário) para usuários que não são staff — eles só verão o calendário em modo leitura. As RLS de escrita já bloqueiam no backend; isso evita confusão na UI.

## O que NÃO muda

- Leads, contas, imóveis, contratos, captações: permissões intactas.
- Apenas staff pode criar/confirmar/editar/excluir reuniões e bloqueios.
- Acesso continua exigindo login (não é público sem autenticação).
