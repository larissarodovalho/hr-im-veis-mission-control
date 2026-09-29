# Remover o quadro "CRM atualizado × desatualizado" do Acompanhamento

## Objetivo

Na aba Relatórios → Acompanhamento, seção 03 (Taxa de incidência), remover **apenas** o quadro "CRM atualizado × desatualizado" (o do print enviado: barras verde/vermelho por corretor com "Atualizado X% · Desatualizado Y%"). O quadro "Follow-up feito × não feito" e todas as demais seções (01 Entrada, 02 Retrato por corretor, 05 Detalhamento) permanecem intactos.

## O que muda na tela

`src/components/reports/AcompanhamentoCorretoresReport.tsx`:

1. Na seção 03, o laço que hoje desenha dois quadros (`crm_desatualizado` e `falta_followup`) passa a desenhar **somente** o quadro "Follow-up feito × não feito" (filtro por `cl.id === "falta_followup"`).
2. Somem junto com o quadro removido:
   - as barras verde/vermelho de "Atualizado × Desatualizado" por corretor;
   - o selo "Falha de processo" e a legenda de cores específicos desse quadro;
   - os 4 itens explicativos do CRM (o que entra na contagem do dia, o que é "Atualizado", o que é "Desatualizado", início no primeiro contato).
3. O aviso logo abaixo dos quadros muda de "Follow-up e CRM medem apenas Contas e Oportunidades…" para "O follow-up mede apenas Contas e Oportunidades. O atendimento de Leads não entra nesta medição." O aviso "A medição começa a partir do primeiro contato…" permanece (vale para o follow-up).
4. Limpeza de código: o ramo `cl.id === "crm_desatualizado"` e o uso de `calcularStatusCrm` no componente deixam de existir; a função continua exportada em `acompanhamentoPdf.ts` (usada pelos testes).

## O que NÃO muda (pedido: "remover essa tabela apenas")

- Quadro "Follow-up feito × não feito" (barras, selo e explicações).
- Seção 02 "Retrato por corretor": tabela com a coluna "Falha de processo", barra "Proporção travada" e texto de resumo continuam como estão.
- CSV da seção 02: mantém as colunas "CRM atualizado — ocorrências/%" e "CRM desatualizado — ocorrências/%".
- Nenhuma mudança no banco de dados nem na apuração diária (a função `acompanhamento_apurar_diario` continua calculando tudo; apenas a exibição do quadro de CRM sai da tela/PDF).

## O que muda no PDF

`src/lib/acompanhamentoPdf.ts`:

1. A seção "03 · Taxa de incidência" passa a renderizar **somente** o quadro "Follow-up feito × não feito" (filtro por `falta_followup`).
2. Remove os textos explicativos do quadro de CRM (contagem do dia, Atualizado, Desatualizado, primeiro contato).
3. O texto "Mesma base de dias exigíveis do quadro anterior" do follow-up é ajustado, pois o quadro anterior deixa de existir: passa a explicar a base de dias exigíveis diretamente.
4. O aviso "Follow-up e CRM medem apenas Contas e Oportunidades…" vira "O follow-up mede apenas Contas e Oportunidades…".

## Validação

- `bunx tsgo --noEmit` sem erros.
- `bunx vitest run src/test/acompanhamentoPdf.test.ts` (6 testes) passando.
- Build OK em `/tmp/observability/build-errors.log`.
- Playwright no preview: conferir que a seção 03 mostra apenas "Follow-up feito × não feito" e que "CRM atualizado × desatualizado" não aparece mais na tela.
