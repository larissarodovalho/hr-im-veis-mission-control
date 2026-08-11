# Distribuição de Carteira — Fase 3: Relatórios e auditoria

Última fase do módulo. Fecha o ciclo: depois de distribuir (Fase 1) e atender (Fase 2), agora o gestor mede resultado por corretor/lote e consegue auditar tudo o que aconteceu com cada conta.

## 1. Nova aba "Carteira" em Relatórios

Entra ao lado das abas atuais (Performance, Leads, Oportunidades, etc.) e respeita o filtro de período já existente na página.

Indicadores do topo:
- Contas distribuídas no período
- Primeiro contato feito dentro do prazo (%) e fora do prazo
- Contas sem nenhuma tentativa
- Tempo médio até o primeiro contato
- Contas que viraram oportunidade e que viraram negócio fechado
- Devolvidas e transferidas

Tabelas e gráficos:
- **Por corretor**: recebidas, tentativas registradas, contato estabelecido, % no prazo, tempo médio de resposta, oportunidades geradas, devoluções/transferências.
- **Por lote**: mesma leitura por lote, com data de criação e situação (ativo/encerrado).
- **Funil da carteira**: recebida → tentativa → contato estabelecido → oportunidade → negócio fechado.
- **Motivos de devolução/transferência**: ranking dos motivos informados.

Exportação em CSV das duas tabelas (padrão já usado nos outros relatórios).

## 2. Auditoria da conta

- Nova aba/bloco "Carteira" na tela de detalhe da conta, mostrando a linha do tempo imutável de `carteira_eventos`: atribuição, tentativas, contato estabelecido, agendamentos, solicitações, decisões do gestor, devolução e transferência — com autor, data/hora (Cuiabá) e observação.
- Selo "Carteira HR · <nome do lote>" no cabeçalho da conta e no card do funil de Contas quando a conta pertence a um lote ativo, para todo mundo enxergar a origem.

## 3. Histórico de distribuições

Na página Distribuição de Carteira, terceira aba "Histórico": lista de todas as operações (rascunho, em revisão, confirmada, cancelada) com gestor, data, filtros usados, quantidade definida x distribuída e link para ver os lotes e as contas de cada operação.

## Detalhes técnicos

- Novas funções `SECURITY DEFINER` somente-leitura, restritas a admin/gestor:
  - `carteira_relatorio_corretores(_inicio, _fim)` — agregados por corretor.
  - `carteira_relatorio_lotes(_inicio, _fim)` — agregados por lote + funil.
  - `carteira_relatorio_motivos(_inicio, _fim)` — motivos de devolução/transferência.
  - `carteira_eventos_conta(_conta_id)` — linha do tempo com nome do autor (leitura permitida ao responsável da conta também).
- Cálculo de prazo/atraso comparando `primeira_atividade_em` com `prazo_primeiro_contato`; tempo médio em horas via `atribuida_em`.
- Frontend: `src/components/reports/CarteiraReport.tsx`, aba registrada em `src/pages/Reports.tsx`, timeline em `src/components/carteira/CarteiraTimelineConta.tsx` usada no detalhe da conta, aba "Histórico" em `src/pages/CarteiraDistribuicao.tsx` e hooks novos em `src/hooks/useCarteira.ts`.
- Todas as datas via helpers de `src/lib/datetime.ts` (America/Cuiaba).
