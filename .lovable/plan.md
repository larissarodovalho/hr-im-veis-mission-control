## Problema

O compromisso "Amis" (hoje 03/06, 17h) aparece como criado por **Gabriel Souza**, mas quem criou foi o **Hans Rodovalho**.

Investigando no banco, achei a causa:

- `reunioes.origem = 'google_calendar'`
- O evento foi importado da **agenda do Google** do Gabriel pela edge function `gcal-pull`.
- Hans criou o evento no Google Calendar dele e convidou o Gabriel. Quando o sync rodou pra conta do Gabriel, a função importou e marcou `created_by = Gabriel` (o dono do calendário sincronizado), ignorando o criador real do evento no Google.

Trecho atual (`supabase/functions/gcal-pull/index.ts`, linha ~106):
```ts
.insert({
  ...
  corretor_id: user_id,
  created_by: user_id,   // <- sempre o dono do sync
  google_owner_user_id: user_id,
})
```

O Google retorna `ev.creator.email` e `ev.organizer.email` no evento — basta cruzar com a tabela `profiles.email` pra achar o usuário real.

## Plano

### 1. `supabase/functions/gcal-pull/index.ts`

- Antes do `insert`, resolver o criador real:
  - Pegar `ev.creator?.email` (fallback `ev.organizer?.email`).
  - Se existir, buscar `profiles.user_id` por `email = <esse email>` (case-insensitive).
  - Se achar → `created_by = profile.user_id`.
  - Se não achar → manter `created_by = user_id` (dono do sync) como hoje.
- `corretor_id` e `google_owner_user_id` continuam sendo `user_id` (o dono da agenda sincronizada — isso é correto, pois define de quem é a agenda no CRM).
- Aplicar só na criação (linha 106). O `update` (linha 93) não toca em `created_by`, então ok.

### 2. Correção pontual do evento existente

- Atualizar o registro `f2a59ef5-a4c6-4ebf-bf0a-0a92aaf80aa3` ("Amis") para `created_by = <user_id do Hans>` (`6132fe03-0718-4763-aeed-09e24f3a6364`).
- `corretor_id` fica como está (Gabriel), porque é a agenda dele.

### 3. (Opcional, mas recomendado) Backfill

Rodar um update único nos eventos já importados de `origem = 'google_calendar'` para tentar corrigir o `created_by` retroativamente. Como o `creator.email` original não está armazenado, **não dá pra fazer backfill automático** sem repuxar do Google. Sugestão: deixar só a correção manual do "Amis" agora, e o fix novo passa a valer pros próximos syncs. Se quiser, posso adicionar um endpoint/forçar um resync completo (limpar `sync_token`) para reprocessar — mas isso pode duplicar/mudar eventos já editados manualmente, então prefiro **não** fazer por padrão.

## Resumo

- Fix de raiz: `gcal-pull` passa a mapear `creator.email` → `profiles.user_id` no momento da importação.
- Fix pontual: corrigir o "Amis" para mostrar Hans como criador.
- Nada muda em criação manual pelo CRM (já usa `auth.uid()` corretamente).