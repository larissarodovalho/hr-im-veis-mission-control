# Cadastro rápido de corretor parceiro na Nova Venda

## O que muda
- Ao lado do campo **Corretor parceiro** na janela de Nova/Editar venda, aparece um botão **+**.
- Ao clicar, abre uma janelinha rápida com: **Nome** (obrigatório), **Telefone**, **CRECI** e **% de comissão padrão** (opcionais).
- Ao salvar, o parceiro é cadastrado e **já fica selecionado na venda**, sem sair da tela nem perder o que já foi preenchido.
- Ele passa a aparecer também na aba **Imóveis → Parceiros**, onde dá para completar os dados depois (e-mail, documento, dados bancários).
- A divisão de comissões da venda continua igual, agora com o parceiro escolhido.

## Detalhes técnicos
- `NovaVendaDialog.tsx`: botão `Plus` junto ao `SearchableSelect`; mini-dialog que faz `insert` em `corretores_parceiros` (`nome, telefone, creci, comissao_padrao, ativo: true, created_by`) com `.select("id,nome").single()`, adiciona à lista `parceiros` e define `form.corretor_parceiro_id`.
- Se já existir parceiro ativo com o mesmo nome, avisa e seleciona o existente em vez de duplicar.
- Sem mudança no banco.
