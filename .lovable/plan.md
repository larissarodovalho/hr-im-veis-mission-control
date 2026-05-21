## Problema

No card de imóvel em `src/pages/site/ImoveisPage.tsx` (linha 531), o botão "Solicitar visita" chama:

```tsx
onClick={(event) => { event.preventDefault(); event.stopPropagation(); openWhatsApp(event, msg); }}
```

A função `openWhatsApp` em `src/lib/whatsapp.ts` faz `if (event?.defaultPrevented) return;` logo no início. Como `preventDefault()` é chamado antes, `openWhatsApp` retorna sem abrir nada — o botão fica inerte.

## Correção

Em `src/pages/site/ImoveisPage.tsx`, no `onClick` do botão "Solicitar visita":

- Remover `event.preventDefault()` (não é necessário — é um `<button type="button">`, não tem ação padrão de navegação).
- Manter `event.stopPropagation()` para que o clique não dispare a navegação do card clicável.

Resultado:
```tsx
onClick={(event) => { event.stopPropagation(); openWhatsApp(event, `Olá! Tenho interesse no imóvel ${im.codigo} - ${im.nome}`); }}
```

## Validação

- Recarregar `/imoveis` no preview.
- Clicar em "Solicitar visita" em um card → deve abrir o WhatsApp com a mensagem pré-preenchida em nova aba.
- Clicar no restante do card → ainda navega para `/imovel/:id`.
- O botão "Solicitar visita" na página de detalhe (`ImovelDetalhePage.tsx`) já está correto e não precisa de mudança.
