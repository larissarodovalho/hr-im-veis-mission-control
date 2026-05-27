## Objetivo
Na página Agenda (visualização semanal/diária), exibir apenas o intervalo das 7h às 18h, em vez do atual 7h–21h.

## Mudança
Arquivo: `src/pages/Schedule.tsx` (linha 871)

- Alterar a constante `HOUR_END` de `22` para `19` (valor exclusivo, para incluir o slot das 18h).
- `HOUR_START` permanece `7`.

Isso recalcula automaticamente:
- A lista de horas exibida na coluna lateral (7 a 18).
- A altura total da grade.
- O recorte (clip) dos eventos que ultrapassam o intervalo visível.

## Observação
A visualização mensal mostra apenas dias (sem faixa de horas), portanto não requer alteração.