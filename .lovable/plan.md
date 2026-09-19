# Detalhamento por busca e seleção de clientes

## Objetivo
Transformar o bloco **05 · Conta a conta** em uma consulta sob demanda: nenhum cliente aparece ao abrir a página; a equipe pesquisa e filtra para encontrar somente quem deseja analisar.

## Experiência na tela
- Substituir a listagem automática por uma barra de busca por nome do cliente, acompanhada dos filtros **Corretor** e **Classificação**.
- Não exibir clientes até existir uma busca ou pelo menos um filtro específico aplicado.
- Mostrar nos resultados a classificação, etapa atual, corretor, interações, dias sem contato e observação já disponíveis hoje.
- Permitir marcar e desmarcar clientes individualmente, selecionar os resultados visíveis e limpar toda a seleção.
- Manter os clientes já selecionados mesmo ao trocar a busca ou os filtros, com contador visível, por exemplo: **10 clientes selecionados**.
- Exibir uma área resumida dos selecionados para revisão e remoção antes da exportação.
- Preservar a reclassificação manual disponível para admin e gestor.

## Exportações
- Manter o botão atual de PDF geral sem alterar o conteúdo das seções 01 a 05.
- Criar um botão separado **PDF dos selecionados**, habilitado somente quando houver clientes marcados.
- O PDF separado conterá apenas os clientes escolhidos, com identificação do período, origem da carteira, classificação, etapa, corretor, contatos e observações.
- Fazer o CSV do bloco 05 exportar somente os clientes selecionados, também desabilitado quando a seleção estiver vazia.
- Usar um nome de arquivo que deixe claro que se trata de uma seleção de clientes.

## Estados e orientações
- Estado inicial: mensagem curta orientando a buscar pelo cliente ou escolher um filtro.
- Busca/filtro sem resultado: informar que nenhum cliente foi encontrado.
- Busca/filtro com resultado: mostrar somente os registros correspondentes, sem carregar visualmente toda a carteira.
- Seleção vazia: explicar que é necessário marcar pelo menos um cliente para gerar o relatório específico.

## Detalhes técnicos
- Aplicar busca e filtros sobre os dados de detalhamento já retornados pelo Acompanhamento, sem alterar os indicadores gerais.
- Controlar a seleção por identificador da conta para evitar duplicidade ao alternar filtros.
- Separar claramente os dados do PDF geral dos dados do novo PDF dos selecionados.
- Validar a experiência em computador e celular, além de gerar e revisar visualmente todas as páginas do novo PDF.
