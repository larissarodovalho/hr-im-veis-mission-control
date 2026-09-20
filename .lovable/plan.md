# Por que "Sem retorno", "Sem interesse", "Desqualificado" e "Encerrado" aparecem zerados

## O que foi verificado

Consultei a base antes de propor a correção:

- Os desfechos que os corretores realmente registram estão na **etapa do funil**: 257 contas em "Sem retorno", 40 em "Contato cancelado", 7 em "Perdido".
- O relatório, porém, procura esses desfechos em **outro campo** (o status de qualificação), que na base só tem os valores "pendente", "oportunidade futura" e "oportunidade ativa" — nunca "sem retorno", "sem interesse" ou "encerrado". Por isso a contagem dá sempre zero.
- "Desqualificado" tem 26 contas marcadas, mas quando a conta é desqualificada ela deixa de ser considerada ativa e sai do cálculo no mesmo momento — então também nunca aparece.
- Não há nenhuma classificação manual gravada até hoje, então não existe outra fonte que pudesse preencher esses quadros.

Resumo: os quadros não estão quebrados na tela — eles nunca recebem número porque a medição procura o desfecho no lugar errado e descarta a conta justamente no dia em que o desfecho acontece.

## O que será feito

1. Passar a ler os desfechos de onde eles são realmente registrados:
   - Etapa "Sem retorno" → quadro **Sem retorno**
   - Etapa "Contato cancelado" ou conta cancelada (com motivo de cancelamento) → quadro **Encerrado**
   - Conta desqualificada / com motivo de desclassificação → quadro **Desqualificado**
   - Motivo de cancelamento/desclassificação que indique desistência do cliente → quadro **Sem interesse**
   - Etapa "Perdido" continua como **Etapa antiga**, como hoje.
2. Contar o desfecho no dia em que ele foi registrado, mesmo que a conta já esteja encerrada — hoje ela é descartada nesse instante. Contas já encerradas em dias anteriores continuam fora (não geram cobrança de follow-up todo dia).
3. Manter tudo o mais igual: CRM atualizado × desatualizado e follow-up seguem a leitura geral do período que já está na tela, e nenhum dado de conta, responsável, etapa ou oportunidade é alterado.
4. Refletir a mesma leitura no PDF e na planilha, e ajustar a legenda para explicar de onde vem cada desfecho.

## Detalhes técnicos

- Nova migração revisando a RPC `acompanhamento_apurar_diario()` (sobre a 0011):
  - `classificacao_base` passa a considerar `etapa_funil IN ('sem_retorno','contato_cancelado')`, `cancelado_em`, `desclassificada`/`motivo_desclassificacao`, além do atual `qualificacao_status` (mantido como fallback).
  - `exigivel` ganha a exceção do "dia do desfecho": a conta entra no denominador no dia em que `cancelado_em` / `qualificacao_em` / `updated_at` marcam a mudança, ainda que `ativa=false` a partir dali.
  - Sem retorno/sem interesse/desqualificado/encerrado contam uma vez por conta (no dia do desfecho), evitando inflar o denominador diário.
- `AcompanhamentoCorretoresReport.tsx`: nenhuma mudança estrutural; apenas texto de apoio dos quadros de desfecho ("contado no dia em que o desfecho foi registrado").
- `acompanhamentoPdf.ts`: legenda de cada desfecho atualizada com a origem do dado.
- Testes em `src/test/acompanhamentoPdf.test.ts` + validação por consulta dos novos totais por corretor, comparando tela, PDF e CSV.
