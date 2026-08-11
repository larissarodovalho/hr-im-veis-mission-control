# Editar e excluir lotes da Distribuição de Carteira

Hoje, depois que a operação é criada, não é possível editar nem excluir um lote individual — só cancelar a operação inteira. Este plano adiciona edição e exclusão de lotes **antes** da confirmação (prévia) e **depois** (cancelar lote ativo).

## Antes da confirmação (operação "em revisão")

### Editar lote
- Ícone de lápis no cabeçalho de cada lote na prévia (`CarteiraDistribuicao.tsx`, etapa "selecao").
- Abre um dialog com: corretor, quantidade, prazo (dias), objetivo, observação interna.
- Ao salvar: chama a RPC `carteira_editar_lote`.
- Se o corretor mudar → o nome do lote é regenerado ("Carteira – {novo nome} – Lote {nn}").
- Se a quantidade diminuir abaixo do número de contas já selecionadas → remove as excedentes (últimas adicionadas) e avisa o gestor.
- Bloqueia se o corretor escolhido já estiver em outro lote da mesma operação.

### Excluir lote
- Ícone de lixeira no cabeçalho de cada lote na prévia.
- Dialog de confirmação: "Excluir lote {nome}? As {N} contas selecionadas voltarão para a carteira elegível."
- Chama a RPC `carteira_excluir_lote` → remove o lote e seus itens de seleção.
- Bloqueia se for o último lote restante (a operação precisa de pelo menos 1).

## Depois da confirmação (lote "ativo")

### Cancelar lote ativo
- Na aba **Acompanhamento**, botão "Cancelar lote" em cada linha da tabela de lotes ativos.
- Dialog de confirmação: "Cancelar lote {nome}? As {N} contas atribuídas serão devolvidas para a carteira sem responsável. O histórico de atividades é preservado."
- Chama a RPC `carteira_cancelar_lote` → para cada atribuição ativa do lote:
  - Encerra a atribuição (`encerrada_em = now()`, `status = 'cancelado'`, `motivo` informado).
  - Limpa o `responsavel_id` da conta.
  - Registra evento `cancelamento_lote` na timeline.
  - Define o lote como `cancelado`.
  - Se todos os lotes da operação forem cancelados → operação fica `cancelada`.

## Migração (3 funções security definer)

```sql
-- carteira_editar_lote(_lote_id, _corretor_id, _quantidade, _prazo, _objetivo, _observacoes)
--   valida is_admin(), lote em_revisao, corretor tem role 'corretor', sem duplicidade
--   atualiza campos, regenera nome se corretor mudou, remove excesso de selecao_itens
--   retorna jsonb {nome, quantidade, removidas}

-- carteira_excluir_lote(_lote_id)
--   valida is_admin(), lote em_revisao, >=2 lotes na operacao
--   deleta selecao_itens do lote, deleta o lote
--   retorna jsonb {ok}

-- carteira_cancelar_lote(_lote_id, _motivo)
--   valida is_admin(), lote ativo
--   encerra atribuicoes ativas, limpa responsavel_id das contas, loga eventos
--   lote -> cancelado; se todos cancelados -> operacao cancelada
--   retorna jsonb {encerradas}
```

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| Migração SQL | 3 funções `carteira_editar_lote`, `carteira_excluir_lote`, `carteira_cancelar_lote` |
| `src/hooks/useCarteira.ts` | Adicionar `editarLote()`, `excluirLote()`, `cancelarLote()` |
| `src/pages/CarteiraDistribuicao.tsx` | Ícones editar/excluir nos cards de lote da prévia + dialogs |
| `src/components/carteira/AcompanhamentoCarteira.tsx` | Botão "Cancelar lote" na tabela de lotes ativos + dialog |

## Fora do escopo
- Não altera a lógica de confirmação (`carteira_confirmar_distribuicao`) além da validação que já existe.
- Não cria nova UI de listagem de lotes — usa os componentes já existentes.
