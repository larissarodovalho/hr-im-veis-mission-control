# Remover colunas "Manual de acompanhamento" e "Permuta" do funil de Leads

## Objetivo
Mover os 6 leads atualmente nessas etapas (1 em "Manual de acompanhamento", 5 em "Permuta") para **Pré-atendimento** e remover as duas colunas do funil de Leads, voltando a 5 colunas: Novo Lead, Pré-atendimento, Em Contato, Conversa Ativa, Perdido.

## O que será feito

### 1. Banco de dados (migração)
- Mover todos os leads com etapa "Manual de acompanhamento" ou "Permuta" para "Pré-atendimento".
- O lead que estava em "Manual de acompanhamento" recebe o selo de acompanhamento "Manual" (`tipo_acompanhamento = 'manual'`) se ainda não tiver, para não perder essa informação — o selo continua visível no card do lead.

### 2. Código
- **src/lib/leads.ts**: remover "Manual de acompanhamento" e "Permuta" da lista de etapas ativas (`ActiveStage` e `STAGES`). O Kanban passa a renderizar 5 colunas. Relatórios e seletores que usam `STAGES` se atualizam automaticamente.
- **src/pages/Dashboard.tsx**: remover "Manual de acompanhamento" do conjunto de etapas "em atendimento" usado no KPI do Dashboard (limpeza, já que nenhum lead ficará nessa etapa).

### 3. Validação
- Confirmar no banco que não resta nenhum lead nas duas etapas.
- Verificar no preview que o Kanban mostra 5 colunas e que o Pré-atendimento passa de 31 para 37 leads.

## Fora de escopo
- A coluna **Perdido** permanece no funil (você pediu para remover apenas as duas).
- Referências a "Permuta" em Contas (destino comercial) e Oportunidades (badge `possui_permuta`) não são afetadas.
- As etapas históricas sem uso (IA de acompanhamento, Reunião Agendada, Visita, Proposta, Fechado) continuam apenas como histórico na visão Lista.
