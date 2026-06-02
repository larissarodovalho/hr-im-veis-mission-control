## Filtro por data de cadastro (mês/ano) em Imóveis

Adicionar, no header da página `/crm/imoveis`, dois seletores ao lado da busca:

- **Ano**: lista dos anos presentes em `imoveis.created_at` + opção "Todos"
- **Mês**: 1–12 (jan–dez) + opção "Todos"

### Comportamento

- Filtro aplica-se em todas as abas baseadas em `items` (Disponíveis, Em Proposta, Em Fechamento) — combinando com a busca textual já existente.
- Vendidos / Oportunidades / Captação / Parceiros usam componentes próprios — o filtro do header não afeta essas abas (caso queira estender, posso fazer depois).
- Contadores no subtítulo e nos badges das tabs refletem o filtro ativo.
- Se "Ano" = Todos, o seletor de Mês fica desabilitado (ou aplica em qualquer ano).

### Implementação técnica

Em `src/pages/Imoveis.tsx`:
1. Novos estados `anoFiltro` (string, default "all") e `mesFiltro` (string, default "all").
2. Derivar `anosDisponiveis` via `useMemo` a partir de `items` (anos únicos de `created_at`, ordem decrescente).
3. Adicionar predicado `matchesData(i)` que compara ano/mês de `new Date(i.created_at)` com os filtros.
4. Aplicar `matchesSearch(i) && matchesData(i)` nas listas `disponiveis`, `emProposta`, `emFechamento`, `vendidos`.
5. Renderizar dois `<Select>` (shadcn) compactos no header, antes do botão "Cadastrar imóvel".

Sem mudanças de schema, sem mudanças em outras abas.
