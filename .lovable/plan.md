# Liberar agenda completa para secretaria

A página `/crm/agenda` lê 4 tabelas. Hoje as políticas RLS estão assim:

- `reunioes` → todos autenticados podem ver (OK)
- `ligacoes` → só admin/gestor/corretor dono
- `visitas` → só admin/gestor/corretor dono
- `captacoes_imovel` → só admin/gestor/marketing/responsável

Resultado: secretaria só vê reuniões — falta ligações, visitas e captações.

## Migration

Adicionar uma policy de SELECT para `secretaria` em cada uma das 3 tabelas:

```sql
CREATE POLICY "Secretaria sees ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees visitas" ON public.visitas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees captacoes" ON public.captacoes_imovel
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));
```

Também precisa ver os nomes referenciados (leads, contas, imóveis) para montar os títulos — vou conferir e adicionar policies de SELECT para secretaria nessas tabelas se necessário (provavelmente sim em `leads` e `contas`, `imoveis` já é público).

## Sem mudanças de código

A `Schedule.tsx` não filtra por role na leitura, então liberar RLS é suficiente. Nenhum arquivo `.tsx` precisa ser editado.

Confirmo?
