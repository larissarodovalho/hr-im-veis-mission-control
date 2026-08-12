# Ver contatos de um lote ativo

Na tabela "Desempenho dos lotes ativos" (Distribuição de Carteira), hoje só é possível cancelar o lote. A ideia é poder abrir o lote e ver a lista de contas atribuídas.

## O que muda

- O nome do lote vira um link/botão clicável e a linha ganha uma ação "Ver contatos".
- Ao clicar, abre um painel com a lista das contas daquele lote, mostrando para cada uma:
  - Nome da conta, telefone e e-mail
  - Situação (1º contato pendente, atrasada, em atendimento, contato feito, devolvida, transferida)
  - Prazo do 1º contato, número de tentativas, última atividade e próxima ação
  - Selo quando já tem oportunidade aberta
- Filtro rápido por situação dentro do painel (usando os mesmos números das colunas da tabela) e busca por nome.
- Cada contato tem atalho para abrir a conta no CRM (mesma navegação já usada na carteira).

## Detalhes técnicos

- Reaproveitar o RPC existente `carteira_minha_carteira(_corretor)` chamado com o `corretor_id` do lote e filtrar client-side por `lote_id` — não é necessária nova função no banco nem migração.
- Novo componente `src/components/carteira/LoteContatosDialog.tsx` (Dialog + Table), usando `situacaoAtribuicao()` de `src/hooks/useCarteira.ts` para classificar cada linha.
- Em `src/components/carteira/AcompanhamentoCarteira.tsx`: estado `loteAberto`, célula do nome do lote clicável e nova ação na coluna "Ações"; datas via helpers de `src/lib/datetime.ts` (America/Cuiaba).
- Acesso segue as permissões atuais da tela (admin/gestor); nenhuma regra de RLS é alterada.
