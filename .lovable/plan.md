## Objetivo

Alterar a mensagem pré-preenchida enviada quando o visitante clica em um botão de WhatsApp no site público.

## Mudanças

**Mensagem geral** (botão flutuante, rodapé/cabeçalho e página de contato):
- De: `Olá! Gostaria de mais informações.`
- Para: `Olá, tudo bem? Quero falar com um corretor de imóveis.`

**Mensagem da página do imóvel** (mantendo a referência ao código do imóvel):
- De: `Olá! Gostaria de mais informações sobre o imóvel {codigo}`
- Para: `Olá, tudo bem? Quero falar com um corretor de imóveis sobre o imóvel {codigo}.`

## Arquivos a editar

- `src/components/site/SiteLayout.tsx` (botão flutuante)
- `src/pages/site/HomePage.tsx`
- `src/pages/site/ContatoPage.tsx`
- `src/pages/site/ImovelDetalhePage.tsx`

Sem alterações em backend, banco de dados ou lógica — apenas o texto da mensagem.