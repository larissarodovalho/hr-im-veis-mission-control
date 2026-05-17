## Problema

Hoje, depois que a Sofia já mandou um link de agendamento uma vez, a flag `alreadyBooked` trava `canTriggerHandoff = false` para sempre. Se o lead pedir o link de novo ("perdi o link", "me manda de novo", "manda o link da reunião"), a Sofia responde só com "Combinado, qualquer dúvida me chama" — não reenvia.

Também: o atalho determinístico que criei só dispara se a última mensagem da Sofia foi a pergunta do Passo 3. Quando o lead pede o link dias depois, esse padrão não casa, então também não funciona.

## Plano

Mexer só em `supabase/functions/whatsapp-webhook/index.ts`:

1. **Detectar pedido de reenvio**: criar uma regex `isAskingLinkAgain` que casa com frases típicas:
   - "manda (de novo|outra vez) o link"
   - "perdi o link"
   - "reenvia/reenviar/envia de novo"
   - "não recebi o link"
   - "qual era o link"
   - "manda o agendamento/o link da reunião"

2. **Reaproveitar o último kind**: olhar no histórico a última mensagem outbound que contém `/agendar/` e extrair o tipo dela:
   - se tem "videochamada" no texto → `presencial`/`videochamada`/`ligação`/`whatsapp` conforme o BOOKING_INSTRUCTIONS já enviado.
   - fallback: buscar na tabela `booking_links` o último registro daquela `conversation_id` e usar o `kind` dele.

3. **Permitir o reenvio**:
   - Se `isAskingLinkAgain` for true, ignorar `alreadyBooked` no cálculo de `canTriggerHandoff`.
   - Forçar `forcedBookingKind` com o kind detectado (ou perguntar formato se não der pra detectar).
   - Gerar um NOVO token e inserir nova linha em `booking_links` (mantém histórico).

4. **Mensagem curta**: na hora de montar `reply` quando é reenvio, usar um texto mais enxuto: "Claro, [Nome]! Aqui está o link de novo:" + link, em vez da explicação longa do BOOKING_INSTRUCTIONS.

5. **Se não conseguir detectar o kind**: cair no fluxo normal e a Sofia pergunta "Qual formato você prefere?" — sem repetir saudação.

## Detalhes técnicos

- Arquivo único: `supabase/functions/whatsapp-webhook/index.ts`.
- Adicionar logo após o cálculo de `alreadyBooked`:
  ```ts
  const isAskingLinkAgain = /(manda|envia|reenvi|mandar|enviar).{0,20}(link|agendamento)|perdi.{0,10}(link|agendamento)|n[ãa]o recebi.{0,15}link|qual.{0,5}(era|foi).{0,5}link/i.test(content || "");
  ```
- Quando `isAskingLinkAgain`: buscar último `booking_links` da conversa (`select kind from booking_links where conversation_id = conv.id order by created_at desc limit 1`).
- Permitir o disparo: `const canTriggerHandoff = (hasName || conversationCoveredName) && (hasInterest || conversationCoveredInterest) && !alreadyNotified && (!alreadyBooked || isAskingLinkAgain);`
- No bloco do `bookingKind` (perto da linha onde monta `reply` antes do link), se `isAskingLinkAgain` for true, sobrescrever `reply` com a versão curta antes de anexar o link.

Não mudar: prompt do sistema, página `/agendar`, schema de banco.
