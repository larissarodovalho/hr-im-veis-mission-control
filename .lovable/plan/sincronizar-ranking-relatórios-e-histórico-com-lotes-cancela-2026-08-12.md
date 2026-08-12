# Sincronizar ranking, relatórios e histórico com lotes cancelados

Ao cancelar um lote, as atribuições são marcadas como `cancelado` e encerradas, e as contas voltam ao responsável original — isso já funciona. O que não acontece é a limpeza nas telas de desempenho: as funções que alimentam o Ranking e os Relatórios de corretores contam **todas** as atribuições do período, sem excluir as canceladas. Hoje as duas únicas atribuições da base estão com status `cancelado` e mesmo assim o Gabriel continua aparecendo no placar.

## O que será corrigido

### 1. Ranking (placar de corretores)
- Atribuições de lotes cancelados deixam de contar em recebidas, contato, no prazo, oportunidades, fechamentos e devoluções.
- Corretor que ficar sem nenhuma atribuição válida no período some do placar (hoje aparece com score zerado).

### 2. Minha posição / metas
- A posição e o progresso de metas do corretor passam a usar a mesma base filtrada, ficando coerentes com o placar.

### 3. Relatórios de carteira (corretores, lotes, motivos)
- Desempenho por corretor ignora atribuições canceladas.
- Relatório de lotes e de motivos passa a distinguir lotes cancelados, para não inflar números de devolução/atraso.

### 4. Acompanhamento e Minha Carteira
- Lotes cancelados não entram em "Desempenho dos lotes ativos" nem nos alertas de gestor/corretor.
- A lista de contas do corretor continua mostrando o registro como "Encerrada" (histórico preservado), mas ele não conta nos KPIs de pendência.

### 5. Histórico
- A aba Histórico segue mostrando o lote cancelado com selo de "Cancelado" e os eventos de devolução — nada é apagado, só deixa de pesar na performance.

## Detalhes técnicos

Migração ajustando funções `SECURITY DEFINER` já existentes:

- `carteira_ranking_corretores`: adicionar filtro `a.status <> 'cancelado'` (e excluir atribuições cujo lote esteja com `status = 'cancelado'`) no CTE `base`.
- `carteira_relatorio_corretores`: mesmo filtro.
- `carteira_relatorio_lotes` e `carteira_relatorio_motivos`: excluir lotes/atribuições cancelados dos agregados.
- `carteira_minha_posicao`: aplicar o mesmo critério ao cálculo de posição e ao progresso de metas.
- `carteira_alertas_gestor` / `carteira_alertas_corretor`: garantir `status <> 'cancelado'` além do `encerrada_em IS NULL` (defensivo, já que cancelamento encerra).
- `carteira_resumo_lotes`: não listar lotes com `status = 'cancelado'` como ativos.

Frontend: nenhuma mudança de lógica necessária — as telas de Distribuição, Acompanhamento, Histórico, Ranking e Minha Carteira consomem essas RPCs. Apenas revalidar que o Histórico exibe o selo "Cancelado" no lote.
