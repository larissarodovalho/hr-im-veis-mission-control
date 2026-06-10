## Problema

1. Na aba **Imóveis → Captação**, ao clicar no card o link aponta para `/crm/contas/:id`, mas o usuário marketing é redirecionado de volta para `/crm/imoveis`. Isso acontece porque a rota está envolvida pelo `MarketingRoute`, que bloqueia usuários só-marketing.
2. Mesmo se a rota fosse liberada, o marketing **não consegue agendar/editar captação** dentro da conta porque o fluxo "Captação" no `ContaAgendaQuickAdd` faz `UPDATE` em `contas.etapa_funil`, e a policy atual de UPDATE em `contas` só permite admin/gestor/responsável.

## Correção

### Frontend
- Em `src/App.tsx`, remover o `MarketingRoute` da rota `/crm/contas/:id` (mantendo nas demais rotas de leads/contas listagem). Assim o marketing consegue abrir a conta vinda do card de captação. O RLS já garante que ele só vê contas com captação (policy `Marketing sees contas com captacao`).

### Backend (migração)
Adicionar policy de UPDATE em `public.contas` permitindo marketing apenas em contas que tenham captação:

```sql
CREATE POLICY "Marketing updates contas com captacao"
ON public.contas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(id)
)
WITH CHECK (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(id)
);
```

As policies já existentes em `captacoes_imovel` (INSERT via `is_staff()`, UPDATE para marketing) já cobrem criar/editar a captação em si, então não precisam de mudança.

## Resultado
- Marketing clica no card em Imóveis → Captação e abre a página da conta normalmente.
- Marketing consegue agendar/editar captação pelo botão dentro da conta, e a mudança de `etapa_funil` para `captacao_imovel` é aceita.
- Demais campos da conta continuam editáveis só por admin/gestor/responsável dentro do escopo da policy (marketing pode atualizar, mas apenas em contas que já têm captação — o uso prático é o fluxo de captação).
