# Correção: Oportunidades de Negócio

## Diagnóstico

Investiguei as políticas de acesso (RLS) das tabelas envolvidas e encontrei **dois problemas reais** no comportamento descrito:

### 1. Não consegue excluir o card da oportunidade
A política atual de exclusão da tabela `oportunidades` permite **apenas administradores**:
```
DELETE: has_role(auth.uid(), 'admin')
```
Ou seja, um corretor/gestor que criou a oportunidade (ou é o responsável dela) **não consegue excluí-la**, mesmo sendo o dono. O botão "Excluir" no diálogo simplesmente falha silenciosamente (ou mostra erro).

### 2. Não consegue adicionar alguns contatos (leads/contas)
No seletor de cliente do diálogo "Nova oportunidade" / "Editar oportunidade":
- **Leads**: já existe política `Staff sees all leads (agenda)` — todos staff veem todos os leads. ✅
- **Contas**: o corretor só vê contas onde `responsavel_id = auth.uid()` ou `created_by = auth.uid()`. Contas de outros corretores **não aparecem** na busca, por isso "não consegue adicionar alguns contatos".

## Plano de correção

### Migração de banco (políticas RLS)

**a) Permitir que dono/responsável exclua a oportunidade** (mantém admin):
- Substituir a policy `DELETE` de `oportunidades` por:
  ```sql
  is_admin() OR corretor_id = auth.uid() OR created_by = auth.uid()
  ```
- Espelha a regra de `UPDATE` que já existe.

**b) Permitir que todo staff visualize todas as contas** (apenas SELECT, igual aos leads):
- Adicionar policy `Staff sees all contas (agenda)` em `contas` com `USING (is_staff())`.
- Não altera INSERT/UPDATE/DELETE — apenas leitura, para poder selecionar a conta como cliente da oportunidade.

### Sem mudança de código frontend
Os diálogos `NovaOportunidadeDialog` e `EditarOportunidadeDialog` já listam corretamente leads e contas e já chamam `delete` corretamente — só faltam as permissões no backend.

## Pergunta antes de aplicar

A liberação de leitura de **todas as contas** para qualquer corretor é desejada? (hoje cada corretor só vê as próprias). Se preferir manter o isolamento, posso, em vez disso, mostrar no seletor apenas o que o usuário já enxerga e deixar claro na UI — mas aí o problema "não consigo adicionar contato X" continuaria por design.
