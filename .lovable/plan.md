# Separar imóveis não publicados e detalhar os vendidos

## Alterações

- Manter todas as abas atuais da área de Imóveis.
- Criar a aba **Não publicados** ao lado de **Disponíveis**, com contador próprio.
- Mostrar nessa nova aba os imóveis cuja publicação está desligada (`publicado = false`). Hoje existem 16 imóveis nessa condição, todos com status Disponível.
- Fazer a aba **Inativos** voltar a mostrar somente imóveis com status Inativo ou Indisponível, sem misturá-los aos não publicados.
- Continuar excluindo os não publicados da aba **Disponíveis**, evitando duplicidade entre as listas.
- Ajustar o resumo de quantidades no topo para separar Disponíveis, Não publicados e Inativos.

## Aba Vendidos

- Ampliar os dados carregados do imóvel vinculado a cada venda.
- Exibir claramente na listagem:
  - código do imóvel;
  - título/descrição de identificação;
  - tipo do imóvel, como Casa, Sobrado ou Terreno.
- Preservar os dados e ações existentes da venda, incluindo cliente, valores, corretor, pagamento, data, edição e contrato.

## Validação

- Conferir que cada imóvel aparece na aba correta e sem duplicidade.
- Conferir a navegação por URL para a nova aba.
- Abrir a aba Vendidos e verificar código, descrição e tipo do imóvel vinculado.
- Validar a página em tela ampla e estreita, além dos testes e da compilação do projeto.
