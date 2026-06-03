## Diagnóstico

Já revisei a função `supabase/functions/gcal-pull/index.ts` (corrigida na conversa anterior). Hoje ela resolve o criador real assim, antes do insert:

```ts
let realCreator = user_id;                  // fallback = dono do calendário sincronizado
const creatorEmail = (ev.creator?.email || ev.organizer?.email || "").toLowerCase().trim();
if (creatorEmail) {
  const { data: prof } = await supa.from("profiles")
    .select("user_id").ilike("email", creatorEmail).maybeSingle();
  if (prof?.user_id) realCreator = prof.user_id;
}
```

Verificado:
- Não há emails duplicados em `profiles` (não vai dar erro de múltiplas linhas no `maybeSingle`).
- Todos os 8 corretores têm o email correto (`@gruporodovalho.com.br` ou pessoal) no `profiles`.

O fix funciona para **eventos importados a partir de agora**. O problema que o usuário ainda vê é:

1. **Todos os eventos importados ANTES do fix** ficaram com `created_by = dono do calendário sincronizado`. São ~20 eventos hoje, todos visíveis na agenda.
2. **Não temos jeito de saber o criador real só pelo banco** — precisa repuxar o evento do Google pra ler `ev.creator.email`.
3. Casos em que o criador é uma pessoa de fora (cliente, lead etc.) vão continuar caindo no fallback (dono do calendário) porque não tem `profiles` correspondente — isso é inevitável.

## Plano

### 1. Diagnóstico no `gcal-pull` (rastreabilidade)

Em `supabase/functions/gcal-pull/index.ts`, adicionar `console.log` quando o creatorEmail existe mas **não casa** com nenhum profile, registrando o email. Assim qualquer caso futuro de "criador errado" pode ser conferido nos logs.

```ts
if (creatorEmail && !prof?.user_id) {
  console.log(`[gcal-pull] creator sem profile correspondente: ${creatorEmail} (event ${ev.id})`);
}
```

### 2. Nova função `gcal-creator-backfill`

Cria `supabase/functions/gcal-creator-backfill/index.ts` que:

- Aceita `user_id` (opcional). Sem `user_id`, roda para todos os usuários conectados.
- Para cada usuário:
  - Pega `access_token` via `getValidAccessToken` (mesma helper que o `gcal-pull` usa).
  - Itera todos os `google_calendar_sync` desse usuário com `entity_type = 'reuniao'`.
  - Para cada um, faz `GET /calendars/{calendar_id}/events/{google_event_id}`.
  - Lê `ev.creator.email || ev.organizer.email`.
  - Se casar com um `profiles.email`, faz `UPDATE reunioes SET created_by = <user real> WHERE id = <entity_id>`.
  - Conta total processado, total atualizado, total sem match.
- Retorna JSON com as contagens. CORS e padrão das outras edge functions.

### 3. Botão de "Recalcular criadores" nas Configurações

Em `src/components/configuracoes/GoogleCalendarConnect.tsx` (ou onde já tem o card de Google Agenda), adicionar um botão discreto: **"Recalcular criadores dos eventos"** que chama `supabase.functions.invoke("gcal-creator-backfill")` e mostra toast com o resumo. Assim o admin pode rodar quando quiser sem depender de mim/curl.

### 4. (Opcional) Aceitar `?event_id=` no backfill

Útil pra reprocessar um evento específico caso volte a haver dúvida. Pequeno e barato; deixo no plano só se você quiser confirmar.

## O que NÃO vou mexer

- Não vou apagar/recriar eventos.
- Não vou tocar em `corretor_id` ou `google_owner_user_id` — quem é "dono da agenda" não muda.
- Não vou alterar a lógica do `gcal-push` (criação manual no CRM já usa `auth.uid()` correto).

## Resumo

- Log de diagnóstico no `gcal-pull` pra capturar futuros mismatches.
- Função `gcal-creator-backfill` pra corrigir retroativamente os eventos já importados, lendo o criador real direto do Google.
- Botão no card do Google Agenda pra disparar o backfill manualmente.