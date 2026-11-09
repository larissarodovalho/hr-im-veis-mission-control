# Agenda do CRM: mostrar só tarefas lançadas a partir de hoje

## Situação verificada
- A tarefa "Ligar Larissa Adriano Miotti" foi excluída do CRM e também saiu do Google Agenda. Não há nenhuma cópia dela no sistema, então a exclusão funcionou como esperado.
- Na Agenda do CRM, a tela ainda mostra todas as tarefas com data, inclusive as antigas. A regra "só a partir de hoje" foi aplicada apenas ao Google Agenda.

## O que vou fazer
1. Na Agenda do CRM, mostrar apenas tarefas criadas a partir de 09/11/2026, a mesma data de corte usada no Google Agenda.
2. As tarefas antigas continuam existindo dentro das contas e leads, como antes. Elas só deixam de aparecer na Agenda.
3. Conferir na tela que a Agenda mostra só as tarefas novas.

## Detalhes técnicos
- `src/pages/Schedule.tsx`: na consulta de `tarefas`, adicionar `.gte("created_at", "2026-11-09T04:00:00Z")` (meia-noite em Cuiabá), em uma constante compartilhada com o corte do gcal-push.
