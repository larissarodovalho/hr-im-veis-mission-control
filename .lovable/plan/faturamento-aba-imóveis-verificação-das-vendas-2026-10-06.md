# Faturamento × aba Imóveis: verificação das vendas

## Resultado da verificação
Está tudo ligado. As duas telas usam o **mesmo cadastro de vendas**:
- Lançar ou editar uma venda em **Imóveis → Vendidos** usa a mesma janela de venda que abre ao clicar numa linha de **Vendas do período** no Faturamento.
- Conferido no banco: hoje existe 1 venda (30/01/2026, R$ 1.800.000,00, Cassio Antônio Pacheco). Ela está ligada ao imóvel "Lote nº 01, da Quadra nº 19…", que está marcado como **Vendido**, e tem o PDF do contrato anexado. Ela aparece nas duas telas.
- Excluir uma venda em Imóveis remove ela também do Faturamento.
- O **Faturamento** se atualiza sozinho em até ~3 segundos quando uma venda é lançada ou alterada em Imóveis.

## Única diferença encontrada
O caminho inverso não é automático: quem está com a aba **Imóveis → Vendidos** aberta só vê a alteração feita pelo Faturamento (ou por outro usuário) depois de recarregar a página.

## Ajuste proposto
- Fazer a aba **Vendidos** se atualizar sozinha quando uma venda for lançada, editada ou excluída em qualquer lugar.
- Na mesma aba, o **"Ver contrato"** passa a abrir na janela de PDF dentro do CRM (a mesma que corrigiu o bloqueio no Faturamento), já que é a mesma janela de venda.

## Detalhes técnicos
- `src/pages/imoveis/VendidosTab.tsx`: canal realtime em `vendas` (insert/update/delete) com debounce de ~1,5s chamando o `load()` existente; limpar o canal ao desmontar.
- `vendas` já está na publicação realtime (usada por `useReportsPeriod`), então não precisa de migração.
- Validar no preview: editar a venda pelo Faturamento e ver a aba Vendidos atualizar.
