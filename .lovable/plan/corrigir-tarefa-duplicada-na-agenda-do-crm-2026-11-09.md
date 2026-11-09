# Corrigir tarefa duplicada na Agenda do CRM

## O que acontece
Quando alguém (ex.: Gabriele Nunes) cria uma tarefa com data e hora, o CRM envia o evento para o Google Agenda do responsável e também para a agenda da equipe "Agenda HR Imóveis", que está ligada à sua conta. A cada 2 minutos o CRM lê essa agenda da equipe de volta. Ele não reconhece que o evento veio do próprio CRM e o cadastra como uma reunião nova, "Criada por Larissa Rodovalho". Por isso aparece duas vezes.

## O que vou fazer
1. A leitura do Google passa a ignorar eventos que o próprio CRM criou (tarefas, reuniões, visitas, ligações e captações), tanto na agenda da equipe quanto nas agendas pessoais.
2. Apagar só as cópias duplicadas que já foram criadas por esse erro (reuniões que vieram de eventos de tarefa do CRM). A tarefa original de quem criou continua intacta.
3. Conferir na Agenda do CRM que "Marcar reunião — Jessica Siqueira" aparece uma vez só.

## Detalhes técnicos
- gcal-push: marcar eventos com `extendedProperties.private.crm_entity_type/crm_entity_id` (se ainda não marca).
- gcal-pull: pular eventos com essa marca, ou cujo `google_event_id` já está em `google_calendar_sync` para outra entidade, ou com título iniciado por "📋".
- Limpeza: listar antes as `reunioes` importadas cujo evento corresponde a uma tarefa sincronizada e excluir apenas essas (com o registro de sync correspondente).
