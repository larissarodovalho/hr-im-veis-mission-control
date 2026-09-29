# Metas anuais de VGV por corretor (meta x realizado)

## O que muda para você
- Na subaba **Performance**, um botão **Metas de VGV** (só aparece para admin) abre uma janela para definir a meta anual de VGV (R$) de cada corretor, escolhendo o ano.
- O **PDF individual do corretor** (e o "PDF de todos") ganha o quadro **Meta x Realizado — VGV AAAA**:
  - Meta anual, VGV realizado no ano, % atingido e quanto falta.
  - Barra de progresso.
  - Tabela mês a mês: VGV de cada mês e o acumulado, comparado com o ritmo esperado (meta / 12 por mês).
- Corretor sem meta cadastrada: o quadro mostra "Meta não definida" e só o realizado.

## Regra do realizado
- VGV = soma do valor das vendas registradas em Faturamento no ano, com data da venda no fuso de Cuiabá.
- Conta para o corretor **vendedor** da venda (mesmo critério do ranking de Faturamento).

## Detalhes técnicos
- Nova tabela `metas_vgv` (corretor_id, ano, meta_vgv numeric, created_by, timestamps; único por corretor+ano), com GRANT, RLS: leitura para staff, escrita apenas `has_role(auth.uid(),'admin')`.
- `Reports.tsx`: diálogo de edição de metas (lista de corretores já usada na Performance) + carga de metas e vendas do ano.
- `performancePdf.ts`: nova seção `metaVgv` (desenho da barra e tabela mensal), usada no PDF individual e no de todos.
- Realtime: incluir `metas_vgv` no canal `reports-sync`.
