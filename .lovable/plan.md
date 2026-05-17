## Objetivo
Adicionar à página **Relatórios** (`/app/relatorios`) uma seção "Funil de Contas" que mostra, em números e gráfico, como anda a carteira de cada lista (**Carteira** e **Marketing**), com quantidade de contas em cada etapa do kanban e taxas de conversão entre etapas.

## 1. Novo componente `src/components/reports/FunilContasReport.tsx`
- Carrega `contas` (`id, etapa_funil, tags, responsavel_id, valor_negocio?`) — uma única query.
- Carrega `profiles` para o filtro "Corretor" (opcional, "Todos").
- Estado local:
  - `lista`: `"carteira" | "marketing" | "todas"` (Tabs no topo).
  - `corretor`: `user_id | "todos"` (Select).
- Filtra contas pela tag selecionada (mesma lógica de `Accounts.tsx`) e pelo responsável.

### Métricas calculadas
Para a lista filtrada, usando a ordem de `ETAPAS` de `src/lib/contasFunil.ts`:
- **Cards de topo** (4):
  - Total de contas
  - Ativos no funil (`total − fechado − perdido`)
  - Fechados
  - Perdidos
  - Taxa de conversão geral: `fechados / (fechados + perdidos)`
- **Tabela / lista por etapa**: para cada etapa em ordem, mostrar nome, quantidade, % do total, e — para etapas de funil ativo — taxa de avanço para a próxima etapa "fluxo" (`contas naquela etapa ou posteriores no fluxo / contas na etapa atual ou posteriores`). Fluxo considerado: `a_contatar → contatado → contato_estabelecido → reuniao → visita → proposta → fechado`. `sem_retorno` e `perdido` são exibidos à parte.

### Gráficos (recharts)
- **Funil/Barra horizontal** (`BarChart` com `layout="vertical"`): uma barra por etapa do fluxo, com valor de quantidade; cores semânticas (usar cores já mapeadas em `ETAPAS`, mas convertidas para hsl tokens do tema — para evitar atrito uso `hsl(var(--primary))` com opacidade decrescente, e cores específicas para `fechado` (success) e `perdido` (destructive)).
- **PieChart** mostrando proporção: Em andamento / Fechado / Perdido / Sem retorno.

### Comparação Carteira × Marketing
Quando a aba selecionada for "Todas", exibir adicionalmente uma seção com **BarChart agrupado** comparando contagem por etapa entre Carteira e Marketing lado a lado.

## 2. Integração em `src/pages/Reports.tsx`
- Renderizar `<FunilContasReport />` logo abaixo do cabeçalho, antes dos cartões de "Exportar leads / Performance".
- Mantém as restrições de role existentes (admin/gestor).

## 3. Sem mudanças de schema
Tudo derivado das tabelas atuais (`contas`, `profiles`). Sem migrações.

## Observações de UX
- Toggle em Tabs no topo (Carteira | Marketing | Todas), com a mesma estética usada em `Accounts.tsx`.
- Filtro de corretor à direita.
- Todos os números clicáveis levam ao kanban filtrado (link `/app/contas?lista={lista}` — sem filtro por etapa por enquanto, para evitar alterar a página de contas).
