## Objetivo
Refinar a linguagem da Sofia (assistente do WhatsApp) para ser **simples, sem gírias e sem emoji**, removendo a palavra "Show" e símbolos como 👇 🚀 🔥.

## O que muda
Arquivo único: `supabase/functions/whatsapp-webhook/index.ts` — bloco `AI_SYSTEM` (linhas ~45-116).

### Regras de tom (linha 63)
- Antes: "Sem listas, sem numerações. No máximo 1 emoji por mensagem."
- Depois: "Sem listas, sem numerações. **Não use emojis.** Não use gírias (ex.: 'show', 'top', 'massa', 'beleza', 'bora'). Use linguagem simples e cordial."

### Exemplos no fluxo
- Linha 90 (agendar): trocar  
  `"Show! Te mando aqui o link pra escolher o melhor dia e horário 👇"`  
  por `"Perfeito! Te envio o link para você escolher o melhor dia e horário."`
- Linha 92 (agora): trocar  
  `"Show! Já avisei o Hans, ele vai te chamar agora mesmo 🚀"`  
  por `"Pronto! Já avisei o Hans, ele vai te chamar agora mesmo."`
- Linha 101 (urgência): trocar  
  `"Show, já vou avisar o Hans! Pra ele te chamar..."`  
  por `"Certo, já vou avisar o Hans. Para ele te chamar, você prefere por videochamada, ligação, presencial ou WhatsApp?"`

### Marcador de urgência interno (linha 97)
Remover o emoji `🔥` do cabeçalho da regra (mantém o texto "URGÊNCIA DETECTADA CEDO"). É instrução interna, não vai pro lead, mas evita que o modelo "imite" o emoji.

## Deploy
Após editar, redeployar `whatsapp-webhook`. Conversas em andamento já passam a usar o novo tom na próxima mensagem (o prompt é enviado a cada chamada).

## Fora de escopo
- Helena (chat público do site) — não foi pedido alterar.
- Templates de e-mail — não usam essas expressões.
