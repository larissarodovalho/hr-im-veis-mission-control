## Recorrência no Novo compromisso

Adicionar opção de recorrência no formulário "Novo compromisso" em `/crm/agenda`, permitindo lançar compromissos únicos, semanais, quinzenais, mensais ou fixos (todo dia útil).

### Mudanças de UI (`src/pages/Schedule.tsx`)

No diálogo "Novo compromisso", adicionar uma seção "Repetição" com:

- **Frequência** (Select):
  - Não repete (padrão)
  - Diariamente (seg–sex) — "compromisso fixo"
  - Semanalmente — "uma vez por semana"
  - Quinzenalmente — a cada 2 semanas
  - Mensalmente — mesmo dia do mês
- **Termina em** (Input date) — visível só quando frequência ≠ "Não repete". Default: 3 meses à frente.
- Texto auxiliar mostrando quantas ocorrências serão criadas (ex.: "Serão criados 12 compromissos").

Limite de segurança: máx. 60 ocorrências por série.

### Lógica de criação

No `criarCompromisso`:

1. Calcular as datas da série a partir da frequência + data final.
2. Para cada data, rodar o `checkConflito` existente; se algum conflitar, abortar com aviso listando datas problemáticas (ou pular as conflitantes — confirmar via toast).
3. Gerar um `recorrencia_id` (`crypto.randomUUID()`) e inserir todas as `reunioes` em batch com o mesmo `recorrencia_id` e `recorrencia_regra` (`"diaria_util" | "semanal" | "quinzenal" | "mensal"`).
4. Disparar `gcal-push` para cada ocorrência criada (best effort).

### Mudanças de banco

Migração na tabela `reunioes`:

- `recorrencia_id uuid null` — agrupa as ocorrências da mesma série.
- `recorrencia_regra text null` — guarda a regra ("semanal" etc.) para exibir/editar futuramente.
- Índice em `recorrencia_id`.

Sem alteração de RLS (já cobre por `is_staff()` / corretor).

### Edição/exclusão (escopo mínimo)

Nesta entrega o diálogo de edição segue atuando só na ocorrência selecionada. Mostrar um pequeno badge "Recorrente" no card quando `recorrencia_id` existir, sem ação de "editar série" — isso fica para um próximo passo se o usuário pedir.

### Arquivos

- `src/pages/Schedule.tsx` — estado `novo` ganha `recorrencia` e `recorrencia_ate`; novos campos no formulário; expansão da série na função de criação; badge "Recorrente" no render do dia.
- Migração nova adicionando `recorrencia_id` e `recorrencia_regra` em `reunioes`.
