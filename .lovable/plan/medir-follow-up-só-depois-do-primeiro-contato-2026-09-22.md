# Medir follow-up só depois do primeiro contato

Hoje o acompanhamento cobra atividade de toda conta ativa, inclusive as que ainda estão na primeira coluna do funil ("A contatar"), que nunca receberam mensagem. Isso infla o "não feito" e o "CRM desatualizado".

Situação atual da base: 589 contas em "A contatar" (só 43 têm alguma interação registrada), contra 602 em "Contato estabelecido", 257 "Sem retorno", 40 "Contato cancelado", 24 "Contatado".

## Regra nova

A conta entra na medição de follow-up e de CRM a partir do dia em que foi contatada:

- Dia do primeiro contato = data da primeira interação registrada na conta.
- Se a conta já saiu de "A contatar" mas não tem interação registrada, vale a data em que o registro mudou (última atualização) como entrada na medição.
- Conta ainda em "A contatar" e sem nenhuma interação: fica fora dos quadros de follow-up e CRM, em todo o período.
- Dias anteriores ao primeiro contato não contam para nada (nem numerador, nem denominador).

Nada muda no funil, nas carteiras ou nas atribuições — só na conta do que é cobrado.

## Onde aparece

- Seção 03 (Taxa de incidência): percentuais de "CRM atualizado × desatualizado" e "Follow-up feito × não feito" passam a considerar só contas já contatadas.
- Seção 02 (Retrato por corretor) e seção 05 (conta a conta) seguem a mesma base.
- CSV e PDF acompanham automaticamente.
- Aviso curto na seção 03 e no PDF: "A medição começa a partir do primeiro contato. Contas ainda a contatar não entram."

## Detalhe técnico

- Migração alterando `public.acompanhamento_apurar_diario`: nova CTE `primeiro_contato` (min de `interacoes.created_at` por conta, em America/Cuiaba) e, como alternativa, `updated_at` quando `etapa_funil <> 'a_contatar'` e não há interação.
- Em `grade_base`, o join com os dias passa a exigir `d.dia >= dia_primeiro_contato`; contas sem data de primeiro contato não geram linhas.
- `exigivel_atividade` e `crm_atualizado` mantêm a lógica atual, só que sobre a grade reduzida; o caso `ultima_interacao_em IS NULL` deixa de ocorrer para contas nunca contatadas.
- Texto do aviso em `AcompanhamentoCorretoresReport.tsx` (seção 03) e em `acompanhamentoPdf.ts`.
- Validação: typecheck, testes de `acompanhamentoPdf`, build e conferência dos totais na tela após o recálculo.
