# Metas 2026 por peso (corretores + HRX) e progresso na Performance

## O que muda para você
- A janela **Metas de VGV** passa a ter a **meta total do ano** e uma tabela igual ao seu documento: Canal / Corretor, Peso, % da meta e Meta do ano, com a linha TOTAL.
- As metas de 2026 já vêm lançadas:
  - Carteira Hans: peso 6, 28,57%, R$ 25.142.857,14
  - Corretor Douglas: peso 4, 19,05%, R$ 16.761.904,76
  - Corretor Rafael: peso 4, 19,05%, R$ 16.761.904,76
  - Novo corretor: peso 4, 19,05%, R$ 16.761.904,76 (vaga reservada; depois você escolhe quem é)
  - Carteira HRX (HRX Produções): peso 3, 14,29%, R$ 12.571.428,58
  - Total: R$ 88.000.000,00
- Tudo editável, com recálculo automático:
  - Mudar a **meta total** recalcula os valores de todos, mantendo os pesos.
  - Mudar um **peso** recalcula as porcentagens e os valores.
  - Mudar uma **porcentagem** ou um **valor** ajusta aquela linha, e o total e as porcentagens se atualizam.
- Na subaba **Performance**, cada corretor ganha as colunas **Meta do ano**, **VGV realizado** e **% atingido** (com barra). A HRX Produções aparece como linha institucional, só com os valores financeiros.
- O realizado vem das vendas que você lançar em **Faturamento**: corretor vendedor para os corretores, e origem Base HRX (Tráfego/Marketing) para a HRX. Atualiza sozinho quando uma venda é lançada ou alterada.
- Os PDFs do corretor e da HRX usam esses mesmos números.

## Detalhes técnicos
- Migração: coluna `peso numeric` em `metas_vgv` e `metas_institucionais`; nova tabela `metas_vgv_ano` (ano único, `meta_total`) e tabela `metas_vgv_vagas` (ano, rótulo, peso, meta_vgv, corretor_id opcional) para "Novo corretor"; GRANT, RLS (staff lê, admin escreve), realtime.
- Lançamento inicial via inserção de dados: Hans, Douglas Torres e Rafael Filimberti em `metas_vgv`; HRX em `metas_institucionais`; vaga "Novo corretor"; total 88.000.000 em `metas_vgv_ano`.
- `MetasVgvDialog.tsx`: reescrito com tabela de peso, % e valor e recálculo no próprio diálogo; Hans volta a aparecer; Larissa continua fora.
- `Reports.tsx`: colunas de meta na tabela da Performance a partir de `carregarMetasVgv()`; `metas_institucionais` e as novas tabelas adicionadas ao canal `reports-sync`.
