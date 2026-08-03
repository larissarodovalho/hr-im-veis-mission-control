# Leads: tarefas com tag de countdown no funil

## Objetivo
Espelhar no funil de Leads o que já existe em Contas: criar tarefas dentro do lead e mostrar uma tag de countdown ("contatar em X dias") no card. Lead com tarefa futura agendada deixa de aparecer como "sem atendimento" (filtro "Precisam nutrição").

## Estado atual (confirmado)
- A tabela `tarefas` já tem coluna `lead_id` e o `LeadDetail` já cria uma tarefa automaticamente no fluxo "sem contato". Políticas de acesso permitem criar/ler tarefas — **nenhuma migração necessária**.
- Contas já tem: seção `ContaTarefas.tsx` (CRUD de tarefas), mapa `nextTaskMap` em `Accounts.tsx` e badge de countdown (`nextTaskCountdown`) no `ContasKanban.tsx`.
- Em Leads, o filtro "Precisam nutrição" usa apenas o tempo sem interação (`idleDays >= 4`), sem considerar tarefas.

## Mudanças

### 1. `src/lib/tarefas.ts` (novo)
- Extrair o tipo `NextTaskResumo` e a função `nextTaskCountdown(prazo)` (hoje locais em `ContasKanban.tsx`) para reutilização: retorna "em X dias" (futuro), "contatar hoje/amanhã" ou "atrasada há X dias".

### 2. `src/components/contas/ContaTarefas.tsx`
- Generalizar props: aceitar `contaId` **ou** `leadId` (opcionais). A consulta, o insert e o filtro realtime usam a coluna correspondente. Uso atual em Contas permanece idêntico.

### 3. `src/pages/LeadDetail.tsx`
- Nova seção/card **"Tarefas"** no detalhe do lead (na grade ao lado de "Agendar reunião / ligação"), usando o componente generalizado com `leadId={id}` e `responsavelId={lead.corretor_id}`.
- Permite criar/editar/concluir/excluir tarefas com título, prazo, prioridade e responsável — igual à aba Contas.

### 4. `src/pages/Leads.tsx`
- Buscar a próxima tarefa pendente por lead (`lead_id` não nulo, prazo não nulo, status ≠ Concluída, mais próxima primeiro) → `nextTaskMap`; recarregar via realtime na tabela `tarefas`.
- **Badge no card do Kanban e na linha da Lista**: mesma tag das Contas — azul "em X dias", âmbar "contatar hoje/amanhã", vermelho "atrasada há X dias", com tooltip (título, prazo, prioridade).
- **Filtro "Precisam nutrição"** (e o contador no cabeçalho): excluir leads cuja próxima tarefa tem prazo futuro — esses já têm atendimento programado, como nas Contas.

### 5. `src/components/contas/ContasKanban.tsx`
- Passar a importar `nextTaskCountdown`/`NextTaskResumo` de `src/lib/tarefas.ts` (sem mudança visual).

## Observações
- Corretores só enxergam tarefas onde são responsáveis ou criadores (regra já existente); admin/gestor veem todas — a tag segue essa visibilidade.
- Tarefas de lead já aparecem na página Tarefas com link para o lead (já implementado).

## Validação
- Criar uma tarefa com prazo futuro no detalhe de um lead "sem contato" → tag aparece no card e o lead sai do filtro "Precisam nutrição".
- Tarefa vencida → tag vermelha "atrasada há X dias" e lead volta a contar como sem atendimento.
- Typecheck sem erros.
