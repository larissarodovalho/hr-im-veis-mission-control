Diagnóstico encontrado:
- O cron automático está ativo e roda a cada 2 minutos.
- O usuário Hans existe no CRM, mas não tem conexão registrada com Google Calendar em `user_google_calendar`.
- Hoje só há 1 conta Google conectada, e ela não é a do Hans.
- A função `gcal-pull` também registrou estouro de CPU recentemente, então vale endurecer a sincronização para não travar quando houver muitos eventos.

Plano de ação:
1. Confirmar conexão do Hans
   - Garantir que Hans conecte a conta Google dele pelo botão de integração dentro do CRM.
   - Após conectar, a tabela de conexão deve registrar o `user_id` do Hans e `calendar_id = primary`.

2. Melhorar a função `gcal-pull`
   - Fazer a sincronização ignorar usuários sem conexão sem travar a rotina geral.
   - Limitar a primeira busca sem `sync_token` a uma janela segura de eventos futuros, para evitar estouro de CPU.
   - Manter o cron automático chamando todos os usuários conectados.
   - Preservar a regra já ajustada para não importar eventos recorrentes como vários agendamentos diários.

3. Adicionar retorno de diagnóstico na sincronização manual
   - Quando o usuário clicar em “Sincronizar agora”, mostrar se a conta Google não está conectada, se importou eventos, se atualizou eventos ou se deu erro.
   - Isso evita a impressão de que sincronizou quando na verdade o usuário ainda não conectou a agenda.

4. Validar depois da implementação
   - Verificar que Hans aparece em `user_google_calendar` após conectar.
   - Rodar a sincronização do Hans individualmente.
   - Confirmar se o novo agendamento aparece em `/crm/agenda`.
   - Confirmar que o cron continua ativo para próximas sincronizações automáticas.