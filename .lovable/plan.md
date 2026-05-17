## Diagnóstico

A página de agendamento está funcionando — desktop carrega normalmente. O motivo de "tela branca no celular" é que o link enviado pelo WhatsApp aponta para `www.hrimoveis.com` (site publicado), e a versão publicada ainda não tem as últimas correções da página `/agendar/:token` que fiz agora.

Mudanças no frontend (UI) só vão pro ar quando você clica em **Publish → Update** no canto superior direito. Mudanças em edge functions vão automáticas — por isso o link novo é gerado certinho, mas a página que recebe o link no celular ainda está com a versão antiga.

## Plano

1. **Republicar o app** — clicar em **Publish → Update** para subir a versão atualizada da página `/agendar` (com tratamento de erros que evita tela em branco).

2. **Reforço extra na página** (mexer no código):
   - Adicionar um *error boundary* específico em `/agendar/:token` para garantir que qualquer crash de JS no celular mostre uma mensagem em vez de branco total.
   - Forçar `no-cache` na requisição de slots, evitando que celular use uma resposta antiga ruim do cache.
   - Adicionar uma checagem visual de "carregando demais" (timeout de 15s) → se passar disso, mostrar mensagem pedindo para recarregar ou pedir novo link.

3. **Validar no celular real** depois do republish:
   - Pedir pra Larissa (ou você) reabrir o link no celular.
   - Se ainda branco, te peço um screenshot e os logs do navegador.

Não vou mexer em nada de banco nem de função do WhatsApp — o link em si já está sendo gerado certo.