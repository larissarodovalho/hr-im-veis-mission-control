# Corrigir a logomarca no PDF de apresentação

## Problema

O PDF desenha a logo com proporção fixa de 0,28 (largura x altura = 34 x 9,5 mm), como se fosse uma logo horizontal comprida. O arquivo usado (`hr-imoveis-logo.png`) é 657x800 px — quase quadrado/vertical. Resultado: a marca aparece achatada/esticada nas três páginas.

## Ajuste

1. Ler as dimensões reais da imagem ao carregá-la e calcular a altura a partir da largura desejada, mantendo a proporção original (sem valor fixo 0,28).
2. Aplicar isso nos três pontos onde a logo é inserida (capa, galeria, detalhes), definindo uma altura-alvo confortável (aprox. 12 mm) e derivando a largura, para não crescer demais no cabeçalho.
3. Reposicionar os cabeçalhos para respeitar a nova caixa da logo, evitando sobreposição com o título/valor da capa.
4. Avaliar o uso da versão branca (`hr-imoveis-logo-white.png`) sobre a foto full-bleed da capa, se a marca escura ficar pouco legível.

## QA

Gerar o PDF, converter as páginas em imagem e inspecionar visualmente as três páginas para confirmar proporção correta, nitidez e ausência de sobreposição.

## Técnico

- Arquivo: `src/lib/imovelPdf.ts` (função `dataUrlSimples` e as três chamadas `doc.addImage`).
- Retornar `{ dataUrl, w, h }` da imagem carregada e usar `altura = largura * h / w`.
