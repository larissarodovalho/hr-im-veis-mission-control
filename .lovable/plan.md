## Objetivo
Adicionar uma nova seção "Propostas" na aba Relatórios para acompanhar a performance de propostas registradas nas contas dos clientes.

## O que será criado

**Nova aba "Propostas" em `src/pages/Reports.tsx`**, alimentada pela tabela `conta_propostas` já existente, respeitando o filtro global de período (anual/mensal) que já usamos nos outros relatórios.

### KPIs no topo
- Total de propostas no período
- Propostas aceitas (com % de conversão)
- Propostas recusadas (com %)
- Propostas pendentes
- Valor total proposto (soma) e valor total aceito

### Gráficos
- **Barras**: propostas por mês (empilhado por status: aceita / recusada / pendente)
- **Barras**: propostas por corretor responsável (top performers, com taxa de aceite)
- **Pizza/Donut**: distribuição por status

### Tabela detalhada
Lista das propostas do período com: data, cliente (conta), corretor responsável, valor, status, com link clicável levando à conta.

### Exportação
Botão para exportar CSV/Excel das propostas do período filtrado (mesmo padrão do relatório de Fechamentos).

## Detalhes técnicos
- Novo componente `src/components/reports/PropostasReport.tsx`.
- Consumir `useReportsPeriod()` para filtro por ano/mês.
- Query em `conta_propostas` com join em `contas` (nome do cliente) e `profiles` (nome do responsável).
- Adicionar nova `TabsTrigger` "Propostas" em `src/pages/Reports.tsx`, entre "Negócios fechados" e as demais.

Nenhuma mudança de schema é necessária — a tabela `conta_propostas` já tem tudo (data, valor, status, conta_id, created_by).
