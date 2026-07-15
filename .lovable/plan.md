## Problema

Na tela de "Nova oportunidade" / "Editar oportunidade" (aba Imóveis → Oportunidades), o seletor de cliente carrega as contas via `supabase.from("contas").select("id,nome")`. Como o RLS de `contas` restringe corretores a verem apenas contas onde são `responsavel_id` ou `created_by`, boa parte da carteira não aparece no seletor — só admin/gestor enxerga tudo.

Precisamos que, **especificamente para vincular uma oportunidade**, o corretor consiga selecionar qualquer conta cadastrada (nome + id), sem afrouxar o RLS geral da tabela (que continua escondendo dados sensíveis como telefone, email, notas, etc. dos corretores que não são responsáveis).

## Solução

Criar uma função `SECURITY DEFINER` no banco que devolve apenas `id, nome` de todas as contas para qualquer staff autenticado, e usá-la nos dois diálogos de oportunidade.

### Backend (migration)

- Criar `public.list_contas_min()` retornando `TABLE(id uuid, nome text)`:
  - `SECURITY DEFINER`, `search_path = public`.
  - Retorna todas as contas ordenadas por `nome` quando `is_staff()` é verdadeiro; caso contrário vazio.
  - `GRANT EXECUTE ... TO authenticated`.
- Fazer o mesmo para leads (`list_leads_min()`) pelo mesmo motivo — o RLS de leads também restringe corretor a leads próprios, então o mesmo sintoma ocorre lá no seletor de cliente.

### Frontend

Nos arquivos:
- `src/components/imoveis/NovaOportunidadeDialog.tsx`
- `src/components/imoveis/EditarOportunidadeDialog.tsx`

Substituir a função paginada `fetchAll("contas" | "leads")` por chamadas `supabase.rpc("list_contas_min")` e `supabase.rpc("list_leads_min")`. Retorno já traz `{id, nome}` no formato esperado pelo `SearchableSelect`.

Nada mais muda: só o carregamento das opções do seletor. Ao salvar, a oportunidade grava `cliente_id` normalmente; a política existente `Users see contas linked to own oportunidades` já permite o corretor ver depois a conta vinculada.

## Impacto de segurança

- Nenhum dado sensível é exposto: as funções só devolvem `id` e `nome`.
- Só usuários com papel staff (`is_staff()`) conseguem executar.
- O RLS das tabelas `contas` e `leads` permanece inalterado — leitura completa continua restrita.
