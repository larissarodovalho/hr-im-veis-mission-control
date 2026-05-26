## Mostrar nome da conta/cliente nas captações da agenda

### Causa
Em `src/pages/Schedule.tsx`, os compromissos de captação (`captacoes_imovel`) já são carregados, mas:
- O nome da conta entra apenas como sufixo no `titulo` (ex.: "Captação — João"). Se o título tem código do imóvel, o nome do cliente fica escondido entre parênteses.
- O tipo `Compromisso` não tem `conta_id` / `conta_nome`, então o card da agenda renderiza só o campo `Lead:` (que é `null` para captação) e o usuário marketing vê o card "sem cliente".

### Mudanças (apenas em `src/pages/Schedule.tsx`)

1. **Tipo `Compromisso`**: adicionar `conta_id?: string|null` e `conta_nome?: string|null`.
2. **Loaders** (`reus`, `ligsAgendadas`, `visitasAgendadas`, `captacoesAgendadas`): popular `conta_id` e `conta_nome` a partir de `contasById`. Para captação, garantir `conta_id` = `c.conta_id` e `conta_nome` = `contaNome`.
3. **Captação**: simplificar o título para `"Captação"` (ou "Captação: {imovel.titulo}") e deixar o nome do cliente vir do campo dedicado, evitando duplicar.
4. **Render do card de compromisso** (linha ~958): exibir uma linha `Cliente:` com link para `/crm/contas/{conta_id}` quando `c.conta_nome` existir e não houver `lead_nome`. Mantém `Lead:` quando aplicável.
5. **Visual da captação**: adicionar um `Badge variant="outline"` "Captação" (cor accent) ao lado do título quando o compromisso vier de `captacoes_imovel` para destacar a origem do funil. Para isso, adicionar `origem?: "captacao"` no tipo `Compromisso`.

### Escopo / RLS
Nenhuma mudança de banco. Marketing já tem acesso de leitura via `is_staff()` em `captacoes_imovel` e via "Marketing sees all contas" em `contas`. O ajuste é puramente de UI/dados no front-end.

### Arquivos
- `src/pages/Schedule.tsx` (tipo, loaders dos 4 grupos, render do item da lista do dia).