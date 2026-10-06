# Clicar no código do imóvel na aba Vendidos abre o cadastro do imóvel

## O que será feito
Na aba **Imóveis → Vendidos**, o código do imóvel (ex.: HR-0002) na coluna "Imóvel vendido" passa a ser clicável: ao clicar, abre a janela **Detalhes do imóvel** — a mesma usada nas outras abas de Imóveis — mostrando o cadastro completo: fotos, status, tipo, valor, endereço, áreas, matrícula, proprietário, corretor, descrição e observações.

## Como (arquivo `src/pages/imoveis/VendidosTab.tsx`)
1. Carregar os imóveis com todos os campos (`select *` em vez de `id,codigo,titulo,descricao,tipo`) para ter os dados completos do cadastro na janela de detalhes.
2. Carregar também os nomes dos proprietários (tabela `contas`) para mostrar "Proprietário" na janela, como nas outras abas.
3. Importar `DetalhesImovelDialog` (o mesmo componente já usado em `Imoveis.tsx`) e adicionar o estado `viewing`.
4. Tornar o código do imóvel um botão com aparência de link (sublinhado no passar do mouse) que abre a janela de detalhes; o resto da linha não muda — a linha continua abrindo a janela da venda, e os botões de editar/excluir continuam funcionando (o clique no código usa `stopPropagation` para não abrir a venda junto).
5. Atualizar o tooltip/curSOR para indicar "Ver cadastro do imóvel".

## O que não muda
- Nada muda no banco de dados nem nas outras abas de Imóveis.
- A janela da venda (cliente, condições de pagamento, contrato PDF) continua abrindo ao clicar na linha, como hoje.
