## Problema

A sincronização do Google Calendar importou **547 reuniões** automaticamente (todas com `origem = 'google'`), incluindo eventos recorrentes do "Escritório" às 08:00 que poluíram a tela `/crm/reunioes`. Apenas 2 reuniões foram criadas manualmente no CRM (`origem = 'crm'`).

## Plano

### 1. Excluir as reuniões importadas do Google
Rodar uma migração que apaga todas as linhas de `reunioes` com `origem = 'google'`. Isso remove as 547 reuniões automáticas e preserva as 2 criadas no CRM.

```sql
DELETE FROM public.reunioes WHERE origem = 'google';
```

### 2. Desativar a importação automática (pull) do Google Calendar
Hoje, ao clicar em "Sincronizar agora" (ou no cron), a função `gcal-pull` cria uma reunião no CRM para **cada** evento da agenda pessoal do usuário — inclusive eventos recorrentes pessoais como "Escritório 08:00". Vou ajustar `supabase/functions/gcal-pull/index.ts` para **não** mais inserir reuniões a partir de eventos do Google que não tenham vínculo com um lead/conta/imóvel do CRM. Apenas eventos que já foram criados pelo CRM (push) continuarão sendo atualizados.

Resultado: a agenda do Google continua sendo mostrada (leitura) mas **não** popula mais a tabela `reunioes` automaticamente.

### 3. (Opcional) Botão "Limpar reuniões importadas do Google"
Adicionar um botão em `/crm/minha-conta` (card do Google Calendar) que reexecuta o DELETE acima caso volte a acontecer. Confirmo se você quer este botão antes de implementar.

## Detalhes técnicos

- Migração: `DELETE` simples na tabela `reunioes` filtrando por `origem = 'google'`.
- Edge function `gcal-pull`: trocar o `upsert` em `reunioes` por um caminho que só atualiza linhas existentes (sem `INSERT`), ou pula completamente eventos sem `lead_id`/`conta_id`.
- Nenhuma mudança no schema; coluna `origem` já existe e identifica a fonte.

Confirma que posso (a) apagar as 547 reuniões e (b) parar de criar reuniões automaticamente a partir do Google?