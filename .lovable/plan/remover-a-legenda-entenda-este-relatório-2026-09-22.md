# Remover a legenda "Entenda este relatório"

O bloco de legenda que explica termos, grupos de diagnóstico e o significado de cada caixinha sai do Acompanhamento — tanto da tela quanto do PDF.

## Na tela

- Remover o card final "Legenda · Entenda este relatório", com as três listas (Termos e indicadores, Grupos de diagnóstico, O que significa cada caixinha) e a nota final sobre medição diária e reclassificação manual.
- O restante da aba continua igual: seções 01 Entrada, 02 Retrato por corretor, 03 Taxa de incidência e 05 Conta a conta, com filtros, seleção de clientes e exportações.

## No PDF

- Remover a última parte do PDF: a página de Legenda, a página de Grupos, a página de Classificações e a caixinha final com a observação sobre incidência diária.
- O PDF passa a terminar na seção 05 (Conta a conta). Rodapé e numeração de páginas continuam funcionando.

## Detalhes técnicos

- `src/components/reports/AcompanhamentoCorretoresReport.tsx`: apagar o bloco `{/* Legenda */}` (Card com `GlossarioSecao`), e o componente `GlossarioSecao` e os imports de `TERMOS_ACOMPANHAMENTO`/`GRUPOS_ACOMPANHAMENTO` se ficarem sem uso.
- `src/lib/acompanhamentoPdf.ts`: apagar do `novaPagina()` da legenda até a caixinha `roundedRect` final, mantendo o loop de rodapé/paginação intacto.
- Manter `CLASSIFICACOES_ACOMPANHAMENTO` e `classificacaoLabel`, ainda usados pelos quadros e pela tabela.
- Validar com typecheck, testes de `acompanhamentoPdf` e build.
