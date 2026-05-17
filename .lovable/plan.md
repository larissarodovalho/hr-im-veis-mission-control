## Objetivo

Aplicar marca d'água da logo da HR Imóveis em todas as fotos enviadas pelo formulário de cadastro/edição de imóveis, antes do upload para o storage.

## Como vai funcionar

A marca d'água é gerada **no navegador**, antes do upload: a imagem é desenhada em um `<canvas>`, a logo é sobreposta no canto inferior direito com transparência, e o resultado vira um JPEG novo que substitui o arquivo original. O arquivo armazenado já vem com a marca — não dá pra ver a foto sem marca pelo storage.

## Mudanças

### 1. Novo utilitário `src/lib/watermark.ts`
- Export `applyWatermark(file: File, opts?): Promise<File>`.
- Padrões: logo = `/logo-hr-branco.png` (já existe em `public/`), posição = bottom-right, largura ≈ 22% da menor dimensão da foto, margem 3%, opacidade 0.55, saída JPEG qualidade 0.9.
- Mantém a orientação EXIF carregando via `createImageBitmap(file, { imageOrientation: "from-image" })`.
- Cache do `HTMLImageElement` da logo entre chamadas (carrega uma vez).
- Se a foto for muito pequena (<400px) ou der erro, retorna o arquivo original (fail-safe pra não bloquear o cadastro).
- Renomeia mantendo extensão pra `.jpg`.

### 2. `src/components/imoveis/NovoImovelDialog.tsx`
- Importar `applyWatermark`.
- No loop de upload (linha ~146): trocar `for (const file of fotos)` por marcar primeiro com `const marked = await applyWatermark(file)` e fazer upload de `marked` (com `marked.type = "image/jpeg"` e nome `.jpg`).
- Mensagem de loading do botão já existe; só ajustar texto pra "Processando fotos..." enquanto aplica.

### 3. Sem mudanças no banco
- Bucket `imoveis` continua igual (já é público).
- Fotos antigas no banco não são reprocessadas — só vale pra novos uploads.

## Detalhes de UX

- A marca fica discreta (branca, 55% de opacidade) pra não atrapalhar a visualização do imóvel.
- Cliente do site (rota pública `/imoveis`) já consome `imoveis.fotos[]` direto da URL pública — sem nenhuma mudança lá, a marca aparece automaticamente nas novas fotos.

## Fora de escopo

- Não vou reprocessar as fotos já cadastradas no banco (seria uma migração de dados separada — posso fazer depois se quiser).
- Não vou adicionar configuração de posição/opacidade na tela de Configurações agora (uso valores fixos sensatos). Se quiser tornar configurável depois, é só puxar de `site_settings`.
- Não toco no fluxo de edição de imóvel se ele permitir trocar fotos — confirmo durante a implementação se há outro ponto de upload.
