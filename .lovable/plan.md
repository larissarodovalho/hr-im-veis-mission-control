# Relatórios: subseção "Atendimento das Contas por corretor"

Nova subseção dentro de Relatórios para acompanhar, corretor a corretor, todo o trabalho feito no funil de atendimento das contas: o que ele registrou, com que velocidade, quantas contas avançaram e quantas estão paradas.

## Onde entra

Nova aba "Atendimento" na barra de abas de Relatórios (entre "Performance" e "Leads"), respeitando o período já selecionado no topo da página e com filtro por lista (Carteira / Marketing / Todas).

## O que mostra

**Indicadores do período**
- Contas sob responsabilidade dos corretores
- Contas trabalhadas (com pelo menos um registro de atendimento no período) e contas sem nenhum registro
- Total de registros de atendimento (ligação, mensagem, visita, reunião, e-mail, nota)
- Contas que chegaram a "Contato estabelecido"
- Contas sem retorno e canceladas
- Tarefas de contato concluídas x atrasadas

**Tabela principal — um corretor por linha**
- Contas sob responsabilidade
- Contas trabalhadas e % trabalhadas
- Contas sem nenhum atendimento
- Registros por tipo: ligações, mensagens, visitas, reuniões
- Tempo médio entre a criação da conta e o primeiro atendimento
- Dias desde o último atendimento (média das contas ativas)
- Contatos estabelecidos, sem retorno, cancelados
- Tarefas atrasadas
- Exportação em CSV

**Detalhe do corretor**
Ao clicar na linha, abre um painel com:
- Distribuição das contas dele por etapa do funil
- Lista das contas mais paradas (maior tempo sem atendimento), com etapa, último atendimento e link para abrir a conta
- Lista das contas sem nenhum atendimento no período
- Gráfico de registros por dia/semana no período

**Gráficos de apoio**
- Barras comparando registros de atendimento por corretor, separados por tipo
- Barras comparando contas trabalhadas x sem atendimento por corretor

## Detalhes técnicos

- Nova função `SECURITY DEFINER` somente-leitura restrita a admin/gestor: `contas_atendimento_corretores(_inicio, _fim)`, agregando `contas` (responsavel_id, etapa_funil, categoria, created_at), `interacoes` (conta_id, tipo, created_by, created_at) e `tarefas` (conta_id, status, prazo), com nome vindo de `profiles`.
- Segunda função `contas_atendimento_detalhe(_corretor_id, _inicio, _fim)` devolvendo as contas do corretor com etapa, data do último atendimento, nº de registros e próxima tarefa — usada no painel de detalhe.
- Novo componente `src/components/reports/AtendimentoContasReport.tsx`, aba registrada em `src/pages/Reports.tsx` usando `useReportsPeriod`.
- Datas exibidas e calculadas via helpers de `src/lib/datetime.ts` (America/Cuiaba); etapas via `src/lib/contasFunil.ts` e countdown de tarefa via `src/lib/tarefas.ts`, para bater com o kanban de Contas.
- CSV com Papa.parse, no mesmo padrão dos demais relatórios.
