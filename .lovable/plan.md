Plano proposto:

1. Confirmar o ponto de falha atual
- O backend está saudável.
- Não existe nenhum lead recente com origem `meta_ads`.
- Não existe nenhum registro recente em `activity_log` do tipo `lead_meta`.
- O diagnóstico da Meta mostra token OK, página correta, app inscrito em `leadgen` e 1 formulário ativo.
- Portanto, o problema mais provável é: a Meta ainda não está chamando o webhook do CRM, ou está chamando uma URL/ambiente diferente.

2. Melhorar o webhook para deixar rastros claros
- Atualizar `meta-leadgen-webhook` para registrar no `activity_log` toda chamada recebida:
  - verificação GET da Meta;
  - POST recebido;
  - assinatura inválida;
  - payload sem `leadgen`;
  - erro ao buscar dados do lead na Meta;
  - erro ao inserir no CRM;
  - lead inserido com sucesso.
- Isso vai permitir diferenciar claramente “a Meta não chamou” de “a Meta chamou, mas falhou ao processar”.

3. Criar um teste de saúde do webhook
- Adicionar uma função protegida `meta-webhook-health` para testar o endpoint com o token correto sem expor segredo no navegador.
- Ela vai confirmar se o webhook responde corretamente ao handshake usado pela Meta e retornar a URL exata que deve estar configurada no painel da Meta.

4. Atualizar a tela Configurações → Meta Lead Ads
- Adicionar um botão “Testar webhook”.
- Mostrar a URL correta do webhook para conferência manual na Meta.
- Mostrar um alerta objetivo:
  - se o webhook local responde OK, mas nenhum POST chega após usar o Lead Ads Testing Tool, a URL configurada na Meta está diferente ou o app/ambiente da Meta não está enviando eventos para este backend;
  - se o POST chega, mostrar o erro real de processamento.

5. Resultado esperado
- Depois de usar o Lead Ads Testing Tool, a aba Configurações deve mostrar se chegou alguma chamada da Meta.
- Se chegou, eu corrijo o erro de gravação conforme o log.
- Se não chegou, a correção será ajustar a Callback URL no Webhook da Meta para a URL exibida pelo CRM.