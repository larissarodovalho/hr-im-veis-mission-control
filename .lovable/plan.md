# Por que está acontecendo

O imóvel **HR-0001 "Sobrado Alameda das Cores"** tem **4 fotos** salvas no banco e todas as URLs respondem 200 OK. Mesmo assim, duas coisas dão errado:

## 1. Só aparece 1 foto no site (não as 4)
`src/pages/site/ImovelDetalhePage.tsx` renderiza apenas `imovel.fotos[0]`:
```tsx
const image = imovel.imagem || getImageForImovel(...);
<img src={image} ... />
```
Não existe galeria — as outras 3 fotos ficam invisíveis para o visitante.

## 2. Fotos sem marca d'água
`src/lib/watermark.ts` carrega o logo de `/logo-hr-branco.png`, mas esse arquivo **não existe** em `public/` (só há `favicon.ico`, `placeholder.svg`, `robots.txt`, `fonts/`). O `loadLogo()` falha, o `try/catch` em `applyWatermark` engole o erro e devolve o arquivo original sem marca. Por isso nenhuma das 4 fotos tem a marca da HR.

# O que vou fazer

1. **Adicionar uma galeria na página de detalhe do imóvel** (`ImovelDetalhePage.tsx`):
   - Foto principal grande no topo (mantém estilo atual).
   - Miniaturas clicáveis abaixo para trocar a foto principal.
   - Setas/teclado para navegar.
   - Lightbox em tela cheia ao clicar (com swipe no mobile).
   - Fallback: se só houver 1 foto, esconde as miniaturas.

2. **Restaurar a marca d'água**:
   - Subir o logo branco da HR Imóveis para `public/logo-hr-branco.png` (a logo já está disponível no app — vou reaproveitar `public/fonts`/asset existente da HR; se não existir branca, gero uma versão branca via image gen a partir da identidade do projeto).
   - Validar que `applyWatermark` consegue carregar e desenha a logo no canto inferior direito com opacidade 0.55.
   - Como as 4 fotos atuais já estão salvas sem marca, vou adicionar um botão **"Reaplicar marca d'água"** no `EditarImovelDialog` (opcional, só se você quiser regravar as fotos antigas). Por padrão as próximas fotos já sairão marcadas.

3. **Mostrar mais de 1 foto no card de listagem** (opcional, leve): manter capa como hoje mas indicar contagem (`+3 fotos`) no canto da imagem.

# Detalhes técnicos

- Galeria usa estado local `useState` para índice ativo; setas com `framer-motion` para transição suave (já está no projeto).
- Lightbox: componente leve usando `Dialog` do shadcn já presente.
- Logo: caminho final `/logo-hr-branco.png` (raiz pública) — não muda o `watermark.ts`.
- Reaplicar marca d'água: baixa o JPG do storage, passa pelo `applyWatermark`, faz upload sobrescrevendo o path original (mantém URLs).

# Perguntas rápidas

- Quer o **botão "Reaplicar marca d'água nas fotos atuais"** ou só garantir que as próximas saiam marcadas?
- A galeria deve ser estilo **carousel com miniaturas** (igual sites tipo QuintoAndar) ou **grid 2x2** com lightbox?
