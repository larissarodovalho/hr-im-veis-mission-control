# Agenda: só tarefas lançadas a partir de hoje

## O que muda
- Tarefas criadas **antes de hoje (09/11/2026, 00h de Cuiabá)** deixam de aparecer no Google Agenda — tanto na agenda da equipe "Agenda HR Imóveis" quanto na agenda pessoal do responsável.
- As tarefas antigas **continuam no CRM** normalmente; só somem do Google Agenda.
- Mesmo que uma tarefa antiga seja editada, remarcada ou concluída depois, ela não volta para o Google Agenda.
- Tarefas criadas de hoje em diante seguem indo para o Google Agenda como já está (15 min, prefixo [Concluída]).

## Passos
1. No sincronizador de tarefas, ignorar qualquer tarefa com data de criação anterior a 09/11/2026 00:00 (Cuiabá = 04:00 UTC).
2. Remover do Google Agenda os eventos já enviados de tarefas antigas (incluindo as 73 enviadas no último ajuste) e limpar os vínculos internos desses eventos.
3. Conferir que sobraram apenas eventos de tarefas criadas hoje.

## Detalhes técnicos
- `gcal-push`: para `entity_type === "tarefa"`, se `tarefas.created_at < '2026-11-09T04:00:00Z'` e ação não for delete, retornar `skipped` (constante `TAREFAS_GCAL_CUTOFF`).
- Limpeza: para cada linha em `google_calendar_sync` com `entity_type='tarefa'` ligada a tarefa antiga, chamar DELETE no evento Google (calendário da linha) e apagar a linha — feito invocando `gcal-push` com `action:"delete"` via serviço, ou uma rotina pontual de limpeza.
