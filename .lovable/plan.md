# Tornar os títulos do CRM mais legíveis

## Objetivo
Os títulos internos do CRM estão com `font-weight: 300` (Montserrat Light), o que deixa a escrita fina e difícil de ler. Aumentar o peso dos títulos para melhorar a legibilidade, **somente na área interna do CRM**. O site público (hrimoveis.com) mantém o visual fino atual.

## Escopo confirmado
- Área: **somente CRM interno** (Dashboard, Leads, Contas, Oportunidades, Relatórios, Carteira, etc.)
- Ajuste: **apenas títulos finos (peso 300)**. Não mexer em rótulos pequenos nem na cor muted.

## O que existe hoje
Em `src/index.css`:
```css
h1, h2, h3, h4 {
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 300;          /* fino */
  @apply tracking-tight;
}
.section-title {
  @apply text-2xl tracking-tight text-foreground;
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 300;          /* fino */
}
```
Esses dois blocos afetam todos os títulos do CRM. As páginas do site público (`src/pages/site/*`) usam `font-light` explicitamente em cada elemento, então continuarão finas independentemente desta mudança.

## Mudança
Em `src/index.css`:
1. `h1, h2, h3, h4`: alterar `font-weight: 300` → `font-weight: 500` (Montserrat Medium).
2. `.section-title`: alterar `font-weight: 300` → `font-weight: 500`.

Nenhuma outra alteração. Os pesos 400–800 já estão importados no `@import` do Google Fonts no topo do arquivo.

## Verificação
- Abrir o CRM (Dashboard / Leads / Contas) no preview e confirmar que os títulos ficaram mais encorpados e legíveis.
- Confirmar que o site público (Home/Imóveis) continua com o visual fino, sem regressão.
