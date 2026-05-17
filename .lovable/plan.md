## Objetivo

Deixar o site (Início, Imóveis, Sobre, Contato, Detalhe do Imóvel) fluido no mobile. Hoje há travamentos porque várias seções usam animações pesadas baseadas em scroll (scale + rotateX + blur + perspective) que rodam mal em celulares.

## Diagnóstico

Em `src/pages/site/HomePage.tsx` e `ImoveisPage.tsx` existe um componente `ScrollSection` que aplica em cada seção, ligado ao scroll do usuário:
- `filter: blur(...)` animado (caro na GPU mobile)
- `scale`, `rotateX` com `perspective` e `transformStyle: preserve-3d`
- `opacity` que faz a seção sumir nas bordas
- `ParallaxImage` com imagem 120% e `y` animado

Combinado com várias seções `whileInView` + `motion.img whileHover scale`, isso causa frame drops, "salto" do conteúdo e a sensação de travamento que o usuário relata.

Outros pontos que afetam o mobile:
- Hero usa `h-screen` com `100vh` — no iOS muda quando a barra do Safari aparece/some, causando "pulo".
- Botões do Hero (`Explorar Imóveis` + `Contato`) usam `flex gap-4` sem wrap — em telas estreitas ficam apertados.
- Header fixo + botão flutuante do WhatsApp ocupam espaço; o padding inferior das seções precisa garantir que o último CTA não fique escondido atrás do botão verde.
- `tracking-[0.5em]` em letras pequenas no mobile gera quebras estranhas.

## O que vai mudar (somente frontend / apresentação)

### 1. `ScrollSection` — versão mobile leve
- Detectar mobile (`useIsMobile` já existe em `src/hooks/use-mobile.tsx`).
- No mobile: desativar `rotateX`, `scale`, `filter: blur` e `perspective`. Manter apenas um fade-in suave (`opacity` + `y` curto) com `whileInView` e `once: true`, para não recalcular a cada scroll.
- Remover os gradientes de "fade edge" no mobile (eles forçam composição extra e cortam visualmente o conteúdo em telas pequenas).
- No desktop: manter o comportamento atual.

### 2. `ParallaxImage` e `ParallaxHero`
- No mobile: renderizar a imagem em 100% sem `useTransform` do scroll (sem parallax).
- Hero: trocar `h-screen` por `min-h-[100svh]` (com fallback `h-screen`) para evitar o pulo da barra do Safari.

### 3. Hero da Home — CTAs
- `flex gap-4` → `flex flex-wrap justify-center gap-3` no mobile, para os botões "Explorar Imóveis" e "Contato" caberem lado a lado ou empilharem com elegância.
- Reduzir `tracking` extremo no mobile (`tracking-[0.15em]` em vez de `0.5em` nas labels pequenas) para evitar quebras feias.

### 4. Espaçamentos e respiro mobile
- Padding das `ScrollSection` no mobile: `py-16` em vez de `py-10` (atual) para o scroll-snap visual ficar mais natural sem sobreposição entre seções (hoje há `-mt-12` que junta demais no mobile).
- Adicionar `pb-24` na última seção de cada página para o conteúdo não ficar atrás do botão flutuante do WhatsApp.

### 5. Páginas a revisar (mesmas otimizações)
- `src/pages/site/HomePage.tsx`
- `src/pages/site/ImoveisPage.tsx`
- `src/pages/site/ImovelDetalhePage.tsx`
- `src/pages/site/SobrePage.tsx`
- `src/pages/site/ContatoPage.tsx`

### 6. Performance geral
- Adicionar `will-change: transform` apenas onde realmente anima (não em todas as seções) — hoje é implícito e custa memória.
- `motion.img whileHover scale` só faz sentido com mouse; condicionar a desktop.
- Garantir `loading="lazy"` e `decoding="async"` em todas as `<img>` abaixo da dobra (a maioria já tem; conferir cards).

## O que NÃO muda
- Conteúdo, textos, cores, tipografia e estrutura visual no desktop.
- Lógica de filtros, busca, dados do Supabase, WhatsApp, rotas.
- Layout do CRM (`AppLayout`) — fora de escopo.

## Verificação
- Após as mudanças, testar via preview em viewport mobile (375x812) percorrendo Home → Imóveis → Detalhe → Sobre → Contato, conferindo:
  - Scroll contínuo sem "engasgo" entre seções
  - Sem corte/sumiço de conteúdo nas bordas
  - Botões do hero acessíveis sem overflow horizontal
  - Botão flutuante do WhatsApp não cobre CTAs finais
