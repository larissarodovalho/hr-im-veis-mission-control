# Ajustes visuais no Fluxo de pagamento

## O que muda
- **Valor total em destaque:** no topo de cada quadro (imóvel e comissão), o total aparece grande e em negrito, no formato brasileiro (ex.: **R$ 29.500,00**), junto com "Recebido" e "Falta".
- **Cores por situação em cada parcela:**
  - Paga: fundo e selo **verdes**.
  - Pendente: fundo e selo **amarelos**.
  - Atrasada: continua **vermelha**.
- **Valor da parcela formatado** com ponto e vírgula (R$ 9.833,33) enquanto você digita.
- **Caixa de observação** em cada parcela (ex.: "pago via Pix pelo filho do comprador"), salva com o fluxo.

## Detalhes técnicos
- Só a tela `VendaFluxoPagamento.tsx` muda; a coluna `observacao` já existe, então não há mudança no banco.
- Cores com novos tokens semânticos `--success` e `--warning` no `index.css`/tailwind, sem cores fixas.
- O campo de valor usa máscara pt-BR igual à de Metas.
