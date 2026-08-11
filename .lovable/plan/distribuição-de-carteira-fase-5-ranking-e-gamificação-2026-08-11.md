# Distribuição de Carteira — Fase 5: Ranking e gamificação

As fases 1 a 4 estão no ar: distribuição em lotes, atendimento do corretor, relatórios/auditoria e automação de SLA com alertas. O gestor já enxerga quem está atrasado, mas não há um sistema que **motiva e reconhece** os corretores que performam bem. Hoje não existe ranking, metas ou selos.

Esta fase cria um placar de performance visível para a equipe, com metas mensais configuráveis e selos automáticos.

## O que será entregue

### 1. Placar de corretores (Ranking)
- Nova aba **"Ranking"** na página de Distribuição de Carteira (ao lado de Distribuir, Acompanhamento e Histórico).
- Tabela ordenada por **score** (0 a 100), com posição, nome do corretor, score com barra de progresso e métricas-chave: contas recebidas, % contato estabelecido, % no prazo, oportunidades geradas, negócios fechados, devoluções.
- Medalhas 🥇🥈🥉 para os três primeiros.
- Filtro de período reutilizando o `PeriodPicker` existente (mensal/anual).
- Visível para admin, gestor e corretor (o corretor vê o placar completo, motivando competição saudável).
- O gestor pode desligar a visibilidade do placar para corretores via Configurações — quando desligado, o corretor vê apenas a própria posição.

### 2. Fórmula de score (transparente, documentada na tela)
O score combina cinco indicadores já calculados pela função `carteira_relatorio_corretores`:

```text
Score = 35% × (% contato estabelecido)
      + 20% × (% primeiro contato no prazo)
      + 20% × (% conversão em oportunidade)
      + 15% × (% fechamentos, limitado a 30%)
      + 10% × (100% − % devoluções)
```

- Cada componente é protegido contra divisão por zero (score neutro quando não há recebidas).
- A fórmula e os pesos aparecem como tooltip/explicação na tela do ranking.

### 3. Metas mensais por corretor
- O gestor define, na aba Acompanhamento, metas mensais (mês/ano) para cada corretor: contatos a estabelecer, oportunidades a gerar, negócios a fechar.
- Barras de progresso mostram quanto cada corretor cumpriu da meta no período.
- O corretor vê suas próprias metas e o progresso no topo da Minha Carteira.
- Se nenhuma meta for definida, o campo fica invisível (não obrigatório).

### 4. Selos automáticos
Computados a partir dos dados do ranking no período selecionado, exibidos como badges ao lado do nome do corretor:
- **Pontual** — 90%+ de contatos no prazo.
- **Contato firme** — 80%+ de contatos estabelecidos.
- **Conversor** — 40%+ das contas viraram oportunidade.
- **Fechador** — 3+ negócios fechados no período.
- **Baixa devolução** — menos de 10% de devoluções.

### 5. Minha posição na Minha Carteira
- Card no topo de Minha Carteira mostrando: posição no ranking, score, selos conquistados e progresso das metas do mês.
- Atualiza junto com a recarga da carteira.

### 6. Top 3 no Dashboard
- O cartão "Carteira HR Imóveis" do Dashboard ganha, para admin/gestor, uma mini-lista dos três melhores corretores do mês com score e selo.

## Detalhes técnicos

### Migração
- **Nova tabela `carteira_metas`**: `id` (uuid PK), `corretor_id` (uuid → profiles), `ano_mes` (text, formato `YYYY-MM`), `meta_contatos` (int, default 0), `meta_oportunidades` (int, default 0), `meta_fechamentos` (int, default 0), `created_by` (uuid), `created_at`, `updated_at`. Unique `(corretor_id, ano_mes)`. GRANT select para authenticated; insert/update/delete para admin/gestor via RLS; service_role all. Enable RLS.
- **Nova coluna em `carteira_config`**: `ranking_visivel` boolean default true.
- **Nova função `carteira_ranking_corretores(_inicio, _fim)`** em `SECURITY DEFINER`: reutiliza a mesma lógica de `carteira_relatorio_corretores` e adiciona `score` (numeric 0-100), `posicao` (int via `rank() over order by score desc`), `pct_contato`, `pct_no_prazo`, `pct_oportunidade`, `pct_fechamento`, `pct_devolucao`. Retorna apenas corretores com pelo menos 1 recebida no período.
- **Nova função `carteira_minha_posicao(_corretor)`** em `SECURITY DEFINER`: retorna a linha do ranking do corretor no mês corrente + metas + progresso das metas (contatos_feitos, oportunidades_geradas, fechamentos, e se cumpriu cada meta). Se `ranking_visivel = false`, outros corretores não aparecem — só a posição numérica do próprio.
- **Nova função `carteira_metas_upsert(_corretor, _ano_mes, _contatos, _oportunidades, _fechamentos)`** em `SECURITY DEFINER`: insert or update on conflict, restrita a admin/gestor.

### Frontend
- `src/hooks/useCarteira.ts`: adicionar `useRankingCorretores(inicio, fim)`, `useMinhaPosicao()`, `useCarteiraMetas(anoMes)`, `salvarMetaCorretor(...)`. Estender `CarteiraConfig` com `ranking_visivel`.
- `src/components/carteira/CarteiraRanking.tsx` (novo): tabela do placar com score, selos, barras de progresso, tooltip da fórmula e filtro de período.
- `src/components/carteira/CarteiraMetasCard.tsx` (novo): gestor define/vê metas por corretor; corretor vê o próprio progresso.
- `src/pages/CarteiraDistribuicao.tsx`: adicionar aba "Ranking" renderizando `CarteiraRanking`.
- `src/pages/MinhaCarteira.tsx`: adicionar card de "Minha posição" usando `useMinhaPosicao`.
- `src/components/carteira/AcompanhamentoCarteira.tsx`: adicionar `CarteiraMetasCard` no final da página.
- `src/pages/Dashboard.tsx`: estender `CarteiraResumoCard` para mostrar top 3 (admin/gestor).
- `src/components/carteira/CarteiraConfigCard.tsx`: adicionar switch "Placar visível para corretores".
- Todos os cálculos de data usam `src/lib/datetime.ts` (America/Cuiaba).
