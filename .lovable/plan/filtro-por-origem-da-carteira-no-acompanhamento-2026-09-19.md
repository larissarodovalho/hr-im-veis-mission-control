# Filtro por origem da carteira no Acompanhamento

## Objetivo
Adicionar, antes do bloco **01 · Entrada**, um filtro para analisar separadamente:

- **Base HR Imóveis** — contas cujo dono original é a base da HR Imóveis, mesmo após distribuição a outro corretor.
- **Marketing** — contas classificadas como Marketing.
- **Carteira própria do corretor** — contas cujo dono original é o próprio corretor.

A seleção recalculará o relatório inteiro, não apenas a Entrada.

## Implementação

1. **Consolidar a origem da carteira**
   - Usar a categoria Marketing como prioridade para identificar Marketing.
   - Para contas de carteira, usar o dono original registrado no histórico de distribuição.
   - Preservar essa origem mesmo quando a conta trocar de responsável.
   - Tratar contas antigas sem histórico completo com uma regra de compatibilidade baseada no primeiro responsável identificável, sem alterar o responsável atual.

2. **Ampliar o cálculo do Acompanhamento**
   - Adicionar o filtro de origem ao cálculo protegido do relatório.
   - Aplicar a seleção sobre a mesma população de contas usada em totais, corretores, incidências, leituras e detalhamento.
   - Manter o período e o prazo máximo entre contatos funcionando em conjunto com o novo filtro.

3. **Adicionar o controle na tela**
   - Exibir um seletor de múltipla escolha antes de “Para onde foram os leads”.
   - Deixar as três origens selecionadas por padrão, preservando o resultado geral atual.
   - Permitir combinar duas ou três origens e mostrar claramente a seleção ativa.
   - Recarregar todo o diagnóstico ao mudar a seleção.

4. **Atualizar exportações e legenda**
   - Fazer o PDF respeitar as origens selecionadas e registrar o filtro no cabeçalho.
   - Fazer os CSVs refletirem os dados já filtrados.
   - Acrescentar na legenda a definição de Base HR Imóveis, Marketing e Carteira própria do corretor.

5. **Validar**
   - Conferir cada origem isoladamente e combinações entre elas.
   - Confirmar que contas distribuídas continuam pertencendo à origem do dono original.
   - Conferir totais entre tela, conta a conta, CSV e PDF.
   - Testar a visualização em computador e celular.

## Detalhes técnicos
- A função `acompanhamento_corretores` receberá a seleção de origens e devolverá apenas o universo correspondente.
- A classificação será calculada no banco para evitar divergências entre os blocos e as exportações.
- O acesso continuará restrito a administradores e gestores, sem ampliar permissões sobre contas ou históricos.
