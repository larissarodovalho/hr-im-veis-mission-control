# Consertar os quadros de CRM e follow-up no Acompanhamento

## O que está acontecendo

Os quadros "CRM atualizado × desatualizado" e "Follow-up feito × não feito" (e todos os demais quadros da Taxa de incidência) aparecem vazios porque o cálculo de produtividade falha no servidor e não devolve nenhum número.

Confirmado ao abrir a aba Acompanhamento: o relatório geral responde normalmente (1.516 contas), mas o cálculo diário retorna erro. A causa é uma falha na última alteração da rotina de cálculo: a etapa final, que grava o resultado do dia, ficou apontando para um conjunto de dados que já não existe nesse ponto da rotina. Com isso a rotina inteira aborta antes de devolver qualquer valor, e a tela mostra "Não foi possível calcular a produtividade do período".

## Correção

1. Reparar a rotina de apuração para que a gravação do dia use os mesmos dados já calculados, dentro da mesma execução, sem depender de um conjunto fora de escopo.
2. Manter tudo o que já foi definido: dias úteis no fuso de Cuiabá, desfechos contados uma vez no dia em que foram registrados, histórico não comprovável fora do denominador, gravação idempotente apenas do dia atual.
3. Nenhuma mudança de regra de cálculo, de visual ou de exportação — apenas voltar a produzir os números.

## Depois da correção

- Cada corretor volta a ter a barra verde/vermelha do período com percentuais e quantidades: "Atualizado 62,0% · 31" e "Desatualizado 38,0% · 19".
- O mesmo vale para "Follow-up feito × não feito" e para os demais quadros (sem retorno, desqualificado, encerrado, oportunidade criada, ciclo em andamento).
- Se algum dia o cálculo falhar de novo, a tela continua avisando com o botão "Tentar novamente", em vez de mostrar zeros falsos.

## Detalhes técnicos

- Nova migração corrigindo `public.acompanhamento_apurar_diario`: hoje o `INSERT ... SELECT ... FROM aval` no fim da função referencia uma CTE do `SELECT ... INTO` anterior, resultando em `42P01 relation "aval" does not exist`. Reescrever gravando a partir de uma CTE própria (ou reaproveitando o conjunto via CTE data-modifying no mesmo comando).
- Sem alteração em `AcompanhamentoCorretoresReport.tsx`, `acompanhamentoPdf.ts` ou CSV.

## Validação

- Chamar a apuração pelo período filtrado e confirmar retorno com `conta_dias_exigiveis`, `crm_base`, `crm_atualizado` e `falta_followup` por corretor.
- Conferir na tela (Hans, Gabriel, Douglas, Rafael, Larissa) que verde + vermelho fecham 100%.
- Conferir os mesmos números no PDF e na planilha.
- Rodar typecheck, testes e build.
