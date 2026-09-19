# Acompanhamento — excluir não-corretores do "Retrato por corretor"

## Problema
No bloco 02 "Retrato por corretor" da aba Acompanhamento aparecem todos os responsáveis por contas, inclusive quem não é corretor (ex.: Gabriele Nunes, do marketing). O retrato deve medir apenas o trabalho dos corretores.

## O que muda
- Na função `acompanhamento_corretores`, o agrupamento `por_corretor` (que alimenta o bloco 02) passa a incluir somente responsáveis que possuem o papel **corretor** na tabela `user_roles`.
- Responsáveis sem esse papel deixam de aparecer no bloco 02.

## O que NÃO muda
- Totais do diagnóstico (blocos 01, 03, 04) e a tabela "Conta a conta" (bloco 05) continuam incluindo todas as contas em carteira, independentemente do papel do responsável — assim os números gerais não perdem contas.
- Classificação manual, filtros, CSV e prazo configurável permanecem iguais.

## Técnico
- Editar a migration `drizzle/migrations/0000_acompanhamento_corretores.sql` (CREATE OR REPLACE da função): no CTE `por_corretor`, adicionar `WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = responsavel_id AND ur.role = 'corretor')`.
- Aplicar a função atualizada no banco e regenerar types se necessário.
- Validar com typecheck e consulta de teste confirmando que Gabriele some do bloco 02 e as contas dela continuam na tabela conta a conta.
