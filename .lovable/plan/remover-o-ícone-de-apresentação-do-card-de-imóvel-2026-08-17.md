# Remover o ícone de Apresentação do card de imóvel

## O que muda
No card de cada imóvel (aba Imóveis), o botão com o ícone de apresentação/slide ("Apresentação para o cliente") deixa de aparecer.

Permanecem: detalhes (i), compartilhar link temporário e gerar PDF.

## Detalhes técnicos
- `src/pages/Imoveis.tsx`: remover o `<Button>` com `<Presentation />`, o estado `apresentando`, a renderização do `ApresentacaoImovelDialog` e os imports agora não usados (`Presentation`, `ApresentacaoImovelDialog`).
- O arquivo `src/components/imoveis/ApresentacaoImovelDialog.tsx` é mantido no projeto (sem uso), caso queira reativar depois.
