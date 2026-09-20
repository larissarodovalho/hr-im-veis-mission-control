# Acompanhamento por semana (em vez de por dia)

## Objetivo
Na aba Acompanhamento, mostrar a constância dos corretores em blocos semanais, e não dia a dia. Os números continuam vindo da mesma apuração de trabalho real; muda a forma de agrupar e exibir.

## O que muda para quem usa
- A faixa de evolução deixa de ter um quadradinho por dia e passa a ter um por semana (segunda a sexta).
- Cada semana aparece como "01/09 a 05/09", com o percentual daquela semana.
- O texto de apoio passa a falar em "semanas úteis" e "conta-semana", no lugar de "dias úteis" e "conta-dia".
- Os totais por corretor (atualizado x desatualizado e cada problema lado a lado) continuam iguais; só a leitura da evolução vira semanal.
- A legenda no fim da página é atualizada para explicar a medição semanal.
- PDF e planilha (CSV) seguem o mesmo agrupamento da tela.

## Como fica o cálculo
A exigência de contato continua sendo avaliada dia a dia em dias úteis (fuso de Cuiabá) — isso não muda, pois é o que garante que o número reflita o trabalho real. A diferença é que os resultados diários são somados dentro da semana:

- Uma semana vai de segunda a sexta; semanas parciais no início e no fim do período entram com os dias que existem.
- Percentual da semana = ocorrências da semana ÷ conta-dias exigíveis da semana.
- Contagem de "semanas úteis" = semanas do período que tiveram pelo menos um dia útil.
- Contas sem histórico comprovável continuam fora do denominador, como hoje.

## Detalhes técnicos
- Nova migração ajustando `acompanhamento_apurar_diario` para também retornar `semanas_uteis` e uma série agregada por semana (`semana_inicio`, `semana_fim`, responsável da métrica, conta-dias exigíveis e contadores por classificação), mantendo a apuração diária intacta na tabela `acompanhamento_conta_diario`.
- `src/components/reports/AcompanhamentoCorretoresReport.tsx`: trocar o consumo de `serie` pela série semanal no componente de evolução, atualizar rótulos, tooltips, textos da seção 03, legenda e colunas do CSV.
- `src/lib/acompanhamentoPdf.ts`: ajustar o tipo da série, o cabeçalho da seção 03 e a tabela de evolução para semanas.
- `src/test/acompanhamentoPdf.test.ts`: acrescentar teste do agrupamento semanal (fechamento dos percentuais e semanas parciais).
- Validação: typecheck, testes, build e verificação da tela autenticada em /crm/relatorios comparando os totais de Hans, Gabriel, Douglas e Rafael entre tela, PDF e CSV.
