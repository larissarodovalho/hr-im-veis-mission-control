Fazer cada coluna do Kanban de Contas rolar individualmente, sem depender de um offset fixo em pixels.

**Abordagem**: medir a posição real do topo do Kanban em runtime e usar isso como altura das colunas. Assim, independente do cabeçalho/tabs/filtros acima, cada coluna sempre ocupa exatamente o espaço restante do viewport e rola sozinha.

**Alteração em `src/components/contas/ContasKanban.tsx`**:

1. Adicionar um `ref` no wrapper externo (`<div className="flex gap-3 overflow-x-auto pb-2">`).
2. Em um `useEffect`, medir `ref.current.getBoundingClientRect().top` e gravar em uma CSS variable local `--kanban-top` no próprio elemento. Reobservar em `window.resize` (via `ResizeObserver` do próprio elemento também, para reagir a mudanças de layout).
3. Na `Column`, trocar `h-[calc(100vh-260px)]` por `h-[calc(100dvh-var(--kanban-top,260px)-16px)]` (`-16px` de folga para padding inferior).

Resultado: em qualquer tela e independente da quantidade de chrome acima (filtros, tabs Carteira/Marketing, toggle Kanban/Lista), cada coluna fica exatamente com a altura disponível e o `overflow-y-auto` já presente ativa a rolagem por coluna.

Nenhuma alteração em `Accounts.tsx` ou em dados.