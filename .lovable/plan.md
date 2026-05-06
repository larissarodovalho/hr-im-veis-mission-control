## Tornar a saudação da Sofia mais cordial

Ajuste pequeno e pontual no prompt da Sofia (WhatsApp) para que a primeira mensagem expresse cordialidade e que o pedido do nome venha justificado como "para melhor atendê-lo".

### Alterações em `supabase/functions/whatsapp-webhook/index.ts`

1. **Passo 1 do prompt (linhas 53-56)** — substituir a saudação atual por uma versão mais cordial:

   De:
   > "Olá! Sou a Sofia, da HR Imóveis. Para começar, qual seu nome completo?"

   Para:
   > "Olá! Sou a Sofia, da HR Imóveis. É um prazer falar com você! Para que eu possa te atender da melhor forma, pode me dizer seu nome e sobrenome?"

   E ajustar a instrução de fallback: se vier só o primeiro nome, continuar pedindo o sobrenome com tom gentil ("Obrigada! E qual é seu sobrenome?").

2. **Mensagem de fallback hard-coded (linha 621)** — atualizar para o mesmo texto cordial, mantendo coerência caso o modelo falhe e o sistema mande a saudação inicial diretamente.

### Sem outras mudanças

- Fluxo dos Passos 2, 3 e 4 permanece igual (celular → interesse → handoff agendar/falar agora).
- Tools (`update_lead_info`, `send_booking_link`, `request_immediate_contact`) inalteradas.
- `public-chat` (Helena) não precisa de mudança — usuário pediu apenas Sofia. (Posso replicar se quiser, é só avisar.)

### Deploy

Redeploy de `whatsapp-webhook`.
