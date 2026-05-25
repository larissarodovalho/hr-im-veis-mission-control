## Integração Google Calendar — Cada usuário conecta a própria conta

Ajuste do plano anterior: em vez de uma única conta da empresa, **cada corretor/usuário conecta o próprio Google** e a sincronização acontece com a agenda pessoal dele. A agenda do CRM continua única e compartilhada entre todos (já é assim hoje).

### Como vai funcionar

- Em **Configurações → Minha conta**, cada usuário vê um botão **"Conectar Google Calendar"**. O login é individual com o e-mail Google de cada um.
- Quando alguém cria um evento (reunião, ligação, visita, captação) no CRM:
  - O evento aparece pra **todos** na agenda do CRM (comportamento atual, sem mudança).
  - O evento é replicado **na agenda Google pessoal do responsável** daquele evento.
  - Se o evento tiver outros usuários do CRM como convidados (ex.: corretor + gestor), eles entram como `attendees` pelo e-mail Google — o Google envia o convite e o evento cai na agenda deles também.
- Quando o usuário cria um evento direto no Google Calendar dele, ele aparece **só pra ele** na agenda do CRM (com badge "📅 Google pessoal"), não vira evento público do CRM — para evitar poluir a agenda compartilhada com compromissos pessoais. Se ele quiser que vire evento do CRM, marca um checkbox "Publicar no CRM" no item.

### Por que precisa de OAuth próprio (não connector)

O connector do Lovable autentica **uma conta só** (a do dev). Para cada usuário ter a própria, precisamos implementar OAuth do Google direto no app, com credenciais do Google Cloud da HR Imóveis.

**O que você precisa fornecer** (eu te guio passo a passo na hora):
1. Criar um projeto no Google Cloud Console.
2. Ativar a **Google Calendar API**.
3. Criar credenciais **OAuth 2.0 Client ID** tipo Web Application.
4. Adicionar a URL de callback que eu vou te dar.
5. Me passar o **Client ID** e **Client Secret** — vou salvar como secrets seguros (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`).

Enquanto isso não estiver pronto, monto a UI/banco/edge functions e deixo o botão "Conectar" sinalizando "Aguardando configuração do admin".

### Etapas técnicas

**1. Banco**
- `user_google_calendar` (user_id, google_email, access_token, refresh_token, token_expires_at, calendar_id default `primary`, sync_token, connected_at). RLS: cada usuário só vê/edita o próprio registro. Tokens criptografados/protegidos só lidos por edge function via service role.
- `google_calendar_sync` (entity_type, entity_id, user_id, google_event_id, etag, last_synced_at) — mapeia evento CRM ↔ evento Google por usuário (porque o mesmo evento do CRM pode estar replicado em várias contas Google de convidados).
- Colunas em `reunioes/ligacoes/visitas/captacoes_imovel`: `origem` ∈ ('crm','google'), `google_owner_user_id` (quando importado de Google pessoal).

**2. Edge functions**
- `google-oauth-start` — gera URL de consentimento com escopo `https://www.googleapis.com/auth/calendar`.
- `google-oauth-callback` — troca `code` por tokens, grava em `user_google_calendar`.
- `google-oauth-disconnect` — revoga e apaga tokens.
- `gcal-push` — recebe `{entity_type, entity_id, action}`. Busca o responsável + convidados que têm Google conectado. Chama `events.insert/patch/delete` na Calendar API com refresh automático do token. Salva mapping por usuário.
- `gcal-pull` — cron 5 min: pra cada usuário conectado, faz `events.list` com `syncToken`. Importa eventos novos como reuniões privadas do usuário (`origem='google'`, visíveis só pra ele) até ele marcar "Publicar no CRM".

**3. Triggers**
- Triggers em `reunioes/ligacoes/visitas/captacoes_imovel` (INSERT/UPDATE/DELETE) chamam `pg_net.http_post` pra `gcal-push`. Flag `_skip_gcal` no payload evita loop quando o pull cria o registro.

**4. UI**
- **Configurações → Minha conta → Google Calendar**: botão Conectar/Desconectar, mostra e-mail Google vinculado, última sync, link "Abrir minha agenda Google".
- Diálogos de Reunião/Visita/Ligação/Captação: badge "📅 Sincronizado no Google" + linkzinho pra abrir, e um pequeno seletor de convidados (responsável já vai por padrão).
- Agenda geral (`/agenda`): filtro "Origem" (CRM / Minha agenda Google / Todos). Eventos importados do Google ficam com ícone próprio e só são visíveis pro dono até serem "publicados".

### Detalhes técnicos

- Endpoint Google: `https://www.googleapis.com/calendar/v3/calendars/primary/events`.
- Refresh de token: edge function detecta 401 → usa `refresh_token` no endpoint `https://oauth2.googleapis.com/token` → atualiza `user_google_calendar`.
- Timezone: `America/Cuiaba` por padrão (pegando do `profiles` se existir).
- Para revogar: `https://oauth2.googleapis.com/revoke?token=...`.

### Fora de escopo desta entrega

- Sincronizar agendas compartilhadas/secundárias do Workspace (só `primary` por enquanto).
- Google Meet automático nos eventos (posso adicionar depois com `conferenceData.createRequest`).
- Importar histórico inteiro da agenda Google antes da conexão — só eventos a partir do momento que conectar.

Confirma que devo seguir por aqui? Quando confirmar, já começo pelo banco + UI do botão de conectar, e depois te peço o Client ID/Secret do Google quando chegar a hora do OAuth funcionar de verdade.