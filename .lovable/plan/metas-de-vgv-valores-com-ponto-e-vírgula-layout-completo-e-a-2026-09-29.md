# Metas de VGV: valores com ponto e vírgula, layout completo e adicionar/remover

## O que muda para você
- **Valores no formato brasileiro**: meta total e metas de cada linha aparecem e são digitadas como `25.142.857,14`. Porcentagens como `28,57`. Não haverá mais a linha cinza repetindo o valor embaixo.
- **Tudo visível**: janela mais larga, campos de peso e % com largura suficiente para ler o número inteiro, e a lista mostra todas as linhas, incluindo a **Carteira HRX** e a linha **TOTAL** sempre fixa no final.
- **Adicionar corretor**: botão **+ Adicionar** abre uma lista com os corretores que ainda não estão na tabela, além da opção **Vaga (novo corretor)** com nome livre. A nova linha entra com peso 0.
- **Remover**: ícone de lixeira em cada linha, exceto na HRX. Ao remover, a meta daquela pessoa é apagada ao salvar e o total é recalculado.
- A tabela passa a mostrar só quem tem meta (Hans, Rafael, Douglas, a vaga e a HRX). Gabriel, que hoje aparece sem meta, só entra se você adicionar.
- Hoje o Gabriel Souza aparece duas vezes na tabela: a vaga "Novo corretor" foi renomeada para Gabriel Souza. Com o botão Adicionar, você pode apagar essa vaga e adicionar o Gabriel de verdade, e aí o realizado dele passa a contar na Performance.

## Detalhes técnicos
- `MetasVgvDialog.tsx`: campo de moeda com máscara pt-BR (formata ao sair do campo, aceita `.` e `,` ao digitar); % com vírgula; `max-w-4xl`, colunas com largura fixa, rolagem só no corpo com TOTAL no rodapé.
- Linhas carregadas a partir das metas existentes, e não mais de todos os corretores. Adicionar usa o seletor com os corretores restantes ou a opção de vaga (cria a vaga ao salvar). Remover apaga de `metas_vgv` / `metas_vgv_vagas` ao salvar.
