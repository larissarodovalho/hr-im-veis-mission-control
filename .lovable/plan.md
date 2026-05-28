# Importar eventos do Google Calendar para o CRM

## Problema
O `gcal-pull` atualmente **ignora** qualquer evento do Google que não tenha sido criado pelo CRM (linha com `continue` no branch `else` do mapping). Resultado: agendamentos feitos direto no app do Google (celular/desktop) não aparecem no CRM.

## Solução
Reativar a criação de eventos no CRM quando um evento novo chega do Google sem mapping, salvando-o como `reuniao` e registrando o mapping em `google_calendar_sync` para evitar duplicação no próximo push/pull.

## Mudanças

### `supabase/functions/gcal-pull/index.ts`
No loop `for (const ev of j.items ?? [])`, no branch onde `map` não existe:

1. Pular eventos onde o próprio usuário não é organizador/criador apenas se forem convites de terceiros sem interesse (opcional — por padrão importar tudo do calendário primário do usuário).
2. Criar uma `reuniao` em `public.reunioes` com:
   - `titulo`: `ev.summary || "Evento Google"`
   - `agendada_para`: `startISO`
   - `duracao_min`: calculado a partir de start/end
   - `local`: `ev.location`
   - `notas`: `ev.description`
   - `corretor_id` / `responsavel_id`: `user_id` do dono do calendário
   - `origem`: `"google_calendar"` (se a coluna existir; caso contrário omitir)
   - `conta_id` / `lead_id`: `null` (evento solto, sem vínculo)
3. Inserir registro em `google_calendar_sync`:
   - `user_id`, `entity_type: "reuniao"`, `entity_id`: id da reunião criada
   - `google_event_id: ev.id`, `etag`, `html_link`, `calendar_id: conn.calendar_id`
   - `last_synced_at: now()`
4. Incrementar `imported++`.

### Verificações antes de codar
- Conferir colunas reais de `reunioes` (campos obrigatórios, default de `corretor_id`/`responsavel_id`, se existe `origem`).
- Conferir colunas de `google_calendar_sync` (nome exato: `calendar_id`, `etag`, etc.).
- Garantir que o `gcal-push` não tente re-empurrar um evento que acabou de ser importado (o mapping com `google_event_id` já evita isso, mas confirmar lógica).

### Calendário compartilhado
Após importar a reunião, opcionalmente disparar `gcal-shared-calendar` para refletir o novo evento na agenda compartilhada do CRM (mesmo fluxo já usado quando reunião é criada manualmente).

## Não faz parte do escopo
- Mudanças no `gcal-push` ou no `gcal-shared-calendar` (a não ser o disparo opcional acima).
- UI / componentes de frontend.
- Filtros avançados (palavras-chave, calendários múltiplos) — fica como melhoria futura.

## Teste
1. Criar um evento direto no Google Calendar do celular.
2. Aguardar/forçar `gcal-pull` (botão de sincronizar ou cron).
3. Verificar que aparece em `/crm/agenda` como reunião do usuário.
4. Editar o evento no Google → próximo pull deve atualizar a reunião (caminho `if (map)` já funciona).
5. Deletar no Google → reunião removida do CRM (caminho `ev.status === "cancelled"` já funciona).
