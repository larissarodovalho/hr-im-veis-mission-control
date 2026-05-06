Vou corrigir o fluxo de ponta a ponta para que todo agendamento solicitado por WhatsApp/Sofia e pela página de captura fique visível no CRM, nas abas corretas.

O que encontrei na varredura:
- O WhatsApp/Sofia gera `booking_links` corretamente, mas os registros internos criados pelo `booking-confirm` ficam sem `created_by` e podem ficar sem `corretor_id` quando o lead não tem corretor atribuído. Isso pode impedir a visualização por usuários não-admin e deixa a sincronização frágil.
- Ligações confirmadas pelo link vão para `ligacoes`, mas a Agenda do CRM hoje só escuta `reunioes`. Assim, ligações agendadas não aparecem na Agenda geral.
- A aba de detalhe do lead ainda agenda ligação dentro de `reunioes`, enquanto a aba Ligações lê `ligacoes`. Isso mantém dois padrões diferentes no CRM.
- A “página de captura” está anunciada em Configurações como `/captura`, mas não existe rota React `/captura` no app. Existe apenas a função `public-chat`, então a captura pública não está realmente integrada a uma página navegável.
- A função `public-chat` salva lead e retorna `show_calendar`/`appointment_kind`, mas não cria `booking_links`, nem cria registros em `reunioes`/`ligacoes`; portanto o pedido de agendamento da captura pode ficar só como observação do lead.

Plano de ajuste:

1. Blindar a confirmação de agendamento do WhatsApp/Sofia
- Atualizar `supabase/functions/booking-confirm/index.ts` para resolver um responsável padrão:
  - usar `leads.corretor_id` quando existir;
  - se não existir, usar um usuário staff/admin ativo como fallback;
  - preencher também `created_by` nos registros criados.
- Manter o roteamento correto:
  - `presencial` e `videochamada` -> `reunioes`;
  - `ligacao` -> `ligacoes`;
  - `whatsapp` -> `interacoes`.
- Registrar histórico/interação no lead após a confirmação, para deixar rastreável que o agendamento veio da Sofia.
- Melhorar logs de erro do `booking-confirm` para identificar se falhou ao criar reunião, ligação ou interação.

2. Fazer a Agenda mostrar ligações agendadas também
- Atualizar `src/pages/Schedule.tsx` para carregar tanto `reunioes` quanto `ligacoes`.
- Exibir ligações agendadas no calendário/agenda com ícone e tipo “Ligação”.
- Assinar realtime também da tabela `ligacoes`, para aparecer sem recarregar.
- Ajustar conflito de horário público para considerar reuniões e bloqueios; e, se necessário, considerar ligações agendadas como ocupação também.

3. Unificar o padrão de ligação no detalhe do lead
- Atualizar `src/pages/LeadDetail.tsx` para que quando o usuário agenda uma “Ligação”, o registro seja criado em `ligacoes` e não em `reunioes`.
- Manter reuniões presenciais/virtuais em `reunioes`.
- No detalhe do lead, mostrar os agendamentos de reunião e as ligações agendadas/registradas de forma consistente.

4. Criar a página pública `/captura` e conectá-la ao CRM
- Adicionar a rota `/captura` no `src/App.tsx`.
- Criar uma página pública de captura usando a função `public-chat` existente.
- A página terá chat com a assistente, coleta de nome/telefone/interesse e, quando houver intenção de agendar, mostrará ação clara para escolher horário.

5. Integrar a captura pública ao mesmo mecanismo de agendamento interno
- Atualizar `supabase/functions/public-chat/index.ts` para, quando tiver `lead_id` e `appointment_kind`, criar um `booking_link` interno igual ao fluxo da Sofia.
- Mapear tipos da captura:
  - `visita` -> `presencial` em `reunioes`;
  - `videochamada` -> `videochamada` em `reunioes`;
  - `ligacao` -> `ligacao` em `ligacoes` após confirmação.
- Retornar `booking_url` para a página `/captura`, para o cliente escolher data/horário pelo fluxo `/agendar/:token` já existente.
- Evitar duplicar links na mesma sessão quando já houver link aberto recente.

6. Corrigir dados antigos que ficaram incompletos
- Criar uma migração segura para preencher `created_by`/`corretor_id` em `reunioes` e `ligacoes` antigas quando estiverem nulos e houver lead relacionado.
- Para registros sem corretor no lead, usar um staff/admin ativo como fallback.
- Isso ajuda os agendamentos existentes a aparecerem corretamente para o CRM.

7. Testes e verificação
- Testar a função `booking-info` com token válido.
- Testar `booking-confirm` para `presencial`, `videochamada` e `ligacao`.
- Conferir no banco se:
  - reuniões entram em `reunioes`;
  - ligações entram em `ligacoes`;
  - links usados ficam com `used_at` e referência interna;
  - registros têm `created_by`/`corretor_id` preenchidos.
- Verificar no código que Agenda, Reuniões, Ligações e detalhe do lead leem as tabelas corretas.

Arquivos previstos:
- `supabase/functions/booking-confirm/index.ts`
- `supabase/functions/public-chat/index.ts`
- `src/App.tsx`
- nova página `src/pages/CapturaPage.tsx`
- `src/pages/Schedule.tsx`
- `src/pages/LeadDetail.tsx`
- possível migração em `supabase/migrations/...sql`

Resultado esperado:
- Link enviado pela Sofia confirma e sincroniza automaticamente no CRM.
- Reunião presencial e videochamada aparecem em Reuniões e Agenda.
- Ligação aparece em Ligações e também na Agenda geral.
- Captura pública `/captura` passa a existir e cria leads/agendamentos pelo mesmo fluxo interno.
- Registros ficam vinculados a lead e responsável, evitando sumiço por regra de visualização.