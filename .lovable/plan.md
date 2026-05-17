## Corrigir links do WhatsApp que abrem com erro

### Diagnóstico
Os links `wa.me` contêm texto com acentos, espaços e pontuação **não codificados** (ex.: `?text=Olá! Gostaria de mais informações.`). O `wa.me` exige a query `text` URL-encoded; quando não está, ele pode mostrar erro de "número inválido" ou não abrir a conversa corretamente, principalmente no desktop.

### Correção
Codificar o parâmetro `text` em todos os links usando `encodeURIComponent(...)` nos arquivos:
- `src/components/site/SiteLayout.tsx` (botão flutuante)
- `src/pages/site/ContatoPage.tsx`
- `src/pages/site/HomePage.tsx`
- `src/pages/site/SobrePage.tsx`
- `src/pages/site/ImoveisPage.tsx` (2 links)
- `src/pages/site/ImovelDetalhePage.tsx` (3 links)

Padrão aplicado:
```tsx
href={`https://wa.me/5566999955881?text=${encodeURIComponent("Olá! ...")}`}
```

### Fora do escopo
Mudança do número, layout, ou outros CTAs.
