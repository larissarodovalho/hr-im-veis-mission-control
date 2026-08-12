# Cancelar lote devolve contatos à base original

Hoje, ao cancelar um lote, cada conta tem o responsável apagado (fica sem responsável) e a tarefa "Primeiro contato — carteira" continua aberta no nome do corretor. O objetivo é que o cancelamento devolva a conta ao estado anterior à distribuição.

## O que muda

Ao clicar em Cancelar em um lote ativo, para cada conta do lote:

- O responsável volta a ser o responsável que a conta tinha antes da distribuição (em vez de ficar em branco).
- A tarefa automática de "Primeiro contato — carteira" ainda pendente é cancelada, para não continuar cobrando o corretor.
- A atribuição é encerrada como cancelada e o histórico registra a devolução, indicando de quem saiu e para quem voltou.
- A conta continua aparecendo normalmente na base (Contas), disponível para uma nova distribuição.

## Detalhes técnicos

1. Migração no banco:
   - Novas colunas em `carteira_atribuicoes`: `responsavel_anterior_id`, `categoria_anterior`, `data_entrada_carteira_anterior`, preenchidas no momento da distribuição.
   - `carteira_confirmar_distribuicao`: passa a gravar o responsável/categoria/data anteriores da conta antes de sobrescrevê-los.
   - `carteira_cancelar_lote`: em vez de `responsavel_id = NULL`, restaura `responsavel_id`, `categoria` e `data_entrada_carteira` a partir dos valores salvos na atribuição; marca como "Cancelada" as tarefas `Primeiro contato — carteira` ainda não concluídas daquela conta; mantém o registro em `carteira_eventos` e a nota na timeline com o nome do responsável restaurado.

2. Lotes já ativos (distribuídos antes desta mudança) não têm o responsável anterior gravado. Para esses casos, o cancelamento usará como fallback o `created_by` da conta (quem a cadastrou); se também não existir, a conta fica sem responsável, como hoje.

Nenhuma mudança de interface é necessária — o botão Cancelar continua igual, apenas o efeito passa a ser a devolução completa.
