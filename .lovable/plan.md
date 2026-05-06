## Objetivo

Garantir que **todos** os agendamentos criados pela Sofia (inclusive os antigos) fiquem visíveis no CRM, e finalizar o fix da página de confirmação.

## Diagnóstico confirmado

1. **Página em branco no link**: o backend já está corrigido — a edge function `booking-info` retorna `datetime_iso` corretamente (testei). O `AgendarPage.tsx` no repo também já trata isso. O `hrimoveis.com` ainda serve a versão antiga porque **falta clicar em Publish**. Não há mais código a alterar — basta publicar.

2. **Reuniões "não aparecendo no CRM"**: as reuniões **estão sendo criadas** corretamente na tabela `reunioes`. O problema é que **2 registros antigos** (gerados antes do fix de corretor padrão) estão com `corretor_id = NULL`, e a RLS `Staff sees reunioes` esconde esses registros para corretores comuns — só admin/gestor enxerga.

   Linhas atuais sem corretor:
   - `2026-05-07 12:00` — Larissa Rodovalho (lead `4f3a1e56...`)
   - `2026-05-01 12:00` — Larissa Rodovalho

## Mudança

Migration de **backfill** em `supabase/migrations/`:

```sql
UPDATE public.reunioes
SET corretor_id = '5e6a90fc-c806-4cd9-8dfe-9067126ece93',
    created_by  = COALESCE(created_by, '5e6a90fc-c806-4cd9-8dfe-9067126ece93')
WHERE corretor_id IS NULL
  AND criado_por_ia = true;

UPDATE public.ligacoes
SET corretor_id = '5e6a90fc-c806-4cd9-8dfe-9067126ece93',
    created_by  = COALESCE(created_by, '5e6a90fc-c806-4cd9-8dfe-9067126ece93')
WHERE corretor_id IS NULL;
```

(O UUID `5e6a90fc-...` é o admin existente — Hans.)

## Após a migration

- Aba **Reuniões** do CRM passa a listar todos os agendamentos da Sofia, inclusive os antigos.
- Novos agendamentos via link já vêm com `corretor_id` desde o último deploy do `booking-confirm`.
- **Você precisa clicar em "Publish"** para o `hrimoveis.com` servir o frontend novo e a tela de confirmação aparecer corretamente para o lead.

## Resultado

- Link `/agendar/:token` já usado → mostra "Tudo certo! Sua reunião com o Hans está marcada para …" (após publish).
- CRM → aba Reuniões mostra **todos** os registros, novos e antigos.