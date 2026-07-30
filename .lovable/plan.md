# Atualizar aba Relatórios para os novos funis (Leads, Contas, Oportunidades)

## Diagnóstico (verificado no código)

- **Performance por corretor** (`src/pages/Reports.tsx`): conta "Conversões" por `contas.etapa_funil = 'fechado'` — etapa legada que não existe mais após a migração. O indicador está zerado/permanente quebrado.
- **Funil de Contas** (`FunilContasReport.tsx`): já usa as 5 etapas novas, mas ainda exibe bloco "Etapas legadas" (sempre vazio após a migração das 424 contas) e não mostra a **qualificação** (pendente / oportunidade ativa / oportunidade futura / não qualificado), que é a ponte Contas → Oportunidades.
- **Funil de Leads**: não existe relatório do novo funil de 4 etapas (Novo Lead → Pré-atendimento → Em Contato → Conversa Ativa), nem das **tentativas com SLA** (mensagem imediata, áudio +24h, ligação +48h) e **pontualidade** (`interacoes.pontualidade`: no prazo / adiantada / atrasada), nem dos motivos de desclassificação (`leads.motivo_desclassificacao`).
- **Oportunidades** (`OportunidadesReport.tsx`): já está no funil novo, mas carrega todas as oportunidades sem paginação (mesmo bug de limite de linhas já corrigido no Kanban) e não mostra taxa de avanço entre etapas.
- Leads → Contas, Fechamentos, Propostas, Imóveis e Faturamento continuam válidos (sem mudança de modelo).

## O que será feito

### 1. Nova aba "Leads" nos Relatórios
Nova tab entre "Performance" e "Oportunidades", com:
- **FunilLeadsReport** (componente novo em `src/components/reports/FunilLeadsReport.tsx`):
  - KPIs: leads no período, convertidos em conta, desclassificados, em atendimento.
  - Funil das 4 etapas ativas (gráfico de barras + tabela com quantidade, % do total e avanço p/ próxima etapa).
  - **SLA de tentativas**: para mensagem, áudio e ligação — quantas foram registradas no prazo, adiantadas ou atrasadas (lendo `interacoes.pontualidade` por `tipo`), com taxa de cumprimento do cronograma.
  - **Motivos de desclassificação**: ranking dos motivos (`leads.motivo_desclassificacao`).
  - Filtro por corretor responsável.
- Mover **LeadsParaContasReport** (conversão Leads → Contas) para esta aba, logo abaixo.

### 2. Corrigir "Performance por corretor" (aba Performance)
Substituir a métrica quebrada de conversões por indicadores do fluxo real:
- Colunas: Leads | Contas criadas | Contatos estabelecidos | Oportunidades geradas | Ganhas | Taxa de ganho (Ganhas ÷ Oportunidades encerradas no período).
- Fontes: `leads.corretor_id`, `contas.responsavel_id` + `etapa_funil`, `oportunidades.corretor_id` + `estagio`/`encerrada_em`.
- Atualizar o tooltip explicativo para a nova definição.

### 3. Funil de Contas — limpeza e qualificação
- Remover o bloco "Etapas legadas" (gráfico de pizza, tabela e contadores) — não há mais contas em etapas legadas.
- Adicionar seção **Qualificação → Oportunidades**: distribuição das contas em Contato estabelecido por status de qualificação (pendente, oportunidade ativa, oportunidade futura, não qualificado), mostrando gargalos de qualificação por lista (Carteira/Marketing/Todas).

### 4. Oportunidades — robustez e avanço entre etapas
- Paginação na carga de `oportunidades` (loop de 1000 em 1000, como já feito no Kanban) para não perder registros.
- Adicionar coluna "Avanço p/ próxima etapa" na tabela Resumo por etapa (taxa acumulada entre estágios do funil).

### 5. Sem alteração
Leads → Contas (só muda de aba), Negócios fechados, Propostas, Imóveis, Faturamento e o seletor de período (anual/mensal) permanecem como estão.

## Detalhes técnicos

- Arquivos: `src/pages/Reports.tsx` (tabs + tabela de performance), `src/components/reports/FunilLeadsReport.tsx` (novo), `FunilContasReport.tsx` (limpeza + qualificação), `OportunidadesReport.tsx` (paginação + avanço), `LeadsParaContasReport.tsx` (apenas reposicionado).
- Sem migração de banco: todos os dados já existem (`leads.etapa/motivo_desclassificacao`, `interacoes.pontualidade/tipo`, `contas.qualificacao_status`, `oportunidades.estagio`).
- Período: todos os relatórios novos usam `useReportsPeriod` (anual por padrão, filtro mensal), respeitando o fuso America/Cuiaba via helpers de `src/lib/datetime.ts` onde houver agrupamento por dia/mês.
- Acesso continua restrito a admin/gestor (regra já existente em `Reports.tsx`).