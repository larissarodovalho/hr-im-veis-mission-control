## Ajustes mobile da aba Imóveis

No viewport mobile (~440px) há vários elementos quebrados na página de Imóveis e nas sub-abas. Vou ajustar a responsividade sem mexer em lógica.

### 1. `src/pages/Imoveis.tsx` — Cabeçalho e abas
- Header: input de busca com `w-64` fixa estoura a tela. Trocar por `w-full sm:w-64`, empilhar busca + botão "Cadastrar imóvel" em coluna no mobile (`flex-col sm:flex-row`, botão `w-full sm:w-auto`).
- Título `text-3xl` reduzido para `text-2xl sm:text-3xl` para caber junto ao ícone.
- `TabsList`: hoje usa `flex flex-wrap` mas as 7 abas viram um bloco confuso. Trocar por scroll horizontal (`flex overflow-x-auto no-scrollbar whitespace-nowrap`) com `TabsTrigger` mantendo tamanho natural — padrão usado em outras telas mobile.

### 2. `src/pages/imoveis/OportunidadesTab.tsx` — Kanban
- Barra de filtros: `Input w-64` + `select` + badge + botão estouram. Empilhar em coluna no mobile (`flex-col sm:flex-row`), input/select/botão com `w-full sm:w-auto`.
- Kanban com 6 colunas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`): no mobile uma única coluna ocupando a tela toda força scroll vertical gigante e perde a noção de funil. Trocar por scroll horizontal de colunas fixas:
  - Substituir o grid por `flex gap-3 overflow-x-auto pb-2 snap-x` no mobile e manter grid em `md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`.
  - Cada `Coluna` ganha `min-w-[260px] sm:min-w-0 snap-start` no mobile para virar coluna rolável horizontalmente, preservando o visual de kanban.
  - Ajustar `min-h` da coluna para `min-h-[60vh]` no mobile (em vez de `calc(100vh-280px)` que fica enorme).

### 3. Sub-abas que herdam o mesmo problema visual
- `CaptacaoTab`, `ParceirosTab`, `VendidosTab`: verificar rapidamente e aplicar os mesmos princípios (header em coluna no mobile, grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) somente se hoje estiverem quebrando. Sem mudar dados nem lógica.

### Detalhes técnicos
- Apenas classes Tailwind / pequenas reorganizações de JSX.
- Nenhuma alteração de schema, queries ou comportamento.
- Manter tokens semânticos existentes (sem cores hardcoded).
