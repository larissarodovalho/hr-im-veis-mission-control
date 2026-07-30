# Responsividade da aba Oportunidades

## Problemas confirmados (screenshots da preview)
1. **Sem padding**: o conteúdo fica colado nas bordas da tela (título, filtros, painel de migração e kanban encostados nas margens), diferente de Contas/Leads que usam `p-4 md:p-8`.
2. **Desktop**: as 6 colunas de 280px estouram a largura — "Proposta" aparece cortada e "Ganha/Perdida" ficam inacessíveis sem rolagem horizontal evidente.
3. **Mobile**: os 9 filtros empilham ocupando quase toda a tela inicial; o funil vira rolagem horizontal de colunas de 280px, difícil de usar.

## Mudanças (apenas `src/pages/Oportunidades.tsx`)

### 1. Estrutura e padding
- Raiz passa a `p-4 md:p-6 space-y-4 flex flex-col md:h-full` (padding igual às outras abas; altura total só no desktop, onde o kanban precisa de rolagem interna).

### 2. Kanban no desktop (`hidden md:flex`)
- Container com `overflow-x-auto` e padding lateral interno para a última coluna não colar na borda.
- Colunas mantêm rolagem vertical independente (`flex-1 min-h-0 overflow-y-auto`), como já funciona em Contas.

### 3. Mobile (`md:hidden`) — padrão da aba Contas
- Substituir o kanban por: **chips de etapas com contagem** em rolagem horizontal (Nova, Buscando, Visita, Proposta, Ganha, Perdida) + **lista vertical de cards** da etapa selecionada.
- Extrair o JSX do card de oportunidade para um componente interno `OpCard` reutilizado pelo kanban (desktop) e pela lista (mobile), sem mudar conteúdo nem ações (clique abre o detalhe normalmente).

### 4. Filtros
- **Mobile**: campo de busca sempre visível + botão "Filtros" com contador de filtros ativos que abre/fecha o painel com os selects (largura `w-full` no mobile).
- **Desktop**: filtros continuam inline com wrap, como hoje.
- Botão "Mostrar finalizadas" entra no painel de filtros.

### 5. Indicadores e painel de migração
- Badges de indicadores e `MigracaoLegadasPanel` passam a respeitar o padding da página (sem mudança de lógica).

## Não muda
- Nenhuma regra de negócio, filtro, RPC ou dialog (detalhe/criação continuam iguais).
- Nenhuma outra página.

## Verificação
- Screenshots desktop (1440px) e mobile (390px) confirmando: padding correto, colunas com rolagem independente no desktop, lista por etapa e filtros recolhidos no mobile.