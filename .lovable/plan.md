# Remover o KPI "Taxa conversão" do Funil de Contas (aba Performance)

## Contexto
O KPI "Taxa conversão" no topo da aba Performance (card Funil de Contas, em `src/components/reports/FunilContasReport.tsx`) calcula Contato estabelecido ÷ (Estabelecidos + Cancelados). Como não há contas em "Contato cancelado", ele fica travado em 100% e não agrega informação. O usuário pediu para removê-lo.

## O que será feito
1. **Remover o KPI "Taxa conversão"** da linha de indicadores do `FunilContasReport.tsx` (hoje são 5 KPIs: Total, Em andamento, Sem retorno, Contato estabelecido, Taxa conversão — ficam 4).
2. **Ajustar o grid** de `md:grid-cols-5` para `md:grid-cols-4` para os 4 KPIs restantes ocuparem a largura corretamente.
3. **Remover o cálculo `taxaGeral`** que só alimentava esse KPI.
4. **Ajustar o tooltip do KPI "Contato estabelecido"** removendo a frase que explica a taxa de conversão (ela deixa de existir), mantendo a explicação do que é contato estabelecido.

## Detalhes técnicos
- Único arquivo alterado: `src/components/reports/FunilContasReport.tsx`.
- Nenhuma mudança em banco de dados, em outras abas de Relatórios ou nos demais relatórios (Leads, Oportunidades, Fechamentos etc.).
- O gráfico de funil, a tabela de detalhamento e a seção Qualificação → Oportunidades permanecem intactos.