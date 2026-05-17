## Plano: rolar para o topo ao trocar de aba

**Problema:** ao navegar entre Início, Imóveis, Sobre e Contato, a nova página abre na posição em que o usuário estava — em vez de começar do topo.

**Solução:** adicionar um componente `ScrollToTop` que, sempre que a rota mudar, força `window.scrollTo(0, 0)`.

### Mudanças
1. Criar `src/components/site/ScrollToTop.tsx` que usa `useLocation` e dispara o scroll para o topo a cada mudança de `pathname`.
2. Montar esse componente dentro de `SiteLayout` (uma vez só, abrange todas as páginas do site).

Sem alterações em lógica de negócio — apenas comportamento de navegação.