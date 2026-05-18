# Centralizar corpo do contrato verticalmente

## Problema
Hoje o conteúdo do PDF começa logo abaixo do cabeçalho (`y = contentTop + ...`) e termina onde acabar — na última página fica um espaço grande em branco antes do rodapé, e nas demais o conteúdo aparece levemente acima do centro visual.

## Solução
Em `src/lib/contratos.ts`, dentro de `generatePdfBlob`:

1. **Pré-paginar** o conteúdo antes de desenhar:
   - Quebrar `content` em parágrafos → linhas via `doc.splitTextToSize`.
   - Simular o fluxo atual (linha = 16pt, parágrafo = +4pt, título só na 1ª página) para montar um array `pages: Line[][]`, onde cada página guarda as linhas que cabem entre `contentTop` e `contentBottom`.

2. **Renderizar centralizado**:
   - Para cada página, calcular `usedH` (soma das alturas das linhas + título na pág. 1).
   - `startY = contentTop + (availableH - usedH) / 2`, onde `availableH = contentBottom - contentTop`.
   - Desenhar título (apenas pág. 1) a partir desse `startY`, depois as linhas.
   - Manter `drawLetterhead()` em cada página.

3. **Sem mudanças** em: margens, fonte Montserrat, papel timbrado, tamanhos, espaçamentos entre linhas/parágrafos, schema, formulário ou template.

## Resultado
Cada página do PDF terá o bloco de texto centralizado verticalmente entre o cabeçalho e o rodapé do papel timbrado, inclusive a última (que hoje fica "alta").
