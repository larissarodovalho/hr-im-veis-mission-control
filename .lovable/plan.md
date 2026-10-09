# Separar comissão dos corretores x comissão da HR Imóveis (Faturamento)

## O que a análise mostrou
- Cada venda já guarda três percentuais separados, conforme a política de comissionamento (origem + nível): vendedor, captador e HR Imóveis. Ex.: Base do Corretor Sênior = 2% vendedor + 1% captador + 2% HR; Base HRX Sênior = 1,5% + 0,5% + 3% HR.
- A linha "HR Imóveis (casa)" do ranking já usa só o percentual da HR. Porém o quadro do topo "Comissão total" e a coluna "Comissão total" da lista de vendas somam tudo (corretores + HR), o que dá a impressão de que a HR recebe o total.
- Achado extra: quando o mesmo corretor é vendedor e captador na mesma venda (ex.: Hans nas vendas Base HRX), o "VGV total" dele no ranking conta o valor da venda duas vezes.

## O que muda
1. Quadros do topo: trocar "Comissão total" por três números lado a lado:
   - Comissão dos corretores (vendedor + captador)
   - Comissão HR Imóveis (só o % da HR de cada venda)
   - Comissão total (soma das duas, para conferência)
2. Lista "Vendas do período": colunas separadas "Comissão corretores", "Comissão HR (%)" com o percentual aplicado (ex.: "R$ 36.000,00 · 2%") e "Comissão total"; rodapé com os três totais.
3. Ranking por corretor:
   - Coluna "Comissão total" passa a se chamar "Comissão do corretor".
   - Nova linha "Total corretores" somando só as comissões dos corretores.
   - Linha "HR Imóveis (casa)" continua com só a parte da HR e ganha a coluna "% médio HR".
   - Linha final "Total geral" = corretores + HR.
   - VGV do corretor conta a venda uma vez só quando ele é vendedor e captador ao mesmo tempo.
4. Planilha exportada: mesmas separações (comissão corretores, comissão HR, total).
5. Gráfico "Comissão": já separa Vendedor/Captador/HR — sem mudança.

Nada muda no banco nem na forma de lançar a venda; os percentuais continuam vindo da política escolhida em cada venda.

## Detalhes técnicos
- `src/components/reports/FaturamentoReport.tsx`: `kpis` ganha `corretores` (soma de `percent_vendedor` + `percent_captador`); novos cards; colunas na tabela de vendas; linhas extras no ranking; em `ranking`, VGV do captador não soma se `corretor_captador_id === corretor_vendedor_id` (mantém a comissão de captador); `exportRanking` atualizado.
- % médio HR = comissão HR ÷ VGV do período.
