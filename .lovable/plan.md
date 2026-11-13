# Fluxo de pagamento na aba Relatórios

Nova subaba **Fluxo de pagamento** em Relatórios (ao lado de Faturamento), visível para admin e gestor, para acompanhar todas as parcelas lançadas nas vendas.

## O que aparece
- **Resumo no topo** (separado para Comissões e para Imóvel): total previsto, recebido (verde), pendente (amarelo) e atrasado (vermelho).
- **Comissões por quem recebe:** HR Imóveis, vendedor, captador e parceiro, com recebido × falta.
- **Lista de parcelas:** venda/cliente, imóvel, nº da parcela, quem recebe, vencimento, valor, status, data do pagamento e observação. Cores conforme status.
- **Próximos vencimentos:** destaque para parcelas que vencem nos próximos 30 dias e para as atrasadas.
- **Filtros:** período por vencimento, tipo (Comissão / Imóvel / Ambos), status (pago, pendente, atrasado), quem recebe e corretor.
- Clique em uma parcela abre a venda em **Editar venda** para dar baixa ou ajustar.
- Exportar em planilha (CSV) e PDF.
- Atualiza sozinho quando alguém lança ou marca uma parcela como paga.

## Detalhes técnicos
- Novo `src/components/reports/FluxoPagamentoReport.tsx`, lendo `venda_parcelas` com join em `vendas` (cliente, imóvel, vendedor/captador/parceiro), paginado.
- Status "atrasada" calculado com a mesma regra de `VendaFluxoPagamento` (`isAtrasada`, fuso Cuiabá), extraída para helper compartilhado.
- Nova `TabsTrigger value="fluxo"` em `src/pages/Reports.tsx`, restrita a admin/gestor; realtime via canal compartilhado nas tabelas `venda_parcelas` e `vendas`.
- Sem mudanças no banco.
