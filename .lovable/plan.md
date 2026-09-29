# Remover Larissa Rodovalho da Performance por corretor

## Situação atual
A Larissa Rodovalho (admin) aparece na tabela da subaba Performance com todos os números zerados e sem meta. Hoje ela só é excluída da lista de corretores dentro da janela "Metas de VGV" — a tabela, o seletor de corretor para PDF individual e o "PDF de todos" ainda a incluem.

## O que será feito
- Em `src/pages/Reports.tsx`, criar uma lista derivada `statsCorretores` que exclui a Larissa Rodovalho (pelo nome, mesmo critério já usado na janela de metas).
- Usar essa lista em todos os lugares da Performance:
  - tabela de desempenho por corretor;
  - seletor de corretor para gerar o PDF individual;
  - botão "PDF de todos" (ela sai do relatório consolidado);
  - janela "Metas de VGV" (o filtro atual vira redundante e pode ser simplificado).
- A linha institucional **HRX Produções** no fim da tabela não muda.
- Nada muda nas outras subabas: a Larissa continua aparecendo no ranking de Faturamento quando participa de uma venda, e contas/oportunidades atribuídas a ela continuam contando normalmente nos funis.

## Validação
- Typecheck, testes e build.
- Conferir no preview que a tabela da Performance mostra apenas Hans, Gabriel, Rafael e Douglas, e que os PDFs (individual e de todos) também não trazem a Larissa.
