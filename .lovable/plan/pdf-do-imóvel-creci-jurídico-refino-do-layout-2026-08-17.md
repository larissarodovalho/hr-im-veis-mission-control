# PDF do imóvel: CRECI jurídico + refino do layout

## CRECI
Incluir "CRECI Jurídico 18.050" (mesmo dado exibido no rodapé do site) no PDF:
- No rodapé de todas as páginas: "HR IMÓVEIS · CRECI J 18.050 · hrimoveis.com".
- Na capa, abaixo da logo, uma linha discreta com o CRECI.
- Na faixa de contato da última página, junto ao bloco "HR Imóveis · hrimoveis.com".
- Se o corretor tiver CRECI cadastrado no perfil, exibir também ao lado do nome (quando disponível).

## Ajustes de layout
- Capa: faixa de gradiente/sobreposição suave na borda da foto para separar melhor imagem e painel; hierarquia tipográfica mais forte (título maior, kicker e localização com mais respiro); valor destacado em bloco com fundo areia; chips alinhados e com espaçamento consistente; bloco do corretor em cartão com borda fina.
- Galeria: primeira foto em destaque maior + grade das demais (layout assimétrico) em vez de 6 iguais, com cantos arredondados e espaçamento uniforme; cabeçalho alinhado com a logo.
- Detalhes: alinhar topo das duas colunas, títulos de seção com linha fina, tabela de características com linhas alternadas mais legíveis, e faixa de contato final mais alta com nome, telefone, e-mail e CRECI bem distribuídos.
- Padronizar margens, tamanhos de fonte e espaçamento vertical entre as três páginas.

## Técnico
- Alterações concentradas em `src/lib/imovelPdf.ts` (helpers de rodapé, capa, galeria e detalhes); constante `CRECI_HR = "CRECI J 18.050"`.
- QA visual: gerar o PDF via script headless, converter as páginas em imagens e revisar sobreposições, cortes e espaçamentos antes de concluir.
