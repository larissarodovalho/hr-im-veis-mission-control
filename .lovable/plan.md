## Problema
Na versão mobile, as seções da home (Diferenciais, Imóveis em destaque, Comprar/Vender, etc.) aparecem escuras/desfocadas — quase invisíveis.

## Causa
O hook `useIsMobile()` em `src/hooks/use-mobile.tsx` inicializa com `undefined` (tratado como `false`). No primeiro render, o `ScrollSection` em `src/components/site/MotionSections.tsx` cai no ramo desktop, que aplica `opacity` e `filter: blur(4-8px)` ligados ao scroll. Como `scrollYProgress` começa em 0, opacity vira 0 e o conteúdo nasce blur + invisível. O hook só atualiza depois (no useEffect) e nem sempre o framer-motion troca limpo para o ramo mobile, deixando o conteúdo "fosco".

## Correção
Tornar a detecção de mobile síncrona, já no primeiro render, evitando o flash do ramo desktop:

1. **`src/hooks/use-mobile.tsx`** — inicializar `useState` com uma função que lê `window.innerWidth < 768` de forma síncrona (com guard `typeof window !== "undefined"`), em vez de `undefined`. Assim, em qualquer mobile, o primeiro render já retorna `true`.

2. **`src/components/site/MotionSections.tsx`** — como reforço, no ramo desktop garantir que o `initial` da seção comece com `opacity: 1` (a animação fica só "decorativa" via scroll), para que mesmo durante o flash de 1 frame nada apareça invisível.

Sem essa correção, o problema atinge qualquer celular real, não só o preview.

## Observação
Mudança puramente de detecção/CSS de animação — nenhum conteúdo nem layout muda. Resultado esperado: nas próximas visitas mobile, todas as seções aparecem nítidas e com fade-in suave.