## Objetivo
Quando o lead pedir contato imediato (via Sofia no WhatsApp ou chat do site), além do email que já é disparado para os admins, enviar também uma **mensagem de WhatsApp** para o Hans avisando que tem lead quente esperando.

## Onde mexer
Tudo no edge function **`supabase/functions/notify-immediate-contact/index.ts`** (único ponto chamado tanto pelo `whatsapp-webhook` quanto pelo `public-chat`). Sem mudanças no frontend.

## Mudanças

1. **Buscar telefones dos admins** junto com os emails
   - Hoje a função puxa `email, nome` de `profiles` dos `user_roles.role = 'admin'`.
   - Passar a puxar também `telefone`.
   - Fallback: se nenhum admin tiver telefone, usar número fixo do Hans (mesmo padrão do fallback do email `larissadefreitas@hotmail.com`). Vou precisar **perguntar para a Larissa qual número WhatsApp do Hans usar como fallback**.

2. **Montar mensagem curta para WhatsApp**
   ```
   🔥 Lead quente pedindo contato AGORA
   Nome: {leadName}
   Telefone: {leadPhone}
   Canal preferido: {contactKind} (videochamada / presencial / ligação / whatsapp)
   Interesse: {interest}
   Abrir lead: {leadUrl}
   ```

3. **Disparar via `whatsapp-send`** (função interna já usada pela Sofia)
   - Para cada admin com `telefone`, chamar `supabase.functions.invoke("whatsapp-send", { body: { phone, message } })`.
   - Não bloquear a resposta — usar `Promise.allSettled` e logar erro se algum envio falhar.
   - Manter idempotência simples: incluir `lead.id` no texto evita duplicação visual; não criar tabela nova.

4. **Manter o envio de email** exatamente como está hoje (não mexer no template).

5. **Retorno da função**
   - Continuar respondendo `{ ok: true, sent: [...] }`, agora incluindo também `{ whatsapp: [...] }` com status de cada envio para fins de debug nos logs.

## Detalhes técnicos
- Normalizar número antes de mandar pro `whatsapp-send` (mesmo padrão já usado em `lead-followup-ia`: só dígitos, prefixar `55` se faltar).
- Não precisa migration, não precisa secret novo (já temos `EVOLUTION_*`).
- Deploy: republicar apenas `notify-immediate-contact`.

## Pergunta antes de implementar
Qual número de WhatsApp do Hans devo usar como **fallback** caso nenhum admin tenha telefone cadastrado no perfil? (formato: `+55 11 9XXXX-XXXX`)
