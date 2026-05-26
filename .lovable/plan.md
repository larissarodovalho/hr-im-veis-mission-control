## Ajustes na aba Oportunidades de Negócio (`src/pages/imoveis/OportunidadesTab.tsx`)

### 1. Badge de prioridade saindo do card
Hoje o título + badge de prioridade ficam num `flex justify-between` sem proteção. Em colunas estreitas (xl:grid-cols-6) o badge "alta/média/baixa" estoura para fora do card.

**Correção:**
- Adicionar `shrink-0` no badge de prioridade e `min-w-0` no título para evitar overflow.
- Reduzir padding do badge (`px-1.5 py-0`) e usar `whitespace-nowrap`.
- Garantir `overflow-hidden` no card para conter qualquer transbordo.

### 2. Colunas do funil mais compridas (altas)
Atualmente: `min-h-[200px]`. Vamos deixar as colunas ocuparem a altura útil da tela, como no Kanban de Contas.

**Correção:**
- Trocar `min-h-[200px]` por `min-h-[calc(100vh-280px)]` na `Coluna`.
- Adicionar `overflow-y-auto` para permitir rolagem interna quando houver muitos cards.
- Manter o grid responsivo atual.

### Arquivos afetados
- `src/pages/imoveis/OportunidadesTab.tsx` (somente CSS/Tailwind nos componentes `OportunidadeCard` e `Coluna`)

Nenhuma mudança de lógica ou dados.