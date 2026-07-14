# Relatório de Negócios Fechados (com exportação)

Adicionar uma nova seção na aba **Relatórios** dedicada aos registros de `conta_fechamentos`, com visão mensal e anual e exportação em CSV/Excel.

## O que aparece na tela

- Filtros no topo:
  - Período (intervalo de datas, padrão: ano corrente)
  - Agrupamento: **Mensal** ou **Anual**
  - Responsável (opcional)
- KPIs:
  - Total de negócios fechados
  - Valor total (R$)
  - Ticket médio
- Gráfico de barras: valor + quantidade por mês (ou por ano)
- Tabela detalhada por fechamento com:
  - Data do fechamento
  - Cliente (nome da conta) — clicável abrindo a conta
  - Imóvel vinculado (se houver)
  - Valor
  - Responsável
  - Observações
- Botões **Exportar CSV** e **Exportar Excel (.xlsx)**:
  - Resumo agrupado (mês/ano com totais)
  - Detalhado (uma linha por fechamento com todos os campos acima)

## Arquivos

- Novo: `src/components/reports/FechamentosReport.tsx` — busca `conta_fechamentos` com join em `contas` (cliente) e `imoveis` (opcional), calcula agregados, renderiza KPIs/gráfico/tabela e faz o export.
- Editar: `src/pages/Reports.tsx` — adicionar nova aba/seção "Negócios Fechados" apontando para o componente.
- Dependência: usar `xlsx` (já comum em exports) para gerar `.xlsx`; caso não esteja instalado, adicionar.

## Acesso

Restrito a admin/gestor/marketing (mesmo padrão dos demais relatórios). RLS já existente em `conta_fechamentos` cobre a leitura.

Nenhuma mudança de schema é necessária.
