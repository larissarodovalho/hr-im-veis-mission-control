## Objetivo

Na aba **Contas → cadastro do cliente**, na seção "Agendar", exibir a movimentação dos agendamentos (reuniões, ligações e visitas) já feitos para aquela conta. Os dados continuam vindo das mesmas tabelas usadas nas abas globais de Reuniões / Ligações / Visitas, então qualquer mudança aparece automaticamente em todos os lugares.

## O que será feito

1. **Novo componente** `src/components/contas/ContaAgendamentosList.tsx`
   - Recebe `contaId`.
   - Faz `select` em paralelo de:
     - `reunioes` (filtrado por `conta_id`) — campos: agendada_para, duracao_min, tipo, local, link, status, notas.
     - `ligacoes` (filtrado por `conta_id`) — campos: data, duracao_seg, resultado, notas.
     - `visitas` (filtrado por `conta_id`) — campos: data_visita, status, observacoes, imovel_id.
   - Une os três num único timeline ordenado por data desc, com badge do tipo (Reunião / Ligação / Visita), data formatada (`dd MMM yyyy 'às' HH:mm`), status, e linha com observações.
   - Cada item tem link "Abrir" para a aba correspondente (`/crm/reunioes`, `/crm/ligacoes`, `/crm/visitas`) — opcional, leva à lista geral.
   - Assina realtime nas três tabelas filtradas por `conta_id=eq.{id}` para atualizar quando criar/editar em qualquer lugar.
   - Estado vazio amigável.

2. **`src/components/contas/ContaAgendaQuickAdd.tsx`**
   - Sem mudanças de lógica. Apenas garantir que `onCreated` continue disparando refresh (já dispara).

3. **`src/pages/AccountDetail.tsx`**
   - Logo abaixo do `<ContaAgendaQuickAdd />`, renderizar o novo `<ContaAgendamentosList contaId={acc.id} />` dentro de um `Card`.
   - Passar a mesma função `load` via `onCreated` continua funcionando; o componente também ouve realtime, então não depende do refresh do pai.

## Não muda

- Schema do banco, RLS, edge functions.
- Páginas globais de Reuniões / Ligações / Visitas.
- Componente `ContaInteracoesTimeline` (histórico de interações livres permanece separado — esse é o log manual; o novo bloco é a agenda real).
