# Agenda do CRM x Google Calendar — corrigir duplicação em massa e voltar a exibir os compromissos

## O que está acontecendo (verificado no banco)

- A tabela de reuniões tem **19.473 eventos vindos do Google** — mas só **313 vínculos reais** com o Google Calendar.
- Dois eventos do Hans se multiplicaram sozinhos: "Batizado Frederico" com **9.830 cópias** e "Ir na Bete Monteiro" com **9.374 cópias**. Uma nova cópia é criada a cada rodada da sincronização (a cada ~2 minutos, até agora mesmo: 16:02).
- Resultado prático: a agenda do CRM fica inutilizável (as listas trazem no máximo mil registros, e eles são quase todos cópias do mesmo evento), então os compromissos da Larissa, do Gabriel, da Gabi e da Maria simplesmente não aparecem.
- A conexão Google das 6 pessoas está saudável (token válido, sem erro de sincronização), e os eventos criados no CRM continuam sendo publicados no Google normalmente. O problema é só a importação Google → CRM.

### Causa raiz

Na importação, o CRM procura o vínculo do evento **filtrando pelo calendário** (pessoal x compartilhado). Quando o mesmo evento aparece nos dois calendários da mesma pessoa, a busca não encontra o vínculo do outro calendário, o CRM cria uma reunião nova e, ao gravar o vínculo, o banco recusa (já existe um vínculo daquele evento para aquele usuário). Esse erro nunca é verificado no código, então a reunião duplicada fica órfã e tudo se repete na rodada seguinte, para sempre.

Segundo fator: a janela de leitura usa ordenação por data de início, o que impede o Google de devolver o "token de sincronização". Por isso toda rodada é uma varredura completa dos próximos 90 dias, o que multiplica o efeito acima.

## O que será feito

1. **Limpeza dos duplicados** (migração no banco)
   - Manter, para cada evento do Google, apenas a reunião que está de fato vinculada (ou a mais antiga, quando não houver vínculo) e apagar as ~19,2 mil cópias.
   - Limpar também registros dependentes das reuniões removidas, se houver.

2. **Corrigir a importação (`gcal-pull`)**
   - Procurar o vínculo por **usuário + ID do evento do Google** (sem depender do calendário), e também por ID do evento no calendário compartilhado.
   - Gravar o vínculo com `upsert` e **verificar o erro**: se a gravação falhar, apagar a reunião recém-criada e registrar no log, em vez de deixar lixo no banco.
   - Antes de criar, checar se já existe reunião equivalente para aquele usuário (mesmo evento do Google), evitando qualquer nova duplicação.
   - Remover a ordenação por data de início para o Google voltar a devolver o token de sincronização — assim as rodadas passam a ser incrementais, mais rápidas e mais baratas.

3. **Trava definitiva no banco**
   - Índice único garantindo uma única reunião por (usuário dono, ID do evento Google), impedindo que o problema volte mesmo se algo falhar no código.

4. **Verificação**
   - Rodar a sincronização manualmente para os 6 usuários conectados e conferir no banco que o total de reuniões volta a algumas centenas, com contagem estável entre duas rodadas seguidas.
   - Conferir na agenda do CRM que os compromissos de cada pessoa voltam a aparecer.

## Detalhes técnicos

- Migração SQL: `DELETE` em `public.reunioes` mantendo o `entity_id` presente em `google_calendar_sync` (ou o `min(created_at)` por `google_owner_user_id` + título + `agendada_para` quando não houver vínculo); depois `CREATE UNIQUE INDEX` sobre `reunioes(google_owner_user_id, <evento google>)` — como `reunioes` não guarda o ID do evento, o índice será criado em `google_calendar_sync(user_id, google_event_id)` (já existe) e complementado por um índice único parcial em `reunioes(google_owner_user_id, titulo, agendada_para) WHERE origem = 'google_calendar'`.
- `supabase/functions/gcal-pull/index.ts`: ajustar `mapQuery` (busca por `user_id` + `google_event_id`, e fallback por `calendar_id` + `google_event_id` no compartilhado), trocar o `insert` do vínculo por `upsert` com `onConflict: "user_id,google_event_id"` e tratamento de erro com rollback da reunião, e remover `orderBy=startTime` da janela de 90 dias.
- Nenhuma alteração no `gcal-push` (o caminho CRM → Google está funcionando).
