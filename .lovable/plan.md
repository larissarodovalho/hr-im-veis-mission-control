## Objetivo
No diálogo "Nova venda", permitir registrar a venda de um imóvel **não divulgado** (que não existe no cadastro). O usuário poderá criar um imóvel mínimo na hora, sem sair do fluxo, e a venda será vinculada normalmente a ele.

## Mudanças

### `src/components/imoveis/NovaVendaDialog.tsx`
1. Abaixo do `SearchableSelect` de Imóvel, adicionar um link pequeno: **"Imóvel não cadastrado? Adicionar manualmente"**.
2. Ao clicar, alterna para um bloco compacto com os campos mínimos necessários:
   - **Título** * (ex.: "Casa Jardim Europa")
   - **Tipo** (select: Casa / Apartamento / Terreno / Comercial / Outro)
   - **Finalidade** (select: Venda / Aluguel — pré-preenchida com o tipo da venda)
   - **Endereço** (opcional, uma linha)
   - **Bairro / Cidade** (opcionais, lado a lado)
   - **Valor** (opcional — se vazio, usa o `valor_venda` da venda)
3. Botão **"Cancelar"** volta para o modo de seleção.
4. Ao salvar a venda em modo manual:
   - Primeiro faz `insert` em `imoveis` com `status = 'Não divulgado'` e os campos preenchidos (código é gerado automaticamente pelo trigger existente `imoveis_set_codigo`).
   - Usa o `id` retornado como `imovel_id` da venda.
   - O check "Marcar imóvel como Vendido" continua valendo e atualiza o status para "Vendido" após o insert.
5. Em modo de edição de venda, se a venda já tinha `imovel_id`, o campo abre no modo seleção normal (não exibe o formulário manual).

## Sem alterações de schema
- `imoveis.status` já é texto livre — adicionar o valor "Não divulgado" não requer migração.
- A trigger `imoveis_set_codigo` já gera o código `HR-XXXX` automaticamente.
- `vendas.imovel_id` continua sendo preenchido normalmente.

## Fora de escopo
- Cadastro completo do imóvel (fotos, características, proprietário etc.) — o usuário pode complementar depois na tela de Imóveis.
- Nenhuma mudança na matriz de comissão ou demais campos da venda.
