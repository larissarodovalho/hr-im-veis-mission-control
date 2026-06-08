## Problema

Após restringir a tabela `contas` para apenas admin/gestor verem tudo, o corretor não consegue mais carregar os nomes das contas vinculadas às suas próprias oportunidades. Por isso o card do Kanban em **Imóveis → Oportunidades** mostra "—" no lugar de "Cliente de Juara", mesmo o cliente estando preenchido na edição.

A query `supabase.from("contas").select("id,nome")` em `OportunidadesTab.tsx` retorna vazio para o corretor por RLS.

## Solução

Adicionar uma política RLS adicional em `public.contas` que permita ao usuário ler uma conta **quando ela for cliente de uma oportunidade onde ele é o corretor ou o criador**. Isso libera apenas o necessário (nome/dados da conta cliente vinculada à sua oportunidade), sem reabrir o acesso geral à agenda.

### Detalhes técnicos

Nova policy SELECT em `public.contas`:

```sql
CREATE POLICY "Users see contas vinculadas às próprias oportunidades"
ON public.contas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.cliente_tipo = 'conta'
      AND o.cliente_id = contas.id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  )
);
```

Mantém as políticas atuais (admin/gestor veem tudo; corretor vê próprias por `responsavel_id`/`created_by`). Sem mudanças no frontend.
