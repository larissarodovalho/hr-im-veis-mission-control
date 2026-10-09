# Cliente não aparece na janela de nova venda

## Causa
O Ricardo Nicolau existe no cadastro de contas (criado em 17/05/2026). A janela "Nova venda" carrega a lista de clientes em ordem alfabética, mas o sistema devolve no máximo 1.000 por consulta — e hoje existem 1.557 contas. Como "Ricardo" vem depois na ordem alfabética, ele fica de fora da lista. É o mesmo problema que já corrigimos nos cartões de imóveis.

## Correção
- Em `src/components/imoveis/NovaVendaDialog.tsx`, buscar as contas em lotes (paginação) até trazer todas, em vez de uma consulta única limitada a 1.000.
- Assim todos os clientes aparecem na busca, inclusive os mais recentes, independente do total de contas.
- Nada muda no cadastro nem nos dados.

## Verificação
Abrir a janela de nova venda no preview e buscar "Ricardo Nicolau" no campo Cliente — ele deve aparecer e ser selecionável.
