## Objetivo
Permitir editar uma captação já agendada diretamente na lista de agendamentos da conta (aba detalhes da conta).

## Mudanças

**`src/components/contas/ContaAgendamentosList.tsx`**
- Adicionar botão "Editar" (ícone `Pencil`) ao lado do botão "Abrir", visível apenas quando `it.kind === "captacao"`.
- Ao clicar, abrir um `Dialog` com os campos:
  - Data e hora (`datetime-local`, pré-preenchida com `it.when`)
  - Observações (`Textarea`, pré-preenchida com `it.notes`)
  - Estágio (`Select`: novo, agendada, em_andamento, concluido, cancelada) — pré-preenchido com `it.status`
- Botões: Cancelar / Salvar.
- Ao salvar:
  - `UPDATE captacoes_imovel SET data_agendada, observacoes, estagio WHERE id = it.id`
  - Toast de sucesso/erro
  - Chamar `supabase.functions.invoke("gcal-push", { body: { entity_type: "captacao", entity_id: it.id, action: "update" } })` para sincronizar com o Google Calendar / Agenda.
  - Fechar dialog (a lista atualiza sozinha via realtime já existente).

## Escopo
- Apenas frontend; nenhuma mudança de schema ou RLS.
- Reaproveita o mesmo padrão visual usado em `ContaAgendaQuickAdd.tsx`.
- Edição limitada a captações; reunião/ligação/visita continuam com apenas "Abrir".
