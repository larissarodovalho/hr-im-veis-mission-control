# CRM atualizado versus desatualizado no Acompanhamento

## Objetivo
Transformar a caixinha **CRM desatualizado**, na seção **03 · Taxa de incidência**, em uma leitura direta da qualidade de atualização da carteira de cada corretor.

## Regra confirmada
- Hoje, **CRM desatualizado** identifica uma conta que já avançou da etapa inicial, mas não possui nenhuma interação registrada para comprovar o atendimento.
- Para cada corretor, **Desatualizado** será a quantidade já diagnosticada como `CRM desatualizado`.
- **Atualizado** será o complemento da carteira analisada: `total de contas − CRM desatualizado`.
- As duas parcelas sempre fecharão **100% da carteira do corretor**.
- A classificação manual feita por admin/gestor continuará prevalecendo; portanto, ela também será respeitada nesse comparativo.
- Os percentuais serão recalculados com os dados atuais sempre que o relatório for carregado ou atualizado, respeitando período e filtros de origem selecionados.

## O que será alterado

1. **Comparativo visual na caixinha CRM desatualizado**
   - Substituir a barra simples dessa classificação por uma barra horizontal empilhada.
   - Exibir em vermelho a parcela **Desatualizado** e em verde a parcela **Atualizado**.
   - Uma faixa empurrará a outra conforme as proporções mudarem, fechando 100%.
   - Mostrar, para cada corretor, os dois percentuais e as respectivas quantidades, sem alterar as demais caixinhas da Taxa de incidência.
   - Tratar carteira vazia sem divisão inválida e com leitura clara de 0 contas.

2. **Explicação no próprio relatório**
   - Deixar explícito que “CRM desatualizado” significa conta avançada sem interação registrada que comprove o atendimento.
   - Explicar que “Atualizado” é o restante da carteira analisada que não recebeu esse diagnóstico.
   - Manter a observação sobre prevalência da classificação manual.

3. **PDF**
   - Reproduzir o comparativo Atualizado × Desatualizado por corretor no relatório exportado.
   - Usar identificação verde e vermelha, com percentuais e quantidades legíveis também na impressão.
   - Atualizar a legenda final com a mesma regra exibida na tela.

4. **CSV**
   - Acrescentar, por corretor, as colunas de quantidade e percentual de CRM atualizado e desatualizado.
   - Garantir que os dois percentuais fechem 100% quando houver contas na carteira.

## Detalhes técnicos
- Reaproveitar o total por corretor e o campo `crm_desatualizado` já retornados pelo relatório; não será necessário gravar dados novos.
- Centralizar o cálculo do complemento para evitar diferenças entre tela, PDF e CSV.
- Usar as cores semânticas do CRM para os estados positivo e de alerta.
- Manter filtros de período e origem, fuso de Cuiabá e todas as demais classificações inalterados.

## Validação
- Conferir corretores com 0%, percentual intermediário e 100% de CRM desatualizado.
- Confirmar que vermelho + verde fecha 100% e que quantidades fecham com o total da carteira.
- Validar recálculo ao trocar período ou origem da carteira.
- Comparar os mesmos valores na tela, no PDF e no CSV.
- Verificar legibilidade em computador, celular e páginas do PDF.
