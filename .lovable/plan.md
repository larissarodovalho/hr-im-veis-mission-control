## Contexto
Na página inicial (`HomePage`), na seção "Quer comprar um imóvel? / Quer vender seu imóvel?", os botões principais "Fale com um consultor" e "Quero vender meu imóvel" atualmente redirecionam para a página `/contato`. O usuário quer que esses botões abram diretamente o WhatsApp, igual ao botão flutuante verde que já está funcionando.

## Alterações

### 1. Botão "Fale com um consultor" (seção comprar)
- Substituir o `Link` para `/contato` por uma tag `<a>` nativa.
- `href` apontando para `createWhatsAppUrl("Olá, tudo bem? Quero falar com um corretor de imóveis.")`
- `onClick` chamando `openWhatsApp(event, "Olá, tudo bem? Quero falar com um corretor de imóveis.")`
- `target="_blank"` e `rel="noopener noreferrer"`
- Manter todos os estilos atuais (classes Tailwind)
- Transformar o botão secundário "WhatsApp" existente em um botão "Contato" que leva para `/contato` (inversão de funções)

### 2. Botão "Quero vender meu imóvel" (seção vender)
- Substituir o `Link` para `/contato` por uma tag `<a>` nativa.
- `href` apontando para `createWhatsAppUrl("Olá, tudo bem? Quero vender meu imóvel.")`
- `onClick` chamando `openWhatsApp(event, "Olá, tudo bem? Quero vender meu imóvel.")`
- `target="_blank"` e `rel="noopener noreferrer"`
- Manter todos os estilos atuais

### Arquivos alterados
- `src/pages/site/HomePage.tsx` (linhas ~404-410 e ~442-448)

## Notas técnicas
- Usar a função `openWhatsApp` e `createWhatsAppUrl` já importadas de `@/lib/whatsapp`.
- Preservar animações e estilos existentes (transições Tailwind, ícone `ArrowRight`).