# Ticket médio por corretor nas metas de VGV

## O que muda

Adicionar o **ticket médio** de cada corretor junto das metas de VGV, na subaba **Performance** da aba Relatórios.

Ticket médio = **VGV realizado no ano ÷ número de vendas** do corretor (como vendedor) no mesmo ano. Se o corretor não tiver nenhuma venda no ano, mostra "—".

## Onde aparece

1. **Tabela da Performance (tela)** — nova coluna "Ticket médio" ao lado de Meta 2026 / VGV realizado / % atingido, para cada corretor e para a linha institucional HRX Produções (ticket médio das vendas de marketing).
2. **PDF individual do corretor** — no quadro de metas, junto de meta anual, realizado, % atingido e falta.
3. **PDF de todos** — mesmo campo para cada corretor e para a HRX Produções.

## Detalhes técnicos

- `src/pages/Reports.tsx` — `carregarMetasVgv()` passa a contar também o número de vendas por corretor (e da HRX, origem `base_hrx`) no ano; `MetaVgvCorretor` ganha o campo de quantidade; nova coluna na tabela via `CelulasMeta`.
- `src/lib/performancePdf.ts` — interfaces `MetaVgvCorretor` e `MetaInstitucionalVgv` ganham a quantidade de vendas; quadro de metas do PDF mostra o ticket médio.
- Nenhuma migração de banco: o cálculo usa a tabela `vendas` já carregada hoje.
- Fuso e período seguem o padrão atual (ano selecionado, datas em America/Cuiabá via `dayKeyCRM`).

## Validação

- Typecheck, testes e build.
- Conferir no preview: tabela da Performance mostra o ticket médio (Rafael deve mostrar R$ 1.800.000,00, única venda de 2026) e os PDFs trazem o campo.
