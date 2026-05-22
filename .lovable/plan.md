## Objetivo
Escurecer o hero da página inicial (seção "Seu novo lar começa aqui") com um filtro escuro semi-transparente, mantendo o imóvel visível ao fundo.

## Mudança
No arquivo `src/pages/site/HomePage.tsx`, na seção hero, adicionar uma camada escura sobre a imagem além do gradiente já existente:

- Hoje há apenas um gradiente de baixo para cima (`from-[#050505] via-[#050505]/50 to-transparent`) — a parte superior fica clara.
- Adicionar um overlay uniforme `bg-black/35` cobrindo toda a imagem, para escurecer de forma homogênea sem esconder o imóvel.

Resultado: a imagem do imóvel continua visível, mas com um "filtro" escurecido que dá mais contraste para o texto branco.

## Observação
Mudança aplicada apenas ao hero da Home — outras páginas (Imóveis, Contato, Sobre) ficam como estão.