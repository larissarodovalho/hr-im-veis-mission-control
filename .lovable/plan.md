## Problema

Na aba **Imóveis → Captação**, usuários com papel `marketing` veem os cards do kanban (pois a política de `captacoes_imovel` já inclui marketing), mas os cards aparecem sem nome do cliente, telefone e e-mail.

Causa: a tabela `contas` só permite SELECT para:
- admin / gestor (vê tudo)
- responsável ou criador da conta
- contas ligadas a oportunidades do próprio usuário

Marketing não se encaixa em nenhuma → o `contas` carregado no `CaptacaoTab` vem vazio e o card mostra "—".

## Solução

Adicionar **uma política de SELECT** em `public.contas` que permita ao papel `marketing` ler **somente** contas que possuem um registro em `captacoes_imovel` (não libera a base inteira de contas, só o necessário para o kanban de captação funcionar).

### Migração

```sql
CREATE POLICY "Marketing sees contas com captacao"
ON public.contas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.captacoes_imovel ci
    WHERE ci.conta_id = contas.id
  )
);
```

Sem alterações de frontend — assim que a política for aplicada, os campos nome/telefone/e-mail passam a aparecer nos cards para o marketing.

## Observação de escopo

- Não mexo na visibilidade de contas para secretaria/corretor (que já têm regras próprias).
- Não toco em `corretores_parceiros` (assunto da migração anterior).
- Não altera UI.

Posso aplicar?
