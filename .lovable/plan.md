# Taxa de incidência só com CRM e follow-up

## O que muda

Na aba Acompanhamento, seção "03 · Taxa de incidência", saem os quadros de:
sem retorno, sem interesse, desqualificado, encerrado, oportunidade futura,
oportunidade criada (virando oportunidade), ciclo em andamento, etapa antiga e revisar.

Ficam apenas dois quadros, lado a lado:
- CRM atualizado × desatualizado
- Follow-up feito × não feito

Cada um mantém a barra verde/vermelha por corretor, com percentual, quantidade e o total considerado no período.

## O que continua igual

- O retrato por corretor (seção 02), a lista conta a conta (seção 05) e os demais blocos seguem mostrando essas classificações normalmente.
- O cálculo no servidor não muda; muda só o que a seção 03 exibe.

## PDF e planilha

- O PDF imprime a seção 03 apenas com os dois quadros mantidos.
- A planilha da seção 03 exporta somente as colunas de CRM e follow-up; as colunas das classificações removidas saem.

## Texto de apoio

- O aviso de que "sem retorno, sem interesse, desqualificado e encerrado são contados uma vez por cliente" sai da seção 03 (deixa de ter função ali).
- A legenda do fim do relatório mantém a explicação de todas as classificações, porque elas continuam aparecendo nas outras seções.

## Detalhes técnicos

- `src/components/reports/AcompanhamentoCorretoresReport.tsx`: na seção 03, restringir a lista renderizada a `crm_desatualizado` e `falta_followup` (sem alterar `CLASSIFICACOES_ACOMPANHAMENTO`, usada por outras seções); remover a nota sobre desfechos por cliente e o código que ficar sem uso nessa seção (`DESFECHOS_POR_CONTA`, grade dos quadros menores).
- `src/lib/acompanhamentoPdf.ts`: aplicar o mesmo filtro em `incidencias`, mantendo `barraGeralPdf` para os dois quadros.
- CSV: remover as colunas da seção 03 das classificações retiradas.
- Validação: typecheck, `bunx vitest run src/test/acompanhamentoPdf.test.ts`, build e conferência visual da aba.
