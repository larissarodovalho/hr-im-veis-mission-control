# Agenda compartilhada da equipe via Google Calendar

## Objetivo

Permitir que o admin crie uma agenda Google compartilhada (dentro da própria conta Google dele), convide usuários do CRM selecionados, e que todos os eventos do CRM (reuniões, ligações, visitas, captações) apareçam nessa agenda — visível e editável no celular de cada pessoa convidada.

## Como o usuário final vai usar

1. Admin entra em **Configurações → Google Calendar**, conecta a conta Google (já existe).
2. Aparece um novo card **"Agenda compartilhada da equipe"**:
   - Botão **"Criar agenda compartilhada"** (só na primeira vez)
   - Depois de criada, mostra: nome da agenda, link pro Google, e a lista de membros
3. Admin clica em **"Convidar membros"** → modal com a lista de usuários do CRM, checkbox para selecionar quem convidar e dropdown de permissão por pessoa (Ver / Editar / Gerenciar).
4. Ao confirmar, o sistema chama a API do Google e adiciona cada email com a permissão escolhida. Cada usuário recebe um convite por email do próprio Google.
5. No celular, os membros adicionam a conta Google deles (se ainda não tiverem) e a agenda aparece automaticamente no Google Agenda / Apple Calendar.
6. Eventos do CRM passam a ser empurrados pra essa agenda compartilhada (em paralelo aos eventos pessoais do responsável, que continuam funcionando como hoje).

## O que muda no sistema

### 1. Configuração global em `site_settings`

Nova chave `shared_calendar` armazenando:
- `google_calendar_id` — id da agenda criada no Google
- `owner_user_id` — usuário do CRM dono da agenda (admin que conectou)
- `created_at`
- `push_to_personal` — boolean, se `true` continua empurrando também pra agenda pessoal do responsável (padrão `true`)

### 2. Nova edge function `gcal-shared-calendar`

Responsável por gerenciar a agenda compartilhada. Aceita 4 ações:

- **`create`** — cria a agenda "Agenda HR Imóveis" via `POST /calendars` na conta do admin logado. Salva o `google_calendar_id` em `site_settings`.
- **`list_members`** — lista ACL atual via `GET /calendars/{id}/acl`. Retorna emails + roles atuais.
- **`add_members`** — recebe `[{ email, role }]` e faz `POST /calendars/{id}/acl` para cada um (`role` mapeia para `reader` / `writer` / `owner`). Por padrão `sendNotifications=true` → Google manda o email de convite.
- **`remove_member`** — `DELETE /calendars/{id}/acl/{ruleId}`.

Usa o token OAuth já armazenado em `user_google_calendar` do admin.

### 3. Ajuste no `gcal-push` existente

Hoje empurra só pra `conn.calendar_id` (agenda pessoal do responsável). Vai passar a empurrar **também** pra agenda compartilhada, se existir em `site_settings.shared_calendar`:

- Continua criando/atualizando o evento na agenda pessoal do responsável (comportamento atual).
- Adicionalmente, cria/atualiza o mesmo evento na agenda compartilhada usando o token do **dono da agenda** (admin), não o do responsável.
- Tabela `google_calendar_sync` ganha registros adicionais com `user_id = owner_user_id` para rastrear o evento compartilhado.
- Se `push_to_personal = false`, só empurra pra compartilhada (economiza chamadas, mas perde o "vê na minha agenda pessoal").

Delete também precisa remover das duas agendas.

### 4. UI em `src/pages/ConfiguracoesPage.tsx`

Novo card "Agenda compartilhada da equipe" na aba Sistema, visível só para admin/gestor:
- Se não existir: botão **"Criar agenda compartilhada"** (chama `gcal-shared-calendar` ação `create`).
- Se existir: nome, link "Abrir no Google Calendar", switch "Também duplicar na agenda pessoal do responsável" (controla `push_to_personal`), e tabela de membros com botão **"Convidar / Gerenciar membros"**.

### 5. Componente `SharedCalendarMembersDialog`

Modal que:
- Lista usuários do CRM (`profiles` join `user_roles`) com email
- Mostra status atual de cada um (Não convidado / Ver / Editar / Gerenciar) consultando `list_members`
- Permite adicionar/alterar/remover em lote
- Confirma e chama `add_members` / `remove_member`

## Considerações técnicas

- **Permissão Google**: a conta do admin precisa ter escopo `https://www.googleapis.com/auth/calendar` (escopo amplo, não apenas `.events`). Já é o escopo configurado em `_shared/google-calendar.ts` (`GOOGLE_OAUTH_SCOPES`), então não precisa reconectar.
- **Token expirado do admin**: se o admin desconectar a conta Google, o push pra agenda compartilhada para de funcionar. Vamos mostrar aviso na tela de Configurações nesse caso.
- **Eventos antigos**: a sincronização vale pra eventos novos. Posso adicionar um botão "Reenviar todos os eventos futuros pra agenda compartilhada" se quiser, mas deixo de fora do escopo inicial.
- **iPhone sem conta Google**: usuário convidado que não tem Google precisa criar uma (gratuito) ou usar a opção de feed ICS (fora deste escopo).
- **Sem schema novo além de `site_settings`**: tudo se encaixa nas tabelas existentes (`google_calendar_sync`, `site_settings`, `profiles`).

## Fora do escopo (para futuro, se quiser)

- Feed ICS público pra quem não usa Google
- Integração Outlook 365
- Múltiplas agendas compartilhadas (ex: uma por equipe regional)
