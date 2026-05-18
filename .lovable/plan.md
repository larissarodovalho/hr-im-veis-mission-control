## Objetivo

Aplicar o papel timbrado do Grupo Rodovalho no PDF gerado dos contratos (atualmente "Autorização de Venda com Exclusividade"), em **todas as páginas**, mantendo o conteúdo legível dentro de novas margens.

## Abordagem técnica

O PDF é gerado em `src/lib/contratos.ts` via `jsPDF` (função `generatePdfBlob`). O papel timbrado tem 2 regiões fixas:

- **Cabeçalho** — logo "Grupo Rodovalho" à esquerda + site `hansrodovalho.com.br` à direita
- **Rodapé** — logos HR Imóveis / Brazil Lands / hrX Produções + linha de contatos (WhatsApp / e-mail / Instagram) + endereço

Como não dá pra embutir um DOCX direto no jsPDF, o caminho mais limpo e fiel é:

1. Recortar do .docx duas imagens PNG (com transparência):
   - `letterhead-header.png` (faixa superior, ~largura A4 × altura do cabeçalho)
   - `letterhead-footer.png` (faixa inferior com logos + contatos + endereço)
2. Salvar em `src/assets/contratos/` e importá-las como módulos.
3. Em `generatePdfBlob`:
   - Pré-carregar as duas imagens (cache em módulo).
   - Aumentar a margem superior e inferior para caber o timbrado.
   - Em toda quebra de página (e na primeira), desenhar `header` no topo e `footer` na base com `doc.addImage(..., 'PNG', x, y, w, h)`.
   - Ajustar o `y` inicial do texto (abaixo do header) e o limite `pageH - footerH - margem` para o corpo.

Como `generatePdfBlob` é chamada de forma síncrona em vários pontos (`ContratosTab.handleDownload`, `NovoContratoDialog`), as imagens serão pré-carregadas no boot do app (módulo de assets resolve a URL no build) e convertidas para DataURL via `<img>` + canvas em um `prewarm()` chamado uma vez; se o cache ainda não estiver pronto no momento da geração, fazemos fallback assíncrono retornando `Promise<Blob>` — para evitar mudar a assinatura, vou converter `generatePdfBlob` para **async** e atualizar os 2 callers (`ContratosTab.tsx` e `NovoContratoDialog.tsx`) para usar `await`.

## Mudanças

### 1. Assets

- Adicionar `src/assets/contratos/letterhead-header.png` e `src/assets/contratos/letterhead-footer.png` (recortados do .docx enviado, com fundo transparente, na largura do A4 / 72dpi → 595pt).

### 2. `src/lib/contratos.ts`

- Importar os PNGs.
- Criar helper `loadImageDataUrl(src)` que cacheia as DataURLs.
- Tornar `generatePdfBlob` **async** (`Promise<Blob>`).
- Antes de renderizar, carregar header/footer.
- Função interna `drawLetterhead(doc)`: desenha cabeçalho (topo) e rodapé (base) na largura total da página, mantendo proporção.
- Novas constantes:
  - `headerH ≈ 90pt`, `footerH ≈ 110pt`
  - `margin = 56pt`, `topY = headerH + 24`, `bottomLimit = pageH - footerH - 16`
- No loop de parágrafos: ao chegar em `bottomLimit`, `doc.addPage()` e chamar `drawLetterhead` antes de continuar.
- Chamar `drawLetterhead` também antes de desenhar o título.
- Centralizar o título considerando a nova `topY`.

### 3. Callers

- `src/components/contratos/ContratosTab.tsx` → `handleDownload`: `const blob = await generatePdfBlob(...)`.
- `src/components/contratos/NovoContratoDialog.tsx` → todas as chamadas a `generatePdfBlob` precisam de `await` (a função já está dentro de handlers async).

## Sem alterações

- Template do contrato (`contrato_templates.conteudo`) — o timbrado é puramente visual no PDF, não muda o texto.
- Banco de dados / Edge Functions.
- Fluxo de envio para assinatura (Clicksign já usa o mesmo PDF gerado).

## Validação

- Baixar um contrato curto (1 página): header e footer aparecem, conteúdo não invade nenhum dos dois.
- Baixar um contrato longo (3+ páginas): timbrado aparece em **todas** as páginas, sem sobreposição com o texto.
- Texto não fica colado ao header/footer (espaçamento mínimo de 16pt).
- Logos e contatos legíveis (alta resolução nas PNGs).

## Pontos a confirmar

1. **Logos no rodapé**: o .docx mostra **HR Imóveis + Brazil Lands + hrX Produções**. Manter os 3, ou só HR Imóveis (já que o contrato é da HR)?
2. **Aplicar em quais contratos**: só no template ativo de **Autorização de Venda com Exclusividade**, ou em **qualquer** contrato gerado pelo sistema (incluindo futuros templates)?
3. Você quer que o timbrado também apareça no **preview** dentro do dialog, ou só no PDF final?
