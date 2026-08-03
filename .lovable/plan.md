# Tag de tarefa futura no card da Conta (contagem regressiva)

## Objetivo
Quando uma tarefa pendente com prazo existe dentro de uma conta, o card do cliente no funil de Contas (Carteira e Marketing) passa a exibir uma tag com a contagem regressiva até o contato (ex.: "Retorno em 3 dias", "Contatar hoje", "Atrasada há 2 dias"). Assim o cliente deixa de parecer "sem atendimento" — fica visível que já existe um contato agendado.

## Estado atual (verificado)
- Tarefas da conta ficam na tabela `tarefas` (`titulo`, `prazo`, `prioridade`, `status`, `conta_id`), gerenciadas por `src/components/contas/ContaTarefas.tsx` na página da conta.
- O card do funil (`src/components/contas/ContasKanban.tsx`) mostra "Últ. contato: dd/MM/aaaa" (mapa montado em `src/pages/Accounts.tsx` a partir de `interacoes`) — hoje não há nenhuma indicação de contato futuro agendado.
- O filtro "Contato" da aba Contas (`contactFilter`, em dias) só considera interações passadas; contas sem interação recente somem da visão filtrada, parecendo abandonadas.

## Implementação

### 1. `src/pages/Accounts.tsx`
- Nova busca paginada `tarefas` pendentes (`status != 'Concluída'`, `conta_id` preenchido, `prazo` preenchido), ordenada por prazo, montando `nextTaskMap: conta_id -> { titulo, prazo, prioridade }` com a tarefa mais próxima de cada conta.
- Passar `nextTaskMap` para o `ContasKanban` e recarregar junto com os demais dados.
- Filtro "Contato": contas com tarefa futura pendente continuam aparecendo (tratadas como atendimento programado, não como "sem atendimento").

### 2. `src/components/contas/ContasKanban.tsx`
- Nova prop opcional `nextTask` no card, renderizando um badge com ícone de calendário/relógio e o título da tarefa abreviado:
  - Futuro: "em X dias" (azul), "amanhã" ou "hoje" (âmbar)
  - Vencido: "atrasada há X dias" (vermelho)
- Tooltip no badge com título completo, data/hora do prazo e prioridade.
- Cálculo de dias no fuso America/Cuiaba via helpers de `src/lib/datetime.ts` (`todayCRM`, `dayKeyCRM`), seguindo o padrão do CRM.

### 3. Sem mudanças de banco
- Reaproveita a tabela `tarefas` e as permissões já existentes (qualquer equipe já lê tarefas na página da conta).

## Validação
- Criar uma tarefa com prazo futuro numa conta e conferir a tag no card do funil (Carteira e Marketing).
- Conferir os casos "hoje", "amanhã" e tarefa vencida.
- Verificar que a conta com tarefa futura continua aparecendo ao usar o filtro de contato.
