## Funil de atendimento (Kanban) em Carteira e Marketing

Adicionar um pipeline visual dentro das subabas **Carteira** e **Marketing** de `/app/contas`, com 6 etapas fixas e cards arrastáveis representando cada conta.

### Etapas (mesmas para Carteira e Marketing)

1. A contatar (default ao entrar/criar)
2. Contatado
3. Sem retorno
4. Reunião
5. Fechado
6. Perdido

### Comportamento

- Dentro de cada subaba (Carteira / Marketing) adicionar um toggle no topo: **Kanban** (default) | **Lista** — preserva a tabela atual como visão alternativa.
- Visão Kanban: 6 colunas horizontais com scroll, cada coluna mostra os cards das contas naquela etapa, com contador no header.
- Card mostra: nome (linkando para `/app/contas/:id`), telefone/email, badge de interesse e valor total das propriedades. Clique no nome navega para o detalhe da conta.
- Drag-and-drop entre colunas atualiza a etapa imediatamente (otimista) e persiste no banco. Em caso de erro, reverte e mostra toast.
- Subaba **Todos** continua mostrando apenas a Lista (sem Kanban), já que mistura categorias.
- Filtros existentes (busca, tipo, interesse, aptidão, status) continuam funcionando no Kanban — filtram os cards visíveis em cada coluna.

### Mudanças técnicas

**Banco** (migration):
- Adicionar coluna `etapa_funil text not null default 'a_contatar'` em `public.contas`.
- Adicionar índice `idx_contas_etapa_funil` para queries por etapa.
- Sem mudança de RLS (políticas atuais já cobrem update por responsável/admin).

**Frontend**:
- Nova lib `src/lib/contasFunil.ts` com a constante `ETAPAS = [{ id, label, color }]` e helpers de label/cor.
- Novo componente `src/components/contas/ContasKanban.tsx`:
  - Recebe `accounts`, `propsByAccount` e callback `onMoveStage(contaId, novaEtapa)`.
  - Usa `@dnd-kit/core` + `@dnd-kit/sortable` (já leve, sem dep extra de animação) — instalar.
  - Renderiza 6 colunas `Card` com cabeçalho colorido, contador, e lista de `ContaCard`.
- `src/pages/Accounts.tsx`:
  - Carregar `etapa_funil` no `select`.
  - Estado `view: "kanban" | "lista"` (querystring `?view=`), default `kanban` em Carteira/Marketing, forçado `lista` em Todos.
  - Toggle de visão (`Tabs` ou dois `Button` agrupados) ao lado do tab principal.
  - Função `moveStage(id, etapa)`: update otimista local + `supabase.from('contas').update({ etapa_funil }).eq('id', id)`; rollback em erro.
  - Renderiza `<ContasKanban />` quando `view === "kanban"`, senão a tabela atual.
- `NovaContaDialog`: incluir `etapa_funil: 'a_contatar'` no insert (já é o default do banco, mas explicitar).
- Tipo `Account` ganha `etapa_funil: string`.

### Dependências

- `@dnd-kit/core` e `@dnd-kit/sortable` (leves, ~15KB gzip).

### O que NÃO muda

- Tabela `contas` permanece com todas as funcionalidades atuais.
- Subaba **Todos**, filtros, exportação, edição e detalhes da conta seguem iguais.
- Tags `carteira`/`marketing` continuam sendo o que separa as subabas; etapa do funil é ortogonal.