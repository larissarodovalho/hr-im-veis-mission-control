# Vendas do período clicáveis no Faturamento

## O que muda

Na subaba **Faturamento** (Relatórios), cada linha do quadro **"Vendas do período"** passa a ser clicável. Ao clicar em uma venda, abre a janela da venda (a mesma usada hoje no cadastro de vendas dos Imóveis), já preenchida com:

- **Dados da venda**: cliente, imóvel, data, valor, tipo, origem e corretores (vendedor/captador/parceiro).
- **Condições de pagamento**: status do pagamento, valor da comissão, percentuais e observações.
- **PDF do contrato**: quando a venda tem contrato anexado, aparece o link para abrir/baixar o PDF (e dá para substituir ou remover o arquivo).

A janela abre em modo de edição, então também é possível corrigir algo da venda ali mesmo; ao salvar, a lista do Faturamento atualiza sozinha.

## Detalhes técnicos

- Arquivo principal: `src/components/reports/FaturamentoReport.tsx`.
- Reutiliza o componente existente `NovaVendaDialog` (`src/components/imoveis/NovaVendaDialog.tsx`), que já aceita uma venda como `initial`, já mostra status/condições de pagamento e já gera o link assinado do PDF do contrato no bucket `contratos-vendas`.
- Clique na linha (com cursor de mão e realce ao passar o mouse) abre o diálogo com aquela venda; a linha de **Total** não é clicável.
- `onSaved` dispara uma nova busca das vendas (mesmo efeito do refresh da subaba), mantendo KPIs, gráfico, lista e ranking sincronizados.
- Sem migração de banco e sem mudança nas outras subabas.

## Validação

- Typecheck, testes e build.
- Conferir no preview: clicar na venda do Cassio Antônio Pacheco abre a janela com os dados dela e o status de pagamento; salvar uma alteração reflete na lista.
