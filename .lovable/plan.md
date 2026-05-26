# Agenda visível para todos os papéis

Hoje a página `/crm/agenda` (Schedule.tsx) consulta `reunioes`, `ligacoes`, `visitas`, `captacoes_imovel` e `agenda_bloqueios`. As políticas atuais de SELECT limitam o que cada papel vê:

| Tabela | Quem vê hoje |
|---|---|
| reunioes | todos autenticados ✅ |
| agenda_bloqueios | todos autenticados ✅ |
| ligacoes | admin, gestor, secretaria, dono (corretor/created_by) |
| visitas | admin, gestor, secretaria, dono (corretor/created_by) |
| captacoes_imovel | admin, gestor, marketing, secretaria, dono |

Resultado: **corretor e marketing** veem só os próprios itens (e marketing não vê ligações/visitas alheias). O usuário quer que **admin, gestor, corretor, marketing e secretaria** vejam **tudo** na agenda.

## Mudança (migration única)

Adicionar uma política SELECT ampla `is_staff()` em cada tabela faltante. As políticas existentes ficam (são apenas mais restritivas, RLS é OR).

```sql
CREATE POLICY "Staff sees all ligacoes (agenda)"
ON public.ligacoes FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "Staff sees all visitas (agenda)"
ON public.visitas FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "Staff sees all captacoes (agenda)"
ON public.captacoes_imovel FOR SELECT TO authenticated
USING (public.is_staff());
```

`is_staff()` já cobre admin + gestor + corretor + marketing + secretaria.

## Sem mudanças de UI/código

Schedule.tsx continua igual — só passa a receber mais linhas. Políticas de UPDATE/DELETE/INSERT permanecem inalteradas (corretor continua não editando o que não é dele).

## Impacto colateral

Essas tabelas também aparecem em Leads (`ligacoes`), Visits (`visitas`) e Contas/Imóveis (`captacoes_imovel`). Corretor/marketing passarão a ver itens de outros usuários nessas telas também. Se isso for indesejado, precisaríamos filtrar no client por tela — confirme se está ok ampliar para essas telas também, ou se devo manter a restrição lá e duplicar leitura só na agenda via RPC.

Confirmo?
