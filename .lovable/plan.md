## Objetivo
Dentro da página de uma Conta (`/app/contas/:id`), permitir que o corretor agende rapidamente **Reunião**, **Ligação** ou **Visita** vinculada à conta. Os registros são salvos nas tabelas `reunioes`, `ligacoes` e `visitas` com `conta_id` preenchido, e aparecem automaticamente na **Agenda Geral** (`/app/agenda`), nas páginas dedicadas (Reuniões, Ligações, Visitas) e no calendário.

## 1. Migração de banco
Adicionar coluna `conta_id uuid` à tabela `visitas` (as tabelas `reunioes` e `ligacoes` já têm). Sem alteração nas RLS existentes (a inserção continua válida porque exige `auth.uid() = created_by`).

```sql
ALTER TABLE public.visitas ADD COLUMN conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_visitas_conta_id ON public.visitas(conta_id);
```

## 2. Novo componente `src/components/contas/ContaAgendaQuickAdd.tsx`
Card exibido em `AccountDetail.tsx` com 3 botões:
- **Nova reunião** → diálogo com data/hora, tipo (presencial/videochamada/ligação), duração, local/link, notas → insert em `reunioes` (`conta_id`, `created_by`, `corretor_id`).
- **Nova ligação** → diálogo com data/hora, duração (min), notas, resultado padrão "agendada" → insert em `ligacoes` (`conta_id`, `created_by`, `corretor_id`, `data`, `duracao_seg`, `resultado="agendada"`).
- **Nova visita** → diálogo com data/hora, imóvel opcional (Select com busca de `imoveis`), observações → insert em `visitas` (`conta_id`, `created_by`, `corretor_id`, `data_visita`, `status="Agendada"`).

Todos exibem toast de sucesso e disparam um callback `onCreated` para recarregar a timeline.

## 3. Integrar em `AccountDetail.tsx`
Adicionar `<ContaAgendaQuickAdd contaId={acc.id} responsavelId={acc.responsavel_id} onCreated={load} />` acima do bloco "Propriedades / Negócios".

## 4. Atualizar `src/pages/Schedule.tsx` (agenda geral)
- Incluir `conta_id` nos `select(...)` de `reunioes`, `ligacoes` e `visitas`.
- Resolver nomes de contas (uma consulta `in("id", contaIds)` em `contas`) e usar o nome da conta como fallback quando não houver lead (ex.: título "Ligação com {conta}", "Visita com {conta}", "Reunião com {conta}").

## 5. Atualizar `src/pages/Visits.tsx` e `src/pages/Calls.tsx`
Apenas exibir o nome da conta vinculada quando não houver lead, de forma análoga ao que já fizemos em `Meetings.tsx` (carregar `contas` referenciadas e mostrar como link `/app/contas/:id`). Sem mudar fluxo de criação dessas páginas.

## Observações
- A página de Reuniões já foi ajustada anteriormente para mostrar conta vinculada — nenhuma mudança lá.
- Não há alterações em RLS — as policies existentes cobrem o caso de `conta_id` preenchido.
