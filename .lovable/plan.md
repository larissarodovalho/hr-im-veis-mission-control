## Diagnóstico

O número `5566999515883` está correto (55 país + 66 DDD + 9 dígitos) e abre normal no `wa.me` direto no navegador. Então o problema **não é o número** — é o comportamento do clique no site.

Hoje, os botões de WhatsApp (botão verde flutuante e "Falar com a equipe") usam um `<a target="_blank" href="wa.me/...">` **e** ainda chamam um `onClick` que dispara `window.open(...)` em paralelo. Esse `window.open` chamado dentro do clique é frequentemente bloqueado por bloqueador de pop-up (especialmente em mobile/Safari), e quando ele "tem sucesso" ele chama `preventDefault()` — cancelando o link nativo. Resultado: em vários navegadores nada abre.

## Correção

Em `src/lib/whatsapp.ts`:
- Remover a função `openWhatsApp` (ou deixá-la como no-op para compatibilidade) — não precisamos abrir manualmente.
- O link `<a href={createWhatsAppUrl(...)} target="_blank" rel="noopener noreferrer">` já abre o WhatsApp sozinho, de forma nativa e sem ser bloqueado.

Em `src/components/site/SiteLayout.tsx` e `src/pages/site/ContatoPage.tsx`:
- Tirar o `onClick={(e) => openWhatsApp(e, ...)}` dos botões.
- Manter apenas o `href`, `target="_blank"` e `rel="noopener noreferrer"`.

Nenhuma mudança no número e nenhuma outra alteração visual.

## Resultado esperado

Clicar no botão verde flutuante ou em "Falar com a equipe" abre o WhatsApp Web no desktop e o app do WhatsApp no celular, em todos os navegadores, sem bloqueio de pop-up.
