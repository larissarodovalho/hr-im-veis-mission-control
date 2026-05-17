## Causa

O hook `useSiteImages` em `src/lib/siteSettings.ts` começa com o mapa vazio e só consulta o banco depois que o componente monta. Enquanto a consulta não retorna, o `img(key, fallback)` devolve o **fallback bundled** (a imagem ilustrativa antiga importada de `@/assets/...`). Quando o banco responde, a `src` muda para a imagem que você subiu, causando o flash da imagem antiga.

Isso afeta o hero da Home (`hero_home`) e o hero do Contato (`hero_contato`), e qualquer outra seção que use uma imagem customizada via `useSiteImages`.

## Solução

Evitar mostrar o fallback bundled quando existe (ou pode existir) uma imagem customizada no banco. Estratégia em duas camadas:

1. **Esperar o carregamento antes de pintar a imagem do hero.** Usar o flag `loaded` já exposto pelo hook e renderizar o `<img>` somente quando `loaded === true`. Antes disso, manter apenas o fundo escuro do hero (já existe gradiente `#050505`), sem flash.

2. **Pré-carregar a imagem real para evitar fade vazio prolongado.** Aplicar `fetchpriority="high"` e `decoding="async"` no `<img>` do hero, e remover `loading="lazy"` do hero (LCP). Adicionar uma transição de opacidade curta para o `<img>` aparecer suavemente quando estiver pronto.

3. **Cachear o resultado do hook entre páginas.** Hoje cada página refaz `fetchSiteImages()`. Vou guardar um cache em módulo (simples `let cache: Promise<ImagesRecord> | null`) para que ao navegar entre Home e Contato a segunda página já tenha a URL imediatamente, sem nova janela de flash.

## Arquivos a editar

- `src/lib/siteSettings.ts` — adicionar cache de promessa em `fetchSiteImages` e manter `loaded` consistente.
- `src/pages/site/HomePage.tsx` — renderizar `<img>` do hero somente após `loaded`; ajustar atributos para LCP; transição de opacidade.
- `src/pages/site/ContatoPage.tsx` — mesma alteração no hero `hero_contato`.

Sem alterações de backend ou de schema. Apenas comportamento de carregamento da imagem.