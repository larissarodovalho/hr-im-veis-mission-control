Atualizar o número de WhatsApp do site para **66 99951-5883**.

Alteração única em `src/lib/whatsapp.ts`:
- `WHATSAPP_PHONE` muda de `"5566999955881"` para `"5566999515883"`.

Isso já propaga automaticamente para:
- Botão verde flutuante do WhatsApp (`SiteLayout.tsx`)
- Botão "Falar com a equipe" na página de Contato (`ContatoPage.tsx`)
- Qualquer outro lugar que use `createWhatsAppUrl` / `openWhatsApp`

Nenhuma outra mudança necessária.