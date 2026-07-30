# Estrutura atual do funil de Oportunidades de Negócio — MAPA INFORMATIVO (sem alterações)

Este documento descreve o estado atual do funil de Oportunidades, que é o próximo passo depois do "Contato estabelecido" das Contas. **Nenhuma implementação** está prevista nesta etapa — aguardar o usuário definir as alterações desejadas.

## 1. Onde vive

- Aba **Imóveis → subaba "Oportunidades de Negócio"** (`/crm/imoveis`), componente `src/pages/imoveis/OportunidadesTab.tsx`.
- Não é uma aba de topo do CRM — está dentro de Imóveis.

## 2. As 6 colunas do Kanban (ordem atual)

```text
1. Nova
2. Buscando imóvel
3. Visita agendada
4. Em proposta
5. Ganha            (final — troféu)
6. Perdida          (final)
```

- Etapa gravada em `oportunidades.estagio` (`nova`, `buscando`, `visita`, `proposta`, `ganha`, `perdida`).
- **Atenção**: os valores são travados por `CHECK constraint` no banco — renomear, adicionar ou remover etapas exige migração SQL, não só mudança de rótulo.
- Movimentação: arrastar e soltar no Kanban ou clicar no card (EditarOportunidadeDialog).
- Badge "X ativas" conta tudo que não está em Ganha/Perdida.

## 3. Dados de cada oportunidade (tabela `oportunidades`)

- **Cliente**: `cliente_tipo` (lead **ou** conta) + `cliente_id` — uma oportunidade pode nascer de um lead direto ou de uma conta.
- Título, descrição da busca, valor alvo, tipo de imóvel, cidade, bairro.
- **Prioridade**: baixa / média / alta (badge colorido no card).
- **Corretor** responsável (`corretor_id`).
- Observações, criado por, datas.
- **Imóveis vinculados**: tabela `oportunidade_imoveis` (oportunidade ↔ imóvel, com grau de interesse baixo/médio/alto e observação) — alimenta o matching de imóveis para o cliente.

## 4. O que aparece no card

- Título + badge de prioridade (🔥 alta)
- Nome do cliente (clicável → detalhe do lead ou da conta)
- Cidade/bairro, valor alvo, quantidade de imóveis vinculados, corretor

## 5. Como as oportunidades entram hoje

| Origem | Como |
|---|---|
| Botão "Nova oportunidade" | Manual: escolhe lead ou conta (via RPCs `list_leads_min`/`list_contas_min`), preenche busca e vincula imóveis |
| Conta em "Contato estabelecido" | **Não cria oportunidade automaticamente** — o "Destino comercial: Comprar — Oportunidade" só grava `destino_comercial` na conta + nota no histórico. A criação da oportunidade é manual |

## 6. Pontes e sobreposições com os outros funis

- **Contas**: o destino "Comprar — Oportunidade" é hoje apenas um marcador; a ponte real (criar oportunidade a partir da conta) é manual.
- **Etapas legadas de Contas** (Visita, Proposta, Fechado) sobrepõem conceitualmente as etapas de Oportunidades — ficaram preservadas em Contas exatamente à espera deste módulo.
- **Fechamento**: "Ganha" **não** registra automaticamente em `conta_fechamentos` nem atualiza a conta — são fluxos separados hoje.
- **Vendas** (`NovaVendaDialog`, subaba Vendidos) é outro fluxo paralelo de fechamento de imóvel, não ligado ao estagio "Ganha".

## 7. Regras de visibilidade (banco)

- Todo staff vê todas as oportunidades; criar exige ser staff; editar: admin, corretor responsável ou criador; excluir: só admin.

## 8. Relatórios ligados

- Não há relatório específico de oportunidades hoje (Relatórios cobrem funil de contas, propostas, fechamentos, faturamento, imóveis).

## 9. Pontos de atenção para a reestrutura

1. `estagio` tem CHECK constraint — qualquer mudança de etapas precisa de migração.
2. Falta a ponte automática Conta (Contato estabelecido) → Oportunidade.
3. "Ganha" não alimenta fechamentos/vendas — decidir se integra.
4. Oportunidade aceita lead direto — avaliar se continua permitido ou se passa a exigir conta.
5. Localização dentro de Imóveis — avaliar se vira aba própria no CRM.

## Próximo passo

Aguardar o usuário indicar as alterações desejadas (etapas, ponte com Contas, integração com fechamento/vendas, localização no menu, relatórios). Nenhum arquivo será modificado nesta etapa.