# Mostrar contato do lead nas abas Reuniões e Agenda

Hoje, em `Meetings.tsx` e `Schedule.tsx`, buscamos só `id, nome` da tabela `leads` e exibimos o nome. O usuário quer que **todos** vejam o **contato** (telefone + email) do lead vinculado a cada reunião/agendamento.

Duas frentes:

## 1. RLS — liberar SELECT amplo em `leads` para staff

Hoje corretor/marketing só veem leads próprios. Para o lead vinculado à reunião aparecer para todos, espelhar o padrão que já aplicamos em `ligacoes/visitas/captacoes`:

```sql
CREATE POLICY "Staff sees all leads (agenda)"
ON public.leads FOR SELECT TO authenticated
USING (public.is_staff());
```

Políticas de UPDATE/DELETE permanecem inalteradas — corretor continua editando só os próprios.

## 2. UI — buscar telefone/email e exibir

### `src/pages/Meetings.tsx`
- Linha 43: `.select("id,nome,telefone,email")` (em vez de só `id,nome`).
- Linha 209 (coluna da tabela): logo abaixo do nome do lead/conta, mostrar `telefone` e `email` em texto pequeno (`text-xs text-muted-foreground`) quando houver.

### `src/pages/Schedule.tsx`
- Linha 147: `.select("id, nome, telefone, email")`.
- Onde `leadNome` é montado (linhas 164, 189, 207), guardar também `leadTelefone`/`leadEmail` no item agregado (`lead_telefone`, `lead_email`).
- Nos cards/lista onde aparece `c.lead_nome` (linhas 947 e 985), adicionar em segunda linha: `📞 telefone · ✉ email` (só renderizar o que existir).

Sem mudança no select de leads do formulário (continua só nome).

Confirmo?
