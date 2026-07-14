# Filtro global de período (anual + mensal) na aba Relatórios

Hoje cada relatório tem seu próprio critério de tempo (ou nenhum). Vou centralizar em um **filtro global** no topo da página Relatórios que se aplica a todas as abas e seções.

## Comportamento

- **Padrão**: ano corrente inteiro (1º jan a 31 dez).
- **Seletor de ano**: dropdown com últimos 5 anos + ano corrente + próximo ano.
- **Seletor de mês**: opção "Ano inteiro" (padrão) ou um mês específico (Jan…Dez). Quando um mês é escolhido, o intervalo passa a ser aquele mês naquele ano.
- Filtro fica fixo no cabeçalho de Relatórios, acima das abas — visível em qualquer aba (Performance, Negócios fechados, Imóveis, Faturamento).

## Implementação

- Novo contexto `ReportsPeriodContext` (`src/pages/Reports.tsx`) expondo `{ inicio, fim, ano, mes, setAno, setMes }` como datas ISO (`yyyy-MM-dd`).
- Hook `useReportsPeriod()` para os componentes filhos consumirem.
- Ajustar cada relatório para usar o período do contexto em vez de datas próprias:
  - `FunilContasReport` — filtrar contas por `created_at` no intervalo.
  - `LeadsParaContasReport` — filtrar leads/contas por `created_at`; os gráficos internos por mês continuam, mas restritos ao período.
  - Performance por corretor (dentro de `Reports.tsx`) — filtrar `leads`, `reunioes`, `ligacoes`, `contas` fechadas por `created_at` no intervalo.
  - `FechamentosReport` — remover seus filtros próprios de data; usar o global; manter seletor de agrupamento (mensal/anual) e responsável.
  - `ImoveisReport` — filtrar por `created_at` no intervalo.
  - `FaturamentoReport` — filtrar por `data_fechamento`/data equivalente no intervalo.
- Nomes de arquivos exportados (CSV/XLSX) passam a incluir o período selecionado (ex.: `fechamentos-2026.xlsx` ou `fechamentos-2026-03.xlsx`).

## Fora do escopo

- Não altera regras de RLS nem estruturas de tabela.
- Filtros específicos de cada aba (ex.: responsável em Negócios fechados, agrupamento mensal/anual do gráfico) continuam existindo por cima do filtro global.
