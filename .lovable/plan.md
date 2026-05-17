Plano para corrigir definitivamente o erro do link:

1. Ajustar a chamada da página `/agendar/:token`
   - Remover o header `cache-control` enviado pelo frontend nas chamadas para `booking-info`, porque ele força preflight CORS no navegador mobile.
   - Manter `cache: "no-store"` e o parâmetro `_t` na URL para evitar cache sem criar bloqueio CORS.

2. Reforçar CORS nas funções de agendamento
   - Atualizar `booking-info` e `booking-confirm` para aceitar explicitamente `cache-control` nos headers permitidos, evitando quebra caso algum navegador/proxy ainda envie esse header.

3. Fazer o link antigo abrir corretamente
   - Manter compatibilidade com os links já gerados, sem trocar token nem pedir para o lead solicitar outro link.
   - Validar com o token mais recente que o backend retorna agenda e horários.

4. Publicar as funções afetadas
   - Publicar novamente `booking-info` e `booking-confirm` após o ajuste.