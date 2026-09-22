# Follow-up: conferência dos números e aviso de escopo

## O que a conferência mostrou

- O follow-up do Acompanhamento é calculado **apenas sobre Contas** (e a conta passa a ser creditada ao corretor da Oportunidade quando ela existe). Nenhuma conversa de Leads entra na conta.
- Por isso os números **já batem com os acessos**: Rafael e Douglas, que só trabalham Contas e Oportunidades, são medidos exatamente pelo que fazem.
- Contas por responsável hoje: Hans 1.036, Gabriel 401, Rafael 33, Douglas 33, Gabriele 14, Larissa 2. A apuração do dia cobre 1.519 contas, proporcional a essas carteiras — os valores são reais, vindos das interações registradas.
- O trabalho em Leads (Gabriel 80 leads, Hans 29) fica de fora da medição, conforme sua decisão de manter só Contas e Oportunidades.
- Leads antigos no nome de Douglas (16) e Rafael (3) permanecem como estão e não afetam o follow-up deles.

## O que será feito

Nenhuma mudança de cálculo. Só deixar o escopo visível para os gestores:

- Na Taxa de incidência, acrescentar uma linha curta abaixo dos quadros: "Follow-up e CRM medem apenas Contas e Oportunidades. O atendimento de Leads não entra nesta medição."
- Repetir a mesma frase no PDF, logo abaixo dos quadros de follow-up/CRM.

## Detalhes técnicos

- `src/components/reports/AcompanhamentoCorretoresReport.tsx`: nota de escopo no card da seção 03, no mesmo estilo da nota já existente sobre classificação manual.
- `src/lib/acompanhamentoPdf.ts`: mesma frase impressa após os blocos `barraGeralPdf` da seção 03.
- Sem migração, sem alteração na RPC `acompanhamento_apurar_diario`.
- Validar com typecheck, testes de `acompanhamentoPdf` e build.
