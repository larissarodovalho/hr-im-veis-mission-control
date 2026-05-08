## Plano — Nome do lead clicável no calendário de Reuniões

**Arquivo:** `src/components/EventsCalendar.tsx`

A tabela de cima já tem o nome do lead clicável (em azul). No **calendário de reuniões**, ao selecionar um dia, o nome do lead também é um `<Link>` mas está visualmente discreto — parece texto comum.

### Mudança
- Estilizar o `<Link>` com `text-primary underline-offset-2 hover:underline` para ficar claramente clicável.
- Mostrar o horário em `text-muted-foreground` separado, para dar destaque ao nome.
- Já navega corretamente para `/app/leads/:id` (página `LeadDetail` com histórico, interações e detalhes do contato).

Mudança puramente visual, sem alterar lógica nem dados.