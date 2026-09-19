# Exportação em PDF e legenda do Acompanhamento

## Objetivo
Acrescentar à aba **Acompanhamento** um relatório em PDF pronto para compartilhar com a gestão e uma legenda de consulta no fim da página, sem alterar os demais relatórios.

## O que será feito

1. **Botão “Gerar PDF”**
   - Adicionar a ação no cabeçalho do Acompanhamento.
   - Gerar um PDF com identidade visual da HR Imóveis, período selecionado, data de geração e prazo máximo entre contatos usado no diagnóstico.
   - Usar os mesmos números já exibidos na tela, evitando divergência entre o CRM e o arquivo.

2. **Conteúdo do relatório**
   - Entrada dos leads e indicadores principais.
   - Retrato por corretor.
   - Taxa de incidência de cada classificação.
   - Três leituras gerenciais.
   - Detalhamento “Conta a conta”.
   - O detalhamento respeitará os filtros de corretor e classificação aplicados na tela; o PDF identificará esses filtros no cabeçalho.
   - Quebrar tabelas longas em várias páginas, repetindo seus cabeçalhos e mantendo números, nomes e observações legíveis.

3. **Legenda no fim da página**
   - Criar uma seção “Entenda este relatório” após o detalhamento.
   - Explicar, em linguagem simples: período analisado, prazo máximo entre contatos, diagnóstico, triagem, conta em carteira, oportunidade, travadas por follow-up, proporção travada, dias médios parado e taxa de incidência.
   - Explicar o significado dos três grupos: **Falha de processo**, **Desfecho do cliente** e **Em jogo**.
   - Explicar cada uma das oito classificações: Falta de follow-up, CRM desatualizado, Sem retorno, Sem interesse, Desqualificado, Encerrado, Virando oportunidade e Ciclo em andamento.
   - Informar que a taxa de incidência de cada caixinha é calculada sobre a carteira do respectivo corretor.
   - Manter a observação de que uma classificação manual feita por admin ou gestor prevalece sobre o diagnóstico automático.

4. **Legenda no PDF**
   - Repetir a mesma referência explicativa nas páginas finais do arquivo, para que o relatório seja compreensível mesmo fora do CRM.
   - Incluir rodapé com HR Imóveis, período e numeração de páginas.

## Detalhes técnicos
- Reutilizar a biblioteca de PDF já instalada no projeto.
- Isolar a montagem do documento em um utilitário próprio para manter a tela organizada.
- Gerar o arquivo no navegador, sem gravar dados novos no banco.
- Nome sugerido: `acompanhamento-corretores-<periodo>.pdf`.
- Exibir estado de geração e mensagem de sucesso ou erro no botão.

## Validação
- Conferir o PDF com e sem filtros, incluindo uma lista longa de contas.
- Verificar todas as páginas renderizadas para evitar cortes, sobreposição e texto ilegível.
- Confirmar que totais, percentuais, período, prazo e filtros correspondem ao que aparece na tela.
- Validar a tela em desktop e celular e conferir que a nova legenda não prejudica as seções existentes.
