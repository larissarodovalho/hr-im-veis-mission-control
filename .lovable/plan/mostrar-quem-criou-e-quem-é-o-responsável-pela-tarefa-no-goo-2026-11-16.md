# Mostrar quem criou e quem é o responsável pela tarefa no Google Agenda

## Problema
No Google Agenda, todas as tarefas aparecem como criadas pela Larissa. Isso acontece porque a agenda da equipe está conectada à conta dela. Por isso, não dá para saber quem lançou cada tarefa.

## O que muda
Cada tarefa enviada ao Google Agenda vai mostrar os nomes das pessoas:
- **Título:** `📋 Ligar cliente — Jessica Siqueira (Gabriele Nunes)`, com o nome do responsável entre parênteses.
- **Descrição:** linhas "Criada por: Fulano" e "Responsável: Ciclano", além da prioridade e do link para o CRM.
- Tarefas concluídas mantêm o prefixo [Concluída].
- Tarefas lançadas a partir de 09/11 que já estão na agenda são reenviadas com os nomes.

Na Agenda do CRM, o nome de quem criou já aparece. Vou conferir que também aparece o responsável.

## Detalhes técnicos
- `gcal-push` (tarefa): buscar `profiles.nome` de `created_by` e `responsavel_id`, e incluir no summary/description.
- Reenviar com action update as tarefas com `created_at >= cutoff` que já estão em `google_calendar_sync`.
- Implantar `gcal-push`.
