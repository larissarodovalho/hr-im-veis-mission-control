# Reverter conversão do lead Ivan Jorge Winter (teste)

## Estado atual (confirmado no banco)
- A conta `92b85bc7...` ("Ivan Jorge Winter", categoria marketing) foi criada hoje às 19:10 UTC a partir do lead `d5114cdc...`.
- O lead **continua existindo** (status "Novo", etapa "Conversa Ativa") — a conversão só o vincula à conta e marca como "Convertido em conta" no funil.
- As 6 interações do lead foram vinculadas à conta (`conta_id`), mas mantiveram o `lead_id` — ou seja, nada foi perdido, basta desvincular.
- Nenhuma tarefa ou reunião foi movida.

## Reversão (ajuste pontual de dados)
1. Remover o `conta_id` das 6 interações que apontam para essa conta (voltam a aparecer só no lead).
2. Excluir a conta de teste `92b85bc7...` (ela não tem tarefas, reuniões, oportunidades ou propostas — só as interações, que já terão sido desvinculadas).
3. Resultado imediato: o lead volta a aparecer normalmente no funil de Leads (etapa "Conversa Ativa"), sem o selo "Convertido em conta", e some da carteira de Contas.

## Opcional (se quiser prevenir no futuro)
Adicionar no detalhe da conta, para admin, uma ação "Desfazer vínculo com lead" que faz essa mesma reversão por botão — útil se um dia alguém converter por engano. **Só faço se você pedir** — neste momento vou apenas reverter o teste.

## Verificação
- Confirmar no banco que a conta foi removida e as 6 interações voltaram a ficar só com `lead_id`.
- Conferir no preview que o lead Ivan Jorge Winter aparece no funil sem o selo de convertido.
