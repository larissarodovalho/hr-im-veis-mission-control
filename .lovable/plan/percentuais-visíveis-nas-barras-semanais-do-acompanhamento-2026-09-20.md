# Percentuais visíveis nas barras semanais do Acompanhamento

## Objetivo
Na aba Acompanhamento (seção 03 · Taxa de incidência), deixar os gráficos semanais legíveis: cada semana mostra o percentual escrito, sem precisar passar o mouse.

## O que muda para quem usa

### 1. CRM atualizado × desatualizado
- Cada semana vira uma barra dividida em verde (atualizado) e vermelho (desatualizado), com o percentual de **atualizado escrito na barra** (ex.: "20% atualizado").
- Semanas muito estreitas mostram o número ao lado/abaixo da barra para não cortar o texto.
- O rótulo da semana ("31/08 a 04/09") aparece sob cada barra.
- O resumo do corretor (barra verde/vermelha do período inteiro) já mostra os percentuais — mantido.

### 2. Falta de follow-up
- Cada semana vira uma barra dividida: parte verde = follow-up feito, parte vermelha = follow-up não feito, com os **dois percentuais escritos** (ex.: "70% feito · 30% não feito").
- Rótulo da semana sob cada barra, igual ao quadro de CRM.

### 3. Demais quadros (sem retorno, sem interesse, etc.)
- Mantêm a faixa atual, mas o percentual da semana passa a aparecer como texto visível (não só no mouse), com o rótulo da semana.

### 4. PDF e planilha
- O PDF passa a imprimir os mesmos percentuais por semana nos quadros de CRM e follow-up.
- A planilha (CSV) já traz os números por semana — sem mudança.

## Como fica o cálculo
- Nada muda no cálculo: continua a mesma apuração de trabalho real (conta-dias exigíveis em dias úteis, fuso de Cuiabá), apenas somada por semana (segunda a sexta).
- Percentual da semana = ocorrências da semana ÷ conta-dias exigíveis da semana. Verde + vermelho fecham 100%.

## Detalhes técnicos
- `src/components/reports/AcompanhamentoCorretoresReport.tsx`: novo componente de barras semanais empilhadas com rótulos de percentual e de semana (substitui `EvolucaoSemanal` nos quadros de CRM e follow-up; percentuais visíveis nos demais).
- `src/lib/acompanhamentoPdf.ts`: seção 03 do PDF passa a desenhar as barras semanais com percentuais escritos.
- Teste em `src/test/acompanhamentoPdf.test.ts` garantindo que verde + vermelho fecham 100% por semana.
- Validação: typecheck, testes, build e conferência visual na aba Acompanhamento.
