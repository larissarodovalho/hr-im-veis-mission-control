## Plano para corrigir o erro “A conexão com wa.me foi recusada”

1. **Remover a navegação forçada dentro do iframe**
   - O erro acontece porque o código atual tenta abrir `wa.me` usando `_top`, fazendo o preview tentar carregar o WhatsApp dentro da própria janela/iframe.
   - `wa.me` recusa carregamento em iframe, então a correção é não usar `_top` nem `window.top.location`.

2. **Voltar para link externo nativo em nova aba**
   - Manter os anchors com `href`, `target="_blank"` e `rel="noopener noreferrer"`.
   - Ajustar `openWhatsApp` para abrir apenas com `_blank` quando necessário, sem `preventDefault` em casos onde o navegador pode cuidar do clique nativamente.

3. **Simplificar o helper de WhatsApp**
   - Manter `createWhatsAppUrl()` gerando `https://wa.me/5566999955881?text=...`.
   - Fazer `openWhatsApp()` ser compatível com cliques reais do usuário e com fallback seguro, sem tentar carregar o WhatsApp no preview.

4. **Validar após aplicar**
   - Procurar por qualquer uso restante de `_top`, `window.top.location`, `api.whatsapp.com` ou interceptação problemática.
   - Rodar checagem TypeScript/build para confirmar que não há erros de export/import.
   - Confirmar que os botões continuam apontando para o número `5566999955881` em nova aba.