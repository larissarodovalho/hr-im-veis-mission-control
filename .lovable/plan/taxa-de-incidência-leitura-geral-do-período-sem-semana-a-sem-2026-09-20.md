# Taxa de incidência: leitura geral do período (sem semana a semana)

## O que muda

Na aba Acompanhamento, seção "03 · Taxa de incidência", as faixinhas semana a semana saem. Cada corretor passa a ter uma leitura única, do período inteiro filtrado.

### CRM atualizado × desatualizado
Uma barra por corretor, verde e vermelha, com os dois percentuais escritos e as quantidades:
- "Atualizado 62,0% · 31" (verde)
- "Desatualizado 38,0% · 19" (vermelho)
- ao lado do nome, o total considerado (ex.: "50 contatos exigíveis")

Verde + vermelho sempre fecham 100%.

### Falta de follow-up
Mesmo formato: uma barra por corretor, verde para follow-up feito e vermelho para não feito, com percentual e quantidade escritos.

### Demais quadros (sem retorno, sem interesse, desqualificado, encerrado, virando oportunidade, oportunidade futura, ciclo em andamento, etapa antiga)
Continuam como uma barra simples por corretor com percentual e quantidade do período — sem as faixinhas semanais embaixo.

## Layout

Os quadros voltam a ficar alinhados: o quadro de CRM ocupa a largura total em duas colunas de corretores, e os demais ficam na grade de quadros menores, todos com a mesma altura de barra. Nada de blocos de alturas diferentes desalinhando a grade.

## PDF e planilha

O PDF passa a imprimir a mesma leitura geral (barra e percentuais por corretor), sem as barras semanais. A planilha (CSV) exporta os totais do período por corretor; as colunas de série semanal saem.

## Texto de apoio e legenda

O texto da seção e a legenda no fim da página passam a falar do período inteiro ("no período filtrado"), em vez de "conta-semana" e "semanas úteis".

## Detalhes técnicos

- `AcompanhamentoCorretoresReport.tsx`: remover o uso de `BarrasSemanais` e `EvolucaoSemanal` na seção 03 (e os componentes, se ficarem sem uso); manter `calcularStatusCrm(conta_dias_exigiveis, crm_desatualizado)` como fonte dos percentuais e criar um componente único `BarraGeral` para CRM e follow-up.
- `acompanhamentoPdf.ts`: remover a chamada de `barrasSemanaisPdf` nos ramos `crm_desatualizado` e `falta_followup`, imprimindo barra única por corretor; helpers semanais (`agruparSeriePorSemana`, `contarSemanasUteis`, `rotuloSemana`) deixam de ser usados na seção 03.
- CSV: remover colunas da série semanal da seção 03.
- Cálculo e apuração diária no banco permanecem inalterados — muda só a forma de exibir.
- Testes em `src/test/acompanhamentoPdf.test.ts`: ajustar o teste das barras semanais para validar que os percentuais gerais de CRM e follow-up fecham 100%.
