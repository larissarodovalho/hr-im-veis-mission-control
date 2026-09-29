# Meta anual da HRX Produções

## Objetivo
Substituir a entrada de Larissa pela meta institucional **HRX Produções**, sem relacioná-la ao desempenho operacional de uma pessoa.

## Alterações
- No cadastro de **Metas de VGV**, retirar Larissa da posição atual e exibir **HRX Produções**.
- Guardar a meta anual da HRX como uma meta institucional própria, separada das metas pessoais dos corretores.
- Calcular o realizado da HRX somando somente o valor das vendas cuja origem seja **Base HRX (Tráfego/Marketing)** e cuja data esteja no ano escolhido.
- Mostrar para HRX Produções apenas os indicadores financeiros: **meta anual**, **VGV realizado**, **percentual atingido** e **valor restante**.
- Não incluir na meta da HRX atendimentos, leads recebidos, tarefas, follow-up, folha, comissões ou outros indicadores pessoais.
- Manter as metas individuais e seus cálculos atuais sem alteração.
- Incluir o comparativo da HRX Produções na exportação consolidada em PDF, identificado como meta institucional.

## Regras e validação
- A origem `base_hrx` será a fonte única do realizado da HRX Produções.
- Vendas de origem do corretor ou base institucional não entram nesse total.
- A atualização continuará automática quando uma venda de marketing for criada ou alterada.
- Validar o cadastro anual, o cálculo acumulado por mês e o PDF com anos com e sem vendas de marketing.

## Detalhes técnicos
- Ajustar a estrutura de metas para distinguir metas pessoais de uma meta institucional, sem usar o cadastro de Larissa como vínculo técnico.
- Preservar as regras atuais de acesso: equipe autorizada consulta e somente administrador altera metas.
