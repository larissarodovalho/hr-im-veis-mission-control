# Relatório de Imóveis

Adicionar uma nova subaba **"Imóveis"** dentro de Relatórios, com métricas consolidadas de todo o módulo de Imóveis.

## Estrutura

Nova aba ao lado de Performance e Faturamento, renderizando o componente `src/components/reports/ImoveisReport.tsx`.

## Filtros no topo

- Período (data inicial / data final, baseado em `imoveis.created_at` para imóveis e `created_at` para os demais).
- Cidade (select com cidades distintas existentes).
- Finalidade (Venda / Aluguel / Todas).

## Seções do relatório

### 1. Cards-resumo (KPIs)
- Total de imóveis cadastrados
- Disponíveis
- Em Proposta (derivado de propostas em análise)
- Em Fechamento (proposta aceita)
- Vendidos
- VGV disponível (soma de `valor` dos disponíveis)
- VGV vendido (soma do valor das propostas aceitas/vendas)
- Ticket médio dos vendidos

### 2. Distribuição por faixa de valor
Gráfico de barras (Recharts) com contagem de imóveis disponíveis por faixa:
- Até R$ 500 mil
- R$ 500 mil – R$ 1 mi
- R$ 1 mi – R$ 2 mi
- R$ 2 mi – R$ 5 mi
- Acima de R$ 5 mi

### 3. Por tipo e finalidade
Tabela: Tipo (Casa, Apartamento, Terreno, Fazenda…) × Quantidade × Valor médio × VGV.

### 4. Oportunidades de Negócio
- Total ativas
- Distribuição por estágio (Nova, Buscando, Visita, Proposta, Ganha, Perdida)
- Valor-alvo total e ticket médio
- Taxa de conversão (ganhas ÷ total fechadas)

### 5. Captação de Imóveis
- Total de cards no funil
- Distribuição por etapa (Novo, Agendar, Detalhamento, Agendada, Concluído)
- Tempo médio de Novo → Concluído (em dias)
- Taxa de conclusão

### 6. Corretores Parceiros
- Total de parceiros (ativos / inativos)
- Top parceiros por nº de imóveis captados (via `imoveis.corretor_parceiro_id`)
- Distribuição por cidade/estado

### 7. Top corretores captadores (internos)
Tabela com nº de imóveis captados por corretor (via `imoveis.corretor_captador_id`/`corretor_id`).

## Exportação

Botão **"Exportar CSV"** que baixa o snapshot atual do relatório (KPIs + tabelas) em um único arquivo `relatorio-imoveis-YYYY-MM-DD.csv`.

## Permissões

Mesma regra atual de Relatórios: apenas admin/gestor acessam.

## Detalhes técnicos

- Novo componente `src/components/reports/ImoveisReport.tsx`.
- Queries em paralelo a:
  - `imoveis` (todos os campos relevantes)
  - `propostas` (status, valor, imovel_id)
  - `oportunidades` (estagio, valor_alvo)
  - `captacoes_imovel` (estagio, created_at, updated_at)
  - `corretores_parceiros` (ativo, cidade, estado)
  - `profiles` (nome para mapping)
- Cálculos no cliente (filtros, agrupamento, faixas).
- Gráficos com Recharts (já usado em FunilContasReport/FaturamentoReport).
- Registrar a aba em `src/pages/Reports.tsx`.
