# Botão + para cadastrar o cliente direto na venda

## O que muda
- Ao lado do campo **Cliente** na janela de Nova/Editar venda, aparece um botão **+**.
- Ao clicar, abre a mesma janela de **Nova conta** usada na aba Contas (nome, telefone, e-mail, CPF/CNPJ etc.), com a mesma verificação de duplicidade: se o cliente já existir na base, o sistema avisa antes de criar outro.
- Ao salvar, a conta é criada e **já fica selecionada como cliente da venda**, sem perder o que já foi preenchido.
- A conta passa a aparecer normalmente na aba Contas.
- A opção atual "Digitar nome manualmente" continua existindo.

## Detalhes técnicos
- `NovaVendaDialog.tsx`: botão `Plus` junto ao `SearchableSelect` de cliente; renderiza `NovaContaDialog`; no `onCreated(id)` busca `id,nome,telefone` da nova conta, adiciona à lista `contas` e define `form.conta_id` (sai do modo manual).
- Sem mudança no banco.
