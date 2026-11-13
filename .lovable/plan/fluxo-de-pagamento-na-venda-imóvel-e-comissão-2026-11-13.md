# Fluxo de pagamento na venda (imóvel e comissão)

## O que muda para você
Na janela de edição da venda (Imóveis → Vendidos e Relatórios → Faturamento) aparece uma nova seção **"Fluxo de pagamento"** com duas listas:

1. **Pagamento do imóvel** — parcelas que o comprador paga ao proprietário (entrada, parcelas mensais/anuais, safra, permuta, veículo).
2. **Pagamento da comissão** — parcelas da comissão a receber, com quem recebe: HR Imóveis, corretor vendedor, captador ou parceiro.

Cada parcela tem: número, data de vencimento, valor, forma (Pix, boleto, permuta, safra etc.), situação (**Pendente / Paga / Atrasada**) e data em que foi paga.

- Botão **"Gerar parcelas"**: informe quantidade, intervalo (mensal, anual ou personalizado) e primeira data; o sistema divide o valor. Depois dá para ajustar cada linha.
- Botão **"Marcar como paga"** em cada parcela.
- Aviso se a soma das parcelas não bate com o valor da venda / da comissão.
- A situação geral da comissão (Pendente / Parcial / Paga) passa a ser calculada pelas parcelas: tudo pago = Paga; parte paga = Parcial. Vendas sem parcelas continuam com a situação atual.
- Parcelas vencidas e não pagas aparecem como **Atrasada** automaticamente (fuso de Cuiabá).
- No Faturamento, a lista "Vendas do período" mostra quanto da comissão já foi recebido e quanto falta.

Acesso: só admin e gestor (mesma regra da aba Vendidos).

## Detalhes técnicos
- Nova tabela `venda_parcelas` (venda_id FK cascade, fluxo `imovel|comissao`, beneficiario `hr|vendedor|captador|parceiro|null`, numero, vencimento date, valor numeric, forma, status `pendente|paga`, pago_em date, observacao, timestamps). GRANTs + RLS com `is_admin`/`has_role gestor`.
- Status "atrasada" derivado no cliente (vencimento < hoje Cuiabá e não paga).
- Componente `VendaFluxoPagamento.tsx` usado no diálogo de edição de venda; ao salvar parcelas, atualiza `vendas.status_pagamento` (pendente/parcial/pago).
- `FaturamentoReport` lê totais recebidos/pendentes; realtime na nova tabela.
- Teste: regra de status geral (todas pagas → pago; algumas → parcial; nenhuma → pendente) e geração de parcelas somando exatamente o total.
