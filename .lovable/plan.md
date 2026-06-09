## Problema

A política que adicionei em `contas` (`Marketing sees contas com captacao`) faz `EXISTS (SELECT ... FROM captacoes_imovel)`. A política de SELECT em `captacoes_imovel` por sua vez faz `EXISTS (SELECT ... FROM contas)`. Isso gera recursão infinita no RLS — o Postgres aborta a query e nenhuma captação aparece (nem para admin/gestor/corretor).

## Correção

Quebrar o ciclo com uma função `SECURITY DEFINER` que ignora RLS ao checar se uma conta tem captação. A política de `contas` chama essa função em vez de consultar `captacoes_imovel` diretamente.

### Migração

```sql
-- 1. Função security definer (bypassa RLS)
CREATE OR REPLACE FUNCTION public.conta_tem_captacao(_conta_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captacoes_imovel
    WHERE conta_id = _conta_id
  )
$$;

-- 2. Recria a política de marketing usando a função
DROP POLICY IF EXISTS "Marketing sees contas com captacao" ON public.contas;

CREATE POLICY "Marketing sees contas com captacao"
ON public.contas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(contas.id)
);
```

Sem alterações de frontend. Após aplicada:
- A recursão acaba e as captações voltam a aparecer para admin/gestor/corretor.
- Marketing continua vendo nome/telefone/e-mail dos clientes apenas nas contas com captação.
