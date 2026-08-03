# Relatórios: KPIs do fluxo de atendimento, tarefas programadas e funis atualizados

## Objetivo
Atualizar os relatórios existentes para refletir as mudanças recentes do CRM: fluxo de atendimento (mensagem imediata, áudio +24h, ligação +48h — agora acompanhado desde a chegada do lead), tags de tarefa com countdown em Contas e Leads, e os funis reestruturados (Leads com 5 etapas incluindo Perdido; Contas com 5 etapas; módulo Oportunidades).

## Diagnóstico (confirmado no código)
- **FunilLeadsReport.tsx**: o KPI "Em atendimento" e o gráfico/tabela do funil usam `STAGES`, que hoje inclui "Perdido" — o KPI soma perdidos indevidamente (o texto ainda diz "4 etapas ativas") e o cálculo de "avanço p/ próxima" é distorcido por incluir Perdido na progressão. Não existem KPIs da situação atual do fluxo de atendimento (os 4 grupos do novo painel: sem nenhuma tentativa, atrasados, no prazo, concluído 3/3).
- **FunilContasReport.tsx**: o subtítulo ainda menciona "taxas de conversão" (removida a pedido) e não há KPIs de atendimento programado (tarefa futura/atrasada — a tag de countdown criada no kanban).
- **OportunidadesReport.tsx** e **LeadsParaContasReport.tsx**: verificados e já alinhados com o funil e as regras atuais — sem mudanças necessárias.

## Mudanças

### 1. `src/lib/leads.ts` — lógica compartilhada
- Exportar `classificaFluxoAtendimento(lead, tentativasFeitas)`: mesma regra do painel "Atendimento" da aba Leads (concluído ≥3 tentativas; atrasado se a próxima está vencida há mais de 1h; sem tentativa; no prazo).
- Exportar `ETAPAS_ATIVAS_FUNIL` (Novo Lead, Pré-atendimento, Em Contato, Conversa Ativa — sem Perdido).
- `Leads.tsx` passa a usar o helper compartilhado (sem mudança visual).

### 2. `FunilLeadsReport.tsx` (aba Relatórios → Leads)
- KPI "Em atendimento": contar apenas as 4 etapas ativas (sem Perdido) e corrigir o texto explicativo.
- Funil por etapa: "Perdido" sai da progressão (gráfico e cálculo de avanço) e passa a aparecer como linha informativa separada na tabela de detalhamento, com cor própria.
- Novo bloco **"Fluxo de atendimento · situação atual"** com 4 KPIs: **Sem nenhuma tentativa**, **Atrasados**, **No prazo**, **Fluxo concluído (3/3)** — espelhando o painel "Atendimento" da aba Leads. Respeita o filtro de corretor do relatório; é um retrato do momento (independe do período selecionado — explicado no hint do card).

### 3. `FunilContasReport.tsx` (aba Relatórios → Performance)
- Subtítulo corrigido (sem menção a taxas de conversão).
- Novos KPIs na linha de cards: **Com atendimento programado** (contas ativas com tarefa futura — a tag azul/amarela do kanban) e **Tarefa de contato atrasada** (tag vermelha), respeitando os filtros Carteira/Marketing/Todas e corretor, com link para `/crm/contas`.

## Fora de escopo
- Nenhuma mudança em Oportunidades, Leads→Contas, Fechamentos, Propostas, Imóveis e Faturamento (já refletem as regras atuais).
- Nenhuma migração de banco; apenas consultas e apresentação.

## Validação
- Typecheck sem erros.
- No preview: KPIs do fluxo de atendimento no relatório batem com o painel "Atendimento" da aba Leads; funil de Leads sem Perdido na progressão; novos KPIs de Contas coerentes com as tags do kanban.
