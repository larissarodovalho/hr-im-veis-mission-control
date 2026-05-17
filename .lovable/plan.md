## Plano

O problema agora não é mais o número do WhatsApp: é a forma como o link externo é aberto dentro do ambiente de preview/navegador. Vou trocar a abordagem para uma compatível com bloqueadores de iframe/pop-up.

## Ajustes propostos

1. **Alterar o helper de WhatsApp**
   - Gerar links no formato `https://wa.me/5566999955881?text=...`, que é mais direto e menos propenso ao erro `api.whatsapp.com está bloqueado`.
   - Manter o texto da mensagem corretamente codificado via `URLSearchParams`/encoding.

2. **Remover o `window.open` programático**
   - Usar comportamento nativo de link com `target="_blank"` e `rel="noopener noreferrer"`.
   - Isso evita que o navegador trate o clique como pop-up bloqueável ou tente abrir dentro do preview.

3. **Aplicar em todos os botões do site**
   - Botão flutuante de WhatsApp.
   - Botões “Falar com a equipe”, “Falar com consultor”, “Solicitar visita”, “Pedir informações” e CTA da página inicial.

4. **Validar depois da implementação**
   - Conferir que não sobrou nenhum link antigo para `api.whatsapp.com`.
   - Confirmar que os links gerados apontam para o número `5566999955881` e abrem em nova aba.