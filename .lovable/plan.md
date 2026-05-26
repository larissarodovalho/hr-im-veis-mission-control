A entidade `captacoes_imovel` já existe e o gcal-push já suporta `entity_type: "captacao"`. Faltam dois pontos: o botão de agendar captação nos detalhes da conta e a inclusão das captações na aba Agenda.

## 1. Botão "Captação" em `ContaAgendaQuickAdd.tsx`

Adicionar um quarto botão ao lado de Reunião / Ligação / Visita:

- Novo `Kind` `"captacao"`.
- Diálogo com: data e hora, observações (sem duração/local/link).
- Ao salvar:
  - Procurar captação aberta da conta (`estagio <> 'concluido'`). Se existir, fazer `update` com `data_agendada`, `estagio: 'agendada'`, `observacoes` e `responsavel_id` (se vazio).
  - Se não existir, fazer `insert` em `captacoes_imovel` com `conta_id`, `data_agendada`, `estagio: 'agendada'`, `responsavel_id`, `created_by`, `observacoes`.
  - Também mover a conta para o funil de captação: `update contas set etapa_funil = 'captacao_imovel'` (apenas se ainda não estiver).
- Chamar `supabase.functions.invoke("gcal-push", { body: { entity_type: "captacao", entity_id, action: "create" } })` — já implementado.

Isso atualiza automaticamente o funil de captação (kanban em Imóveis) via realtime e empurra para o Google Calendar de todos os membros conectados.

## 2. Mostrar captações em `src/pages/Schedule.tsx`

No `load()`, adicionar fetch paralelo:

```ts
supabase.from("captacoes_imovel")
  .select("id, data_agendada, observacoes, conta_id, responsavel_id, imovel_id")
  .not("data_agendada", "is", null)
  .order("data_agendada"),
```

- Incluir `conta_id` / `imovel_id` na hidratação de contas e imóveis.
- Mapear para `Compromisso` com `tipo: "presencial"`, título `"Captação: <nome conta>"` (mais nome do imóvel se houver), duração padrão 60min, `status: "Agendada"`.
- Concatenar no `setReunioes([...reus, ...ligsAgendadas, ...visitasAgendadas, ...captacoes])`.
- Adicionar subscription realtime para a tabela `captacoes_imovel` (`.on("postgres_changes", { table: "captacoes_imovel" }, load)`).

## 3. (Opcional) `ContaAgendamentosList.tsx`

Incluir captações agendadas da conta também na timeline de "Próximos compromissos" do detalhe (mesmo padrão de reuniões/ligações/visitas) — buscar de `captacoes_imovel` filtrando por `conta_id` e `data_agendada is not null`, rótulo "Captação".

Sem mudanças de schema: a tabela `captacoes_imovel` já tem `data_agendada`, `estagio`, `responsavel_id`, `observacoes` e `conta_id`. RLS atual já permite ao staff/responsável criar e ler.