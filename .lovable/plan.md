## Tornar o card do imóvel inteiro clicável

No `src/pages/site/ImoveisPage.tsx`, envolver o card inteiro com um `<a href={`/imovel/${im.id}`}>` (ou usar `react-router-dom` `Link`) para que qualquer clique no card leve à página de detalhe.

### Mudanças
- Envolver o `motion.div` do card (linha 380) com um link para `/imovel/${im.id}`.
- Manter os 2 botões existentes ("Solicitar visita" no WhatsApp e "Ver imóvel"), mas adicionar `onClick={(e) => e.stopPropagation()}` no botão do WhatsApp para não navegar — o link "Ver imóvel" pode continuar como está (mesmo destino) ou virar redundante.
- Adicionar `cursor-pointer` e manter as animações de hover.

### Detalhe técnico
- O wrapper externo (`motion.div` com `initial/whileInView`) continua igual.
- Trocar o `motion.div` interno (com `whileHover={{ y: -8 }}`) por `motion.a href={`/imovel/${im.id}`} className="block ..."`.
- No `<a>` do WhatsApp, adicionar `onClick={(e) => { e.stopPropagation(); openWhatsApp(...); }}` para impedir que o clique no botão WhatsApp também dispare navegação para o detalhe (links aninhados são inválidos em HTML, então o botão WhatsApp passará a ser um `<button>` que abre WhatsApp via JS, evitando `<a>` dentro de `<a>`).
- Remover o botão "Ver imóvel" (redundante) OU mantê-lo como indicação visual sem `<a>` aninhado.

### Resultado
Clicar em qualquer área do card abre `/imovel/:id`. O botão de WhatsApp continua funcionando independentemente.