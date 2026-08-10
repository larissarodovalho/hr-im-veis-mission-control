# Liberar todas as contas no seletor de vínculo da oportunidade

## O que está acontecendo

A conta "Sandra Pires" existe no sistema, mas não aparece no campo de busca do dialog da oportunidade.

Causa confirmada: hoje existem 1.451 contas e a lista carregada pela tela é cortada em 1.000 registros pelo limite padrão da API. Em ordem alfabética, "Sandra Pires" é a posição 1.295 — ou seja, ela (e todas as contas da letra ~R em diante) simplesmente nunca chegam ao navegador. A busca do campo filtra só o que já foi carregado, por isso mostra "Nenhum resultado".

## Solução

Fazer a busca de contas acontecer no servidor, com o texto digitado, em vez de baixar a lista inteira:

1. Criar uma busca de contas por nome/telefone/e-mail no backend, que devolve no máximo ~30 resultados por consulta e respeita as mesmas permissões atuais (somente equipe autenticada).
2. Ajustar o seletor de busca para consultar o servidor conforme o usuário digita (com pequeno atraso para não consultar a cada tecla), mantendo o comportamento visual atual.
3. Aplicar nos dois pontos que usam a lista de contas nas Oportunidades: o dialog de vincular conta e o dialog de criar oportunidade.
4. Enquanto nada foi digitado, mostrar as contas mais recentes como sugestão inicial.

Resultado: qualquer conta cadastrada passa a ser encontrada, independentemente do tamanho da base.

## Detalhes técnicos

- Nova função `search_contas_min(_q text, _limit int)` (SQL, STABLE, SECURITY DEFINER, `search_path = public`), filtrando por `nome ILIKE` + `normalize_br_phone(telefone)` + `email`, com guarda `public.is_staff()` e `LIMIT` — mesmo padrão de `list_contas_min()`.
- `src/components/SearchableSelect.tsx`: props opcionais `onSearch(query)` e `loading`; quando presentes, `CommandInput` fica controlado e o filtro interno do `Command` é desativado (`shouldFilter={false}`), com debounce de ~250 ms.
- `OportunidadeDetailDialog.tsx` e `CriarOportunidadeDialog.tsx`: trocar o `supabase.rpc("list_contas_min")` inicial por `search_contas_min` (carga inicial vazia = últimas contas) e passar `onSearch`.
- `list_contas_min()` permanece para os demais usos; nenhum dado é excluído ou alterado.
