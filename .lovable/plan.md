## Plano — Sofia explica o que fazer ao receber o link de agendamento

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Hoje, ao disparar `send_booking_link`, a Sofia responde algo curto tipo "Combinado, Larisse, em que mais pode te ajudar?" sem explicar o que o lead deve fazer no link. Precisamos garantir que ela sempre explique o passo a passo.

### Mudanças

1. **Prompt (Passo 3, agendar) — linha 66**
   Trocar a instrução para deixar explícito o texto que ela deve enviar antes do link, com passo a passo claro conforme o formato escolhido (videochamada / presencial / ligação / WhatsApp). Exemplo:
   - Presencial: "Perfeito, [Nome]! Vou te enviar agora um link. Quando clicar, é só escolher o melhor dia e horário para você vir até o nosso escritório conversar pessoalmente com o Hans."
   - Videochamada: "...escolher o melhor dia e horário para sua videochamada com o Hans. No horário marcado você recebe o link da chamada."
   - Ligação: "...escolher o melhor dia e horário para o Hans te ligar."
   - WhatsApp: "...escolher o melhor dia e horário para o Hans te chamar aqui no WhatsApp."

2. **Fallback no código — linha 689**
   O `reply` padrão (quando o modelo não escreve nada) também precisa orientar o lead. Trocar a frase genérica por uma versão por `kind`, com instrução "clique no link abaixo e escolha o melhor dia e horário para [contexto da reunião]".

3. **Regra anti-loop / mensagem pós-link**
   Adicionar regra: após o link ser enviado, a próxima mensagem da Sofia (se o lead só agradecer) deve ser de encerramento amigável, sem repetir explicação nem reenviar link.

Sem mudanças em schema, tools ou lógica de banco.
