## Integração Google Calendar (Workspace) — Conta única da empresa, bidirecional

### Como vai funcionar

- Conecta **uma única conta Google Workspace** da HR Imóveis via connector oficial (`google_calendar`). Todos os corretores compartilham essa agenda.
- Sincronização **bidirecional**:
  - **HR → Google**: ao criar/editar/cancelar reuniões, ligações, visitas e captações no sistema, o evento é criado/atualizado/removido na agenda Google.
  - **Google → HR**: eventos criados direto no Google Calendar são importados periodicamente como reuniões no sistema (com tag "Origem: Google").
- Cada evento no Google leva no título o tipo + nome do cliente/imóvel, e na descrição o link de volta pro registro no CRM.
- Convidados: e-mail do responsável + e-mail do cliente (quando houver) são adicionados como participantes — o Google envia o convite/lembrete automaticamente, resolvendo o lado de "notificação".

### Etapas

**1. Conectar a conta Google da empresa**
- Usar `standard_connectors--connect` com `google_calendar`. O usuário escolhe/loga uma vez na conta corporativa.
- Em **Configurações → Integrações**, adicionar um card "Google Calendar" mostrando status conectado, e-mail da conta e botão "Reconectar".
- Campo de configuração: ID do calendário a usar (padrão `primary`) salvo em nova tabela `integrations_config`.

**2. Tabela de mapeamento**
- Nova tabela `google_calendar_sync` (id, entity_type ∈ reuniao/ligacao/visita/captacao, entity_id, google_event_id, etag, last_synced_at, direction).
- Coluna opcional `google_event_id` nas tabelas `reunioes`, `ligacoes`, `visitas`, `captacoes_imovel` para lookup rápido.
- RLS: leitura para staff, escrita só por edge functions (service role).

**3. Edge functions**
- `gcal-push` (POST): recebe `{entity_type, entity_id, action: create|update|delete}`, monta o payload e chama o gateway `POST/PUT/DELETE /calendars/{calId}/events`. Grava `google_event_id` na tabela de mapeamento.
- `gcal-pull` (cron a cada 5 min via `pg_cron` + `pg_net`): usa `syncToken` do Google para puxar mudanças incrementais. Para cada evento novo/alterado vindo do Google sem mapping HR, cria uma `reunioes` com `origem='google'`. Para eventos já mapeados, atualiza data/título/notas no HR.
- `gcal-disconnect`: limpa tokens e mappings.
- Todas validam JWT do usuário staff e usam Zod nos inputs.

**4. Disparar push automaticamente**
- Triggers no Postgres em `reunioes`, `ligacoes`, `visitas`, `captacoes_imovel` que chamam `pg_net.http_post` para `gcal-push` em INSERT/UPDATE/DELETE (apenas quando integração está ativa).
- Loop de eco evitado por flag `skip_gcal_sync` no payload quando o pull cria/atualiza um registro.

**5. UI**
- **Configurações → Integrações**: card Google Calendar (conectar, status, última sync, calendário alvo, botão "Sincronizar agora").
- Nos diálogos de Reunião/Ligação/Visita/Captação: badge "🗓️ Na agenda Google" quando sincronizado, com link "Abrir no Google".
- Em **Agenda geral** (`/agenda`): filtro "Origem" (HR / Google / Todos) e ícone Google nos eventos importados.

### Detalhes técnicos

- Connector: `google_calendar` via gateway `https://connector-gateway.lovable.dev/google_calendar/calendar/v3` (token refresh automático).
- Escopo OAuth necessário: `https://www.googleapis.com/auth/calendar` (leitura+escrita). Verificar com `get_connection_configuration` após conectar e, se faltar, pedir reconnect.
- `syncToken` armazenado em `integrations_config.gcal_sync_token`; em caso de 410 GONE, full resync.
- Datas: usar `dateTime` + `timeZone: 'America/Cuiaba'`.
- Mapeamento de campos:
  - Reunião → summary "Reunião — {conta}", location/local, conferenceData se link, attendees: responsavel + conta.
  - Ligação → summary "Ligação — {conta}", duração de `duracao_seg`.
  - Visita → summary "Visita — {imóvel}", location: endereço do imóvel.
  - Captação → summary "Captação — {imóvel}", attendees: corretor captador + proprietário.

### Fora de escopo

- Sincronizar agendas pessoais de cada corretor (ficou descartado pela escolha "conta única").
- Google Meet automático (pode ser adicionado depois via `conferenceData.createRequest`).
- Notificações push/in-app dentro do HR — esta entrega usa os lembretes nativos do Google Calendar como mecanismo de notificação. Se quiser depois notificações dentro do sistema/WhatsApp avise, faço como segunda fase.