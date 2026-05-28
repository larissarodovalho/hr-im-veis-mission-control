# Agendar sincronização periódica do Google Calendar → CRM

## Problema
A função `gcal-pull` (que importa eventos do Google para o CRM) está implementada e deployada, mas **nada a invoca**:
- `rg "gcal-pull"` no frontend não retorna nenhuma chamada
- `cron.job` no banco só tem o `process-email-queue` — não há cron para `gcal-pull`

Resultado: o usuário adiciona evento no Google Calendar do celular/PC e nunca aparece no CRM, porque o pull não roda.

## Solução

### 1. Cron job a cada 2 minutos (principal)
Adicionar job em `pg_cron` que faz `POST` em `/functions/v1/gcal-pull` (sem `wait`, modo background — a função já retorna 202 e processa cada usuário em `EdgeRuntime.waitUntil`).

```sql
select cron.schedule(
  'gcal-pull-every-2min',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/gcal-pull',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','<anon key>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Usar `supabase--insert` (não migration) porque a SQL contém URL/key do projeto.

### 2. Botão "Sincronizar agora" no card de Google Calendar (`src/components/configuracoes/GoogleCalendarConnect.tsx`)
Permite forçar pull sem esperar o cron. Chama `supabase.functions.invoke("gcal-pull", { body: { user_id: <atual>, wait: true } })` e mostra toast com resultado.

### 3. Garantir backfill inicial ao conectar
Hoje, no primeiro pull (sem `sync_token`), o código faz `timeMin: now()` — só busca eventos futuros a partir de "agora". Isso já cobre o caso do usuário ("acabei de adicionar no Google"). Não vamos importar histórico antigo do Google para o CRM (escopo deliberado).

## Verificação após deploy
1. Adicionar um evento direto no Google Calendar.
2. Aguardar ≤2min OU clicar "Sincronizar agora".
3. Conferir em `/crm/agenda` se a reunião aparece (com `origem='google_calendar'`).
4. Conferir `google_calendar_sync` e `reunioes` para o novo registro.

## Fora do escopo
- Webhooks push do Google (mais rápido que polling, mas exige domínio público verificado e mais setup) — pode ser feito depois.
- Importar eventos passados.
