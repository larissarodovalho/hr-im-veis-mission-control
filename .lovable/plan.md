## Objetivo
Remover a barra de rolagem visível na coluna lateral esquerda do CRM, mantendo a rolagem funcional (apenas o visual fica limpo/minimalista).

## Alteração
Em `src/components/AppLayout.tsx`, no `<nav>` da `SidebarContent` (linha ~78), trocar a classe `overflow-auto` por `overflow-y-auto scrollbar-hide` para esconder a scrollbar mantendo o scroll por gesto/roda.

## Suporte da utilitária `scrollbar-hide`
Verificar se já existe um utilitário equivalente no projeto. Caso não exista, adicionar em `src/index.css` dentro de `@layer utilities`:

```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

## Escopo
Apenas a sidebar do CRM (`AppLayout.tsx`). Não mexe no site público, nem em outras áreas com rolagem.
