# Cronômetro de prazos nas tentativas de contato (aba Leads)

## Objetivo
Exibir prazos exatos (data/hora) e contagem regressiva para a sequência de tentativas da etapa **Em Contato**, ancorados na **entrada do lead no sistema** (`data_entrada`):

1. **1ª tentativa · Mensagem** — vence imediatamente na entrada do lead
2. **2ª tentativa · Áudio** — vence 24h após a entrada
3. **3ª tentativa · Ligação** — vence 48h após a entrada

Tentativa que passar do prazo sem registro recebe **apenas destaque visual** (vermelho, "atrasada há Xh"). Sem tarefas automáticas, sem e-mails.

## Estado atual (verificado)
- `TENTATIVA_SEQ` em `src/lib/leads.ts` define a sequência mensagem → áudio → ligação, **sem prazos**.
- Card "Tentativas de contato" em `src/pages/LeadDetail.tsx` (linhas 751-784) mostra só chips de feita/não feita e contador "X de 3".
- Card do Kanban em `src/pages/Leads.tsx` (linhas 317-321) mostra só o badge "📞 Tentativas: X de 3".
- O funil já carrega a contagem de tentativas por lead (`tentativasCount`) — dado suficiente para saber qual é a próxima tentativa sem novas queries.

## Mudanças

### 1. `src/lib/leads.ts` — lógica central de prazos
- Adicionar `prazoHoras` a cada item de `TENTATIVA_SEQ`: mensagem = 0, áudio = 24, ligação = 48.
- Novas funções:
  - `tentativaPrazo(lead, ordem)`: calcula a data/hora de vencimento = `data_entrada` (fallback `created_at`) + prazoHoras.
  - `tentativaStatus(lead, tentativasFeitas, idx)`: retorna `feita` | `vencida` (passou do prazo, não registrada) | `disponivel` (dentro do prazo) | `futura` (ainda não chegou a hora).
  - Formatadores: `prazoLabel` ("vence em 5h", "atrasada há 3h", "disponível a partir de 31/07 19:00") e `prazoColor` (verde/âmbar/vermelho/cinza, usando tokens semânticos existentes: success/warning/danger/muted).

### 2. `src/pages/LeadDetail.tsx` — card "Tentativas de contato"
- Cada chip da sequência passa a exibir: status (feita ✓), **data/hora exata do vencimento** (ex.: "31/07 às 19:00") e contagem regressiva contextual.
- A próxima tentativa pendente fica destacada (âmbar "vence em Xh" / vermelho pulsante "atrasada há Xh").
- Tentativas futuras mostram "disponível a partir de …" em cinza.
- O botão "Registrar tentativa" continua abrindo o modal já existente; nenhuma mudança no fluxo de registro.

### 3. `src/pages/Leads.tsx` — cards do Kanban (coluna Em Contato)
- Substituir o badge "📞 Tentativas: X de 3" por um badge dinâmico da **próxima tentativa**:
  - "💬 Mensagem: vence em 2h" (âmbar)
  - "🎧 Áudio: atrasada há 6h" (vermelho)
  - Quando as 3 estiverem feitas, manter o contador neutro atual.
- Sem novas queries: usa `tentativasCount` já carregado + `data_entrada` do card.

## Regras definidas
- Marco inicial: **entrada do lead no sistema** (`data_entrada`, fallback `created_at`).
- Horas corridas (24h/48h exatas), sem lógica de horário comercial.
- Atraso = somente destaque visual. Nenhuma notificação, tarefa ou automação.

## Detalhes técnicos
- **100% frontend**: nenhuma migração de banco, nenhuma mudança em RLS, edge functions ou tabelas.
- Arquivos tocados: `src/lib/leads.ts`, `src/pages/LeadDetail.tsx`, `src/pages/Leads.tsx`.
- Cálculo com `date-fns` (já usado no projeto) e re-render natural dos badges (sem timers de segundo a segundo; precisão de horas é suficiente para a operação).
- Cores via tokens semânticos (`bg-success/15`, `bg-warning/15`, `bg-danger/15`, `bg-muted`) mantendo o padrão visual dos badges existentes.

## Verificação
- Checar um lead real em "Em Contato" no preview: confirmar datas/hora de vencimento corretas a partir de `data_entrada`, destaque vermelho em tentativa vencida e badge correto no Kanban.