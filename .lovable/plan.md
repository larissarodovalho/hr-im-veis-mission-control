## Restringir visibilidade de Contas

Hoje as políticas RLS da tabela `contas` permitem que corretor, marketing e secretaria vejam todas as contas (via `is_staff()` e políticas dedicadas). Vou restringir para que **apenas admin (CEO) e gestor** vejam todas; corretor continua vendo só as suas (responsável ou criadas por ele).

### Mudanças no banco (migração)

Na tabela `public.contas`:
- Remover `"Staff sees all contas (agenda)"` (usa `is_staff()` — vaza para corretor/marketing/secretaria).
- Remover `"Marketing sees all contas"`.
- Remover `"Secretaria sees contas"`.
- Manter `"Admin/gestor see all contas"` (admin + gestor veem tudo).
- Manter `"Corretor sees own contas"` (responsável ou criador).
- Manter políticas de INSERT/UPDATE/DELETE como estão.

### Observações
- "CEO" no sistema = role `admin`.
- Corretor continuará enxergando contas onde ele é `responsavel_id` ou `created_by`.
- Marketing e secretaria deixarão de ver contas (alinhado ao pedido). Se quiser manter algum acesso para esses dois papéis, me avise antes de aprovar.
- Nenhuma mudança de código frontend é necessária — a UI já respeita o que o banco retorna.