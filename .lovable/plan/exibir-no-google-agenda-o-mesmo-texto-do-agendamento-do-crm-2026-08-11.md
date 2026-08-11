# Exibir no Google Agenda o mesmo texto do agendamento do CRM

## Diagnóstico confirmado

- O envio de reuniões ao Google usa `reunioes.titulo` como nome do evento e, quando esse campo está vazio, substitui por **“Reunião — HR Imóveis”**.
- Alguns pontos do CRM, como o agendamento dentro do lead e o atalho dentro da conta, salvam o que foi escrito somente em `notas` e não preenchem `titulo`.
- Há registros confirmados no banco em que o texto digitado está em `notas`, mas o título sincronizado ficou como “Reunião — HR Imóveis”.

## O que será feito

1. **Padronizar o título no momento do agendamento**
   - Nos formulários de lead, conta e demais atalhos de agenda, salvar a atividade digitada também como título do compromisso.
   - Manter detalhes complementares em notas/descrição, sem perder informação.

2. **Corrigir a montagem do evento enviado ao Google**
   - Para reuniões, usar nesta ordem: título preenchido, texto da atividade/notas e, por último, um nome contextual com o cliente vinculado.
   - Remover o fallback genérico “Reunião — HR Imóveis” quando houver texto escrito no CRM.
   - Aplicar a mesma regra de conteúdo útil aos demais tipos sincronizados — ligação, visita e captação — usando a descrição registrada e o cliente/imóvel quando disponíveis.

3. **Manter criação e edição sincronizadas**
   - Ao criar ou editar um compromisso no CRM, enviar imediatamente ao Google o mesmo título visível na agenda interna.
   - Preservar data, horário, local, link, responsável e descrição já sincronizados hoje.

4. **Corrigir compromissos futuros já existentes**
   - Reprocessar os eventos futuros originados no CRM que estão com título vazio/genérico, atualizando os eventos já vinculados no Google sem criar cópias.

5. **Validar o resultado**
   - Criar um agendamento de teste com uma atividade específica e conferir que o mesmo texto aparece no CRM e no Google Agenda.
   - Editar o texto e confirmar que o evento existente é atualizado, sem duplicação.
   - Verificar tanto a agenda pessoal do responsável quanto a agenda compartilhada da equipe.

## Detalhes técnicos

- Ajustar os payloads de criação em `LeadDetail`, `ContaAgendaQuickAdd` e demais fluxos que hoje gravam reunião sem `titulo`.
- Centralizar no `gcal-push` a resolução segura do `summary`, consultando também conta, lead ou imóvel quando necessário.
- Atualizar somente eventos futuros `origem = 'crm'` que já possuam vínculo em `google_calendar_sync`, usando a ação `update` para preservar o mesmo ID no Google.
