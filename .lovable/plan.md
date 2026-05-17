## Objetivo
Permitir vincular uma reunião a uma **Conta** (carteira/marketing), além de Lead, no diálogo "Nova reunião" da página `/app/reunioes`.

## Mudanças em `src/pages/Meetings.tsx`

1. **Carregar contas** junto com leads no `useEffect` inicial (`supabase.from("contas").select("id, nome").order("nome")`).

2. **Estado do formulário**: adicionar `conta_id: "none"` ao `form` e `editForm`.

3. **Diálogo "Nova reunião"**: adicionar um seletor "Conta" (Select com "Sem conta vinculada" + lista de contas) abaixo do seletor de Lead. Lead e Conta são independentes — o corretor pode vincular um, o outro, ou ambos.

4. **Função `add`**: incluir `conta_id: form.conta_id === "none" ? null : form.conta_id` no insert.

5. **Diálogo de edição**: mostrar/editar também a conta vinculada (mesmo padrão do lead, com link para `/app/contas/:id` quando existir).

6. **Função `saveEdit`**: persistir `conta_id` no update.

7. **Listagem da tabela**: na coluna "Lead", se não houver lead mas houver conta, exibir o nome da conta com link para `/app/contas/:id`. Carregar nomes das contas em `load()` de forma análoga ao que já é feito para leads (`leadsById` → adicionar `contasById`).

## Observações
- A tabela `reunioes` já possui a coluna `conta_id` (vista no schema), então **não é necessária migração**.
- Mudanças puramente de UI/frontend — sem alterar lógica de negócio fora isso.
