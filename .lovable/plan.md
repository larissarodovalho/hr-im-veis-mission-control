## Atualizar contato do site para (66) 99995-5881

### 1. Substituir número antigo pelo novo
Trocar todas as ocorrências no site público:
- `(66) 99999-0000` → `(66) 99995-5881` (exibição)
- `5566999990000` → `5566999955881` (links `wa.me/`)

Arquivos afetados (somente site público):
- `src/components/site/SiteLayout.tsx` (rodapé)
- `src/pages/site/ContatoPage.tsx` (info + CTA WhatsApp)
- `src/pages/site/HomePage.tsx` (CTA WhatsApp)
- `src/pages/site/SobrePage.tsx` (CTA WhatsApp)
- `src/pages/site/ImoveisPage.tsx` (CTAs WhatsApp)
- `src/pages/site/ImovelDetalhePage.tsx` (CTAs WhatsApp)

### 2. Botão flutuante de WhatsApp
Adicionar em `src/components/site/SiteLayout.tsx` um botão fixo no canto inferior direito, visível em todas as páginas do site:
- Ícone do WhatsApp (lucide `MessageCircle` estilizado em verde do WhatsApp `#25D366`)
- `position: fixed`, canto inferior-direito, com sombra suave e leve animação de pulse
- Link para `https://wa.me/5566999955881?text=Olá! Gostaria de mais informações.`
- `target="_blank"` + `rel="noopener noreferrer"`
- `aria-label="Falar no WhatsApp"`
- Z-index acima do conteúdo, mas abaixo do menu mobile aberto

### Fora do escopo
- Telas do CRM/admin
- Placeholder do componente `WhatsAppTab` (config interna)
