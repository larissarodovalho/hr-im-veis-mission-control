## Diagnóstico
Verifiquei os logs: `send-transactional-email` **não foi chamado nem uma vez** e não há nenhum registro de envio. O `admin-create-user` tentou disparar via `admin.functions.invoke(...)`, mas o cliente Supabase service-role criado dentro de uma edge function não propaga corretamente o token nessa chamada — ela falha silenciosamente e o `try/catch` engole o erro.

## Correção

Trocar a invocação interna por um **`fetch` direto** ao endpoint `/functions/v1/send-transactional-email`, autenticado com o `SUPABASE_SERVICE_ROLE_KEY` (padrão recomendado para chamadas server-to-server entre edge functions).

Mudanças em `supabase/functions/admin-create-user/index.ts`:
- Substituir `admin.functions.invoke("send-transactional-email", …)` por:
  ```ts
  await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
    },
    body: JSON.stringify({ templateName: "user-welcome", recipientEmail: email, idempotencyKey: `user-welcome-${newId}`, purpose: "transactional", templateData: { nome, email, senha: password, loginUrl } }),
  });
  ```
- Logar `console.log` antes/depois com `status` da resposta para facilitar debug futuro.
- Manter best-effort: se falhar, o usuário ainda é criado e o admin vê a senha na tela.

Após editar, faço o redeploy do `admin-create-user`.

## Verificação
Após o redeploy, ao cadastrar um novo usuário:
1. Olho os logs de `admin-create-user` para confirmar que o fetch retornou 200.
2. Olho `email_send_log` para ver o registro `pending → sent`.
3. Caso `pending` fique parado, é problema do queue/DNS — aí investigo `process-email-queue` e status do domínio.

## Fora do escopo
- Reenviar o e-mail para o Hans (já criado) — posso fazer manualmente depois com `curl_edge_functions` se quiser.