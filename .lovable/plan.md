## Diagnóstico

Verifiquei o estado atual:

1. **A agenda compartilhada está criada e configurada** (`shared_calendar` em `site_settings`, dono = você).
2. **O convite ACL para o membro foi enviado** — quando ele aceitar e habilitar a agenda no celular, ele verá os eventos *futuros*.
3. **Porém:** todos os 20 últimos registros em `google_calendar_sync` apontam para `calendar_id = "primary"` (apenas a sua agenda pessoal). **Nenhum evento foi empurrado para a agenda compartilhada ainda.**

Motivos prováveis:
- A função `gcal-push` não foi chamada para nenhum evento *depois* da criação da agenda compartilhada (14:28). Logo, mesmo com a config no lugar, não há evento na agenda nova.
- Eventos *antigos* (criados antes da agenda existir) também não foram para lá — a duplicação só acontece no momento em que o `gcal-push` roda.

Conclusão: o sistema funciona pra eventos *novos* que forem criados/editados a partir de agora, mas o histórico precisa ser preenchido manualmente (backfill).

## O que vou fazer

### 1. Adicionar botão "Sincronizar eventos existentes" no `SharedCalendarCard`
Quando o admin clica, dispara uma nova ação `backfill` na edge function `gcal-shared-calendar` que:
- Busca todas as `reunioes`, `ligacoes`, `visitas` e `captacoes` futuras (data >= hoje) que ainda não estão em `google_calendar_sync` com `calendar_id = <id da agenda compartilhada>`.
- Para cada uma, chama internamente o `gcal-push` (action = "create") usando o token do dono da agenda.
- Retorna contagem `{ inseridos, atualizados, falhas }` e mostra um toast com o resultado.

Limite de segurança: processa no máximo 200 eventos por chamada e mostra "Clique novamente para continuar" se houver mais.

### 2. Adicionar mensagem informativa no card
Um aviso curto explicando:
- "Membros recebem um convite por email do Google. Após aceitar, no celular: abra Google Agenda → menu → ative a agenda **Agenda HR Imóveis**."
- "Em iPhone com Apple Calendar (sem app Google), o membro precisa entrar em https://calendar.google.com/calendar/syncselect pelo navegador e marcar a agenda."
- "Eventos antigos não vão automaticamente — use o botão **Sincronizar eventos existentes**."

### 3. (Opcional, incluído) Confirmar que o push novo funciona
Adicionar um log curto em `gcal-push` quando o destino "shared" for ignorado/erro, pra facilitar debug futuro via Edge Logs.

## Fora do escopo

- Não vamos sincronizar eventos passados (já aconteceram, não fazem sentido na agenda).
- Não vamos forçar reenvio de eventos que já estejam na agenda compartilhada — o backfill pula os que já têm registro em `google_calendar_sync` com aquele `calendar_id`.

## Detalhes técnicos

- **Arquivos**: `supabase/functions/gcal-shared-calendar/index.ts` (nova ação `backfill`), `src/components/configuracoes/SharedCalendarCard.tsx` (botão + instruções).
- Nenhuma migração de banco. Nenhum schema novo.
- O backfill reusa exatamente a mesma lógica de `gcal-push` (importa `buildEventPayload` ou faz chamadas internas via `supabase.functions.invoke('gcal-push', ...)`), garantindo consistência.

Após implementar, o fluxo do usuário é:
1. Membro aceita o convite no email e ativa a agenda no celular (ver instruções no card).
2. Você clica em **"Sincronizar eventos existentes"** uma vez para popular a agenda com os compromissos atuais.
3. A partir daí, todo evento novo do CRM aparece automaticamente nas duas agendas (pessoal do responsável + compartilhada).
