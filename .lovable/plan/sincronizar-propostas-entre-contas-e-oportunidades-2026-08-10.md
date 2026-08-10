# Sincronizar propostas entre Contas e Oportunidades

## Objetivo

Toda proposta passa a existir nos dois lugares: criada na Oportunidade, aparece automaticamente em Propostas da conta do cliente; criada/atualizada na Conta, aparece na aba Propostas da oportunidade vinculada. Status, valor, imóvel e data ficam sempre iguais nos dois lados.

## Situação atual (verificada)

- São duas tabelas independentes, sem nenhum vínculo entre elas: `conta_propostas` (6 registros: 3 pendente, 1 aceita, 2 recusada) e `oportunidade_propostas` (0 registros).
- Os status também são diferentes: a conta só aceita "pendente / aceita / recusada"; a oportunidade tem 8 status (em preparação, enviada, em análise, contraproposta, aceita, recusada, expirada, cancelada).

## O que será feito

### 1. Status unificados
Ampliar os status da proposta da conta para a mesma lista da oportunidade (em preparação, enviada, em análise, contraproposta, aceita, recusada, expirada, cancelada), mantendo "pendente" como legado. O seletor e os selos coloridos da aba Propostas da conta passam a mostrar essa lista completa (inclusive "Em análise", que hoje não existe lá).

### 2. Vínculo e espelhamento automático (no banco)
- Cada proposta guarda a referência da sua "gêmea" no outro módulo.
- Proposta criada na Oportunidade → cria automaticamente a proposta correspondente na conta vinculada (valor proposto, imóvel, data, status, descrição resumida).
- Proposta criada na Conta → cria a correspondente na oportunidade escolhida.
- Alteração de status/valor/imóvel em qualquer um dos lados atualiza o outro; exclusão de um lado remove o espelho.

### 3. Escolha da oportunidade na aba Propostas da conta
No formulário de proposta da conta entra um campo "Oportunidade" listando as oportunidades ativas daquela conta:
- se houver só uma ativa, vem selecionada automaticamente;
- se não houver nenhuma, a proposta é salva só na conta (sem espelho), como hoje.

Cada card de proposta mostra um selo indicando a oportunidade de origem/vínculo, com link para abri-la.

### 4. Propostas já existentes
Migração de dados dos 6 registros atuais: os que pertencem a uma conta com oportunidade ativa única passam a ter espelho criado na aba Propostas da oportunidade, preservando status e valores. Os demais ficam apenas na conta.

## Detalhes técnicos

- Migração:
  - `conta_propostas`: novas colunas `oportunidade_id`, `oportunidade_proposta_id`; troca do CHECK de status pela lista ampliada.
  - `oportunidade_propostas`: nova coluna `conta_proposta_id`.
  - Funções `sync_proposta_conta_to_oportunidade()` e `sync_proposta_oportunidade_to_conta()` (SECURITY DEFINER, `search_path=public`) em triggers AFTER INSERT/UPDATE/DELETE nas duas tabelas, com guarda anti-recursão (só grava no espelho quando os campos realmente divergem) e sem alterar `created_by`.
  - Backfill dos registros existentes no fim da migração.
- Frontend:
  - `src/components/contas/ContaPropostas.tsx`: novos status no schema Zod, no `STATUS_META` e no seletor; campo de oportunidade (carregado de `oportunidades` ativas da conta); selo de vínculo.
  - `src/lib/oportunidadesFunil.ts`: reutilizar `STATUS_PROPOSTA` como fonte única dos rótulos.
  - `src/components/oportunidades/OportunidadeDetailDialog.tsx`: sem mudança de lógica; a aba Propostas passa a exibir também as espelhadas vindas da conta.
