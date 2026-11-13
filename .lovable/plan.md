# Alargar o quadro de fluxo de pagamento

Objetivo: mostrar todos os números das parcelas (imóvel e comissão) sem cortes ao editar a venda.

## O que muda
- A janela "Editar venda" fica bem mais larga (quase toda a largura da tela, até ~1280px), mantendo a rolagem vertical.
- Nas linhas de parcela e no gerador de parcelas, os campos de valor e data ganham mais espaço; os campos menores (nº, status) ficam mais estreitos.
- Valores longos (ex.: R$ 29.500,00) aparecem inteiros, sem reticências.
- Em telas menores, os campos quebram em duas linhas em vez de cortar.

## Detalhes técnicos
- `NovaVendaDialog.tsx`: `DialogContent` de `max-w-2xl` para `max-w-[min(1280px,95vw)]`.
- `VendaFluxoPagamento.tsx`: redistribuir `md:col-span-*` da grade de 12 colunas (linhas, linha 124) e da grade do gerador (linha 180, passar a `lg:grid-cols-6` com `md:grid-cols-3`); `min-w-0` e inputs com `tabular-nums`.
- Conferir com captura de tela no preview.
