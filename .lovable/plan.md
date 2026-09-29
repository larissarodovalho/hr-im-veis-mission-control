# Corrigir o erro do Acompanhamento e revisar a aba Relatórios

## Causa (confirmada)
Ao abrir Acompanhamento, o servidor responde com erro: o cálculo `acompanhamento_corretores` lista manualmente cada campo da conta no agrupamento. Quando o standby foi criado, os novos campos (`standby_ate`, `standby_desde`, `standby_motivo`, `standby_por`) não entraram nessa lista, e o cálculo passou a falhar. O outro cálculo (`acompanhamento_apurar_diario`) está funcionando.

## Correção
- Nova migração que recria `acompanhamento_corretores` idêntica à atual, trocando o agrupamento longo por `GROUP BY c.id, m.classificacao, m.observacao` (a chave da conta cobre todos os campos). Assim, novos campos futuros na conta não quebram mais o relatório.
- Nenhuma regra de medição muda.

## Revisão das subabas de Relatórios
- Procurar no banco outras funções de relatório com o mesmo padrão de agrupamento por lista de campos (`carteira_relatorio_*`, `acompanhamento_*`, etc.) e aplicar a mesma correção se houver.
- Abrir no preview cada subaba de Relatórios (Funil, Performance, Acompanhamento, Faturamento, Imóveis, Carteira e demais), registrando erros de servidor e de tela; corrigir o que aparecer.
- Aviso secundário: "Function components cannot be given refs" no Acompanhamento — ajustar se for simples (não impede o carregamento).

## Validação
- Chamada direta ao cálculo retornando dados; Acompanhamento carregando no preview; typecheck, testes e build sem erros.
