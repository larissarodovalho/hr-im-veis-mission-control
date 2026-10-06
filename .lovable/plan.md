# Lista de vendas do período no Faturamento

## O que muda

Na subaba **Faturamento** (Relatórios), surge um novo quadro **"Vendas do período"** entre o gráfico de evolução mensal e o ranking por corretor.

O quadro lista cada venda do período selecionado, uma por linha, com:

- Data da venda (dd/mm/aaaa, fuso de Cuiabá)
- Cliente
- Vendedor e captador (nomes)
- Valor da venda (R$)
- Comissão total (R$)
- Status de pagamento

A lista:

- Respeita todos os filtros já existentes da subaba (período, papel, corretor, origem e nível) — usa o mesmo conjunto de vendas já filtrado que alimenta os KPIs, o gráfico e o ranking.
- Fica ordenada da venda mais recente para a mais antiga.
- Mostra no rodapé o total de vendas listadas e a soma dos valores.
- Quando não houver venda no período, mostra a mensagem "Sem vendas no período."

## Detalhes técnicos

- Arquivo: `src/components/reports/FaturamentoReport.tsx` (somente ele).
- Nenhum dado novo é buscado: o quadro usa o array `filtered` já existente (vendas já filtradas por período/filtros) e o `nameOf` para nomes dos corretores.
- Data exibida com o helper de fuso (`dayKeyCRM` / formatação America/Cuiabá), seguindo o padrão do CRM.
- Comissão total por venda via `getVendaComissaoTotal` (já existente).
- Sem migração de banco, sem mudança em outras subabas.

## Validação

- Typecheck, testes e build.
- Conferir no preview: a lista aparece antes do ranking, respeita os filtros (ex.: filtrar por corretor reduz a lista) e mostra a venda de 30/01/2026 (R$ 1.800.000,00, Rafael/Hans) quando o período é 2026.
