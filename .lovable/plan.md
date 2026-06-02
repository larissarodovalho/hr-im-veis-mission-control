Plano para confirmar e corrigir o recebimento de leads do Meta:

1. Criar função backend para disparar lead de teste
- Adicionar `meta-create-test-lead`.
- Receber um `form_id` validado.
- Chamar a API da Meta em `POST /{form_id}/test_leads` usando o `META_PAGE_ACCESS_TOKEN` já configurado.
- Retornar o resultado da Meta e uma mensagem clara de sucesso/erro.

2. Criar função backend para forçar inscrição do webhook
- Adicionar `meta-force-subscribe`.
- Chamar `POST /1095453883642999/subscribed_apps?subscribed_fields=leadgen` com o token da página.
- Retornar se a página ficou inscrita no campo `leadgen`.

3. Melhorar o diagnóstico existente
- Atualizar `meta-debug-subscription` para mostrar com mais clareza quais apps estão inscritos na página e quais campos cada app recebe.
- Manter a verificação atual de token, página, inscrição e formulários.

4. Atualizar a tela Configurações → Meta Lead Ads
- Adicionar botão “Forçar inscrição”.
- Adicionar botão “Disparar lead de teste” ao lado dos Form IDs encontrados no diagnóstico.
- Mostrar feedback visual: sucesso, erro da Meta, ou aviso de que a inscrição ainda não chegou ao app correto.
- Após disparar o teste, orientar a conferir a aba Leads; se possível, mostrar uma mensagem dizendo que o webhook pode levar alguns segundos.

5. Resultado esperado
- Se o lead de teste aparecer na aba Leads: o webhook e o CRM estão funcionando; o problema dos cadastros reais é o app da Meta ainda estar em modo desenvolvimento/permissões.
- Se o lead de teste não aparecer: vamos saber que a página ainda está inscrita no app errado ou que a Meta não está chamando o endpoint.