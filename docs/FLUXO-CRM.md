# Fluxo do CRM — HR Imóveis

Especificação completa da sequência comercial do CRM: abas **Leads**, **Contas** e **Oportunidades**, com etapas, ações, regras de negócio e automações. Documento de referência para implantação do mesmo fluxo em outro CRM.

---

## 1. Visão geral da jornada

O CRM é organizado em três funis sequenciais, cada um em uma aba, com transições automáticas entre eles:

```text
LEAD (entrada e triagem)      CONTA (relacionamento)            OPORTUNIDADE (negócio)
─────────────────────────     ──────────────────────────        ──────────────────────────
Novo Lead                     A contatar                        Nova
Pré-atendimento               Contatado                         Buscando imóvel
Em Contato                    Sem retorno                       Visita agendada
Conversa Ativa                Contato estabelecido              Proposta
Perdido                       Contato cancelado                 Ganha / Perdida

      │ conversão (com verificação de duplicidade e Unificar)
      ▼
  Lead ──────────────────► Conta ──qualificação──► Oportunidade

      Contato estabelecido + destino "Captação/Reunião"
      └──► cria card automático no funil de Captação (aba Imóveis)
```

**Princípio central:** o Lead é a entrada não qualificada; a Conta é o relacionamento duradouro com o cliente (nunca é excluída, mesmo em perdas); a Oportunidade é um negócio específico de compra, vinculado a uma Conta. Uma Conta pode ter várias Oportunidades ao longo do tempo.

---

## 2. Aba Leads

**Função:** receber e triar todo contato novo, garantir o primeiro atendimento dentro do SLA e converter em Conta os leads qualificados.

### 2.1 Etapas do funil (Kanban de 5 colunas)

| # | Etapa | Significado |
|---|-------|-------------|
| 1 | **Novo Lead** | Acabou de entrar na base (qualquer origem) |
| 2 | **Pré-atendimento** | Em fila para o fluxo de tentativas de contato |
| 3 | **Em Contato** | Fluxo de 3 tentativas em andamento |
| 4 | **Conversa Ativa** | Cliente respondeu; corretor assumiu o atendimento |
| 5 | **Perdido** | Desclassificado (com motivo obrigatório) |

As 4 primeiras são etapas ativas de progressão; "Perdido" é saída do funil.

### 2.2 Fluxo de atendimento (SLA de 3 tentativas)

Acompanhado nas etapas Novo Lead, Pré-atendimento e Em Contato, ancorado na **data de entrada do lead**:

| Tentativa | Tipo | Prazo a partir da entrada |
|-----------|------|---------------------------|
| 1ª | Mensagem (WhatsApp) | Imediato (0h) |
| 2ª | Áudio | +24 horas |
| 3ª | Ligação | +48 horas |

Regras:
- Cada tentativa tem status **feita / vencida / pendente** e, quando registrada, recebe selo de **pontualidade**: adiantada, no prazo ou atrasada (tolerância de 1h após o vencimento).
- Situação consolidada do lead: **Sem nenhuma tentativa / No prazo / Atrasado / Fluxo concluído (3/3)** — exibida no painel "Atendimento" da aba, com filtros e ordenação pelo prazo mais urgente.
- O cronograma aparece como **tags no card do lead** (Kanban, lista e detalhe): verde quando feita, contagem regressiva quando pendente, vermelho quando atrasada.

### 2.3 Ações da etapa "Em Contato"

- **Sucesso no contato** — atribui o corretor responsável, move para Conversa Ativa e marca o acompanhamento como "corretor".
- **Sem contato** — cria automaticamente uma tarefa de prioridade Alta com prazo +24h para nova tentativa, sem mudar a etapa.

### 2.4 Atributos do lead

- **Temperatura:** frio 🧊 / morno 🌤️ / quente 🔥 (editável no detalhe).
- **Tipo de acompanhamento:** IA 🤖 / Manual 👤 / Corretor 🧑‍💼 (forma de acompanhamento, não etapa).
- **Origem:** Meta Ads, Google Ads, Chat IA, WhatsApp, Site, Indicação, Manual, Webhook.
- **Interesse:** compra, venda, locação, arrendamento, outro.
- **Responsável e criador** visíveis no card; idade na base e dias sem contato (ociosidade) com cores por faixa (hoje / até 3d / até 7d / mais).

### 2.5 Tarefas com tag de contagem regressiva

- Tarefas podem ser criadas vinculadas ao lead (título, prazo, prioridade, responsável).
- O card exibe badge com countdown: "contatar hoje" / "contatar amanhã" / "em X dias" / "atrasada há X dias".
- **Regra importante:** lead com tarefa futura é considerado "com atendimento programado" — não entra no filtro "Precisam nutrição" nem nos KPIs de ociosidade ("Sem atendimento") do Dashboard.

### 2.6 Filtros e visões

- Visões: Kanban, Lista (tabela) e painel Atendimento (KPIs do fluxo de tentativas).
- Busca por nome/telefone/e-mail; toggle **"Precisam nutrição"** (≥4 dias sem interação e sem tarefa futura); ordenação por recentes ou mais antigos sem contato.

### 2.7 Conversão em Conta (com verificação de duplicidade)

Ao clicar em "Converter em Conta Cliente":

1. **Verificação automática na base de Contas** por telefone, e-mail, CPF/CNPJ **e nome** (normalizado, sem acentos), em toda a base (todos os corretores).
2. **Duplicidade forte** (telefone/e-mail/documento): a conversão é **bloqueada** e o alerta oferece dois caminhos:

    - **Unificar** — mantém a conta existente, vincula o lead a ela e migra todo o histórico (interações, tarefas e reuniões). Não cria conta duplicada.
    - **Editar dados** — corrige os dados do formulário (foco automático no campo).

3. **Duplicidade só por nome**: apenas aviso — mostra o botão Unificar, mas permite converter (pode ser homônimo).
4. **Sem duplicidade**: confirmação em verde "Nenhuma conta duplicada encontrada — pode converter com segurança".
5. Na conversão: a Conta nasce com categoria **Marketing**, etapa **A contatar**, referência ao lead de origem (`lead_id_origem`), e **as interações do lead migram automaticamente** para a conta (trigger no banco, mesma transação).
6. O lead convertido sai das colunas visíveis e passa a exibir selo "Convertido em conta"; é excluído dos KPIs de ociosidade e etapa.

### 2.8 Outras ações

- **Desclassificar** (move para Perdido) com 9 motivos: Sem interesse, Contato inválido, Cadastro duplicado, Fora do perfil, Fora da região de atuação, Não procura mais imóvel, Solicitou não receber contatos, Spam, Outro.
- **Follow-up por IA**: gera mensagem personalizada (IA) e envia por WhatsApp; elegível se ≥3 dias sem contato e com telefone. Registra interação no histórico.
- **Follow-up manual**, registro de interação livre, agendamento de reunião/ligação, WhatsApp direto.
- **Exclusão de lead: apenas admin.**

---

## 3. Aba Contas

**Função:** gerenciar o relacionamento duradouro com o cliente após a triagem, conduzir o contato até a qualificação e originar Oportunidades e Captações.

### 3.1 Categorias e visões

- Toda conta é **Carteira** ou **Marketing** (campo `categoria`, com fallback por tag).
- Kanban com 3 visões: **Carteira (padrão ao abrir)**, Marketing e Todos.

### 3.2 Etapas do funil (5 colunas)

| # | Etapa | Significado |
|---|-------|-------------|
| 1 | **A contatar** | Entrada da conta no fluxo (toda conta convertida começa aqui) |
| 2 | **Contatado** | 1º contato (mensagem) registrado |
| 3 | **Sem retorno** | 2º contato feito, sem resposta |
| 4 | **Contato estabelecido** | Cliente respondeu — relacionamento ativo |
| 5 | **Contato cancelado** | Encerrado com motivo obrigatório (cadastro e histórico preservados) |

Etapas comerciais antigas (captação/imóvel, reunião, visita, permuta, proposta, fechado, oportunidade futura, parceiros) ficam preservadas no banco como **legado**; contas legadas recebem aviso e botão para entrar no fluxo atual.

### 3.3 Fluxo de atendimento por etapa

- **A contatar** → registrar 1º contato (mensagem) → move para Contatado.
- **Contatado** → registrar 2º contato (áudio/ligação) com desfecho:
  - *Respondeu* → **Contato estabelecido** (marca qualificação como pendente);
  - *Sem resposta* → **Sem retorno**;
  - *Contato inválido* → dialog de cancelamento com motivo.
- **Sem retorno** → nova tentativa, envio de link, criar tarefa de retorno, ou mover manualmente.
- **Contato estabelecido** → "Qualificar e gerar oportunidade" e "Definir destino comercial".
- **Contato cancelado** → exibe motivo/data; "Reabrir atendimento" devolve a conta para A contatar.

### 3.4 Destino comercial (ação da etapa Contato estabelecido — não é coluna)

| Destino | Efeito |
|---------|--------|
| **Captação / Reunião** | Cria **automaticamente** um card no funil de **Captação de Imóveis** (etapa "Novo"); se o destino for revertido antes do card ser trabalhado, o card é removido |
| **Comprar — Oportunidade** | Abre direto o dialog de qualificação para gerar a Oportunidade |
| **Vender — HRX Produções** | Registra o destino para fluxo de vendas interno |
| **Oportunidade futura** | Mantém a categoria, agenda próxima ação e cria tarefa futura |

### 3.5 Qualificação → ponte para Oportunidades

Ao entrar em Contato estabelecido, a conta fica com **qualificação pendente**. Resultados possíveis:

1. **Gerar oportunidade agora** — exige campos mínimos: título, descrição da busca, tipo de imóvel, cidade ou bairro, valor-alvo e corretor. Criação idempotente (não duplica; se já houver oportunidade ativa, pede confirmação). Conta passa a exibir selo "Oportunidade ativa" com link direto.
2. **Oportunidade futura** — mantém em Contato estabelecido, define data da próxima ação, cria tarefa e registra interação.
3. **Não qualificado** — move para Contato cancelado, com motivo obrigatório.

Selos de qualificação: pendente / oportunidade ativa / oportunidade futura / não qualificado.

### 3.6 Detalhe da conta (seções)

Fluxo de atendimento (topo), **Agenda** (compromissos com quick-add), **Tarefas** (com countdown), **Propostas**, **Fechamentos**, **Linha do tempo de interações** (com autor de cada registro), **Imóveis vinculados**, **Documentos**, endereço e observações.

### 3.7 Outras regras

- **Temperatura** (quente/morno/frio) editável no card.
- **Tag de tarefa countdown** no card do Kanban (mesma regra dos Leads): conta com tarefa futura não aparece como "sem atendimento".
- **Alterar categoria** exige motivo e oferece opção de reiniciar a conta em "A contatar".
- **Motivos de cancelamento** (9): Sem interesse, Contato inválido, Não procura mais imóvel, Fora do perfil, Fora da região de atuação, Cadastro duplicado, Solicitou não receber contatos, Spam, Outro.
- **Exclusão de conta: apenas admin.**

---

## 4. Aba Oportunidades

**Função:** conduzir o negócio de compra de imóvel, do diagnóstico da busca até o ganho (fechamento) ou a perda — sempre vinculada a uma Conta.

### 4.1 Etapas do funil (6 estágios)

| # | Estágio | Significado |
|---|---------|-------------|
| 1 | **Nova** | Diagnóstico da busca em levantamento |
| 2 | **Buscando imóvel** | Perfil definido; busca e seleção de imóveis |
| 3 | **Visita agendada** | Visitas em andamento |
| 4 | **Proposta** | Negociação/proposta em curso |
| 5 | **Ganha** | Negócio fechado (estágio final) |
| 6 | **Perdida** | Negócio encerrado sem fechamento (estágio final) |

### 4.2 Diagnóstico mínimo para sair de "Nova"

Para avançar de Nova → Buscando imóvel, a oportunidade precisa de: **conta vinculada, descrição da busca, tipo de imóvel, cidade ou bairro, valor-alvo e corretor responsável**. O sistema sinaliza diagnóstico atrasado quando a oportunidade fica em "Nova" mais de 5 dias sem conclusão.

### 4.3 Atributos e KPIs

- **Prioridade:** alta / média / baixa.
- Indicadores por card: tempo na etapa, dias sem ação, prioridade, conta vinculada (com nome do cliente), categoria de origem (Carteira/Marketing).
- KPIs de topo: **ativas**, **paradas** (>7 dias sem ação), **vínculo pendente** (sem conta).
- Filtros: corretor, categoria, tipo de imóvel, origem, vínculo com conta, prioridade, período (7/15/30/90/180 dias), permuta, mostrar finalizadas.

### 4.4 Ganha (fechamento) — dialog obrigatório

Não é um simples arrastar de card. O dialog exige: **imóvel negociado, valor final, data do fechamento e corretor**. Efeitos:
- Cria registro de **Fechamento** na Conta (visível na aba Contas e nos relatórios).
- Opção de marcar o imóvel como **Vendido** no cadastro de imóveis.

### 4.5 Perdida — dialog obrigatório

Exige **motivo** (11 opções: desistiu da compra, comprou com outra imobiliária, adiou a compra, não encontrou imóvel compatível, sem capacidade financeira, financiamento não aprovado, sem retorno, mudou de cidade/região, mudou o tipo de imóvel, oportunidade duplicada, outro) e o **destino da Conta**:

| Destino da conta | Efeito |
|------------------|--------|
| **Oportunidade futura** | Mantém categoria, agenda próximo contato, cria tarefa futura |
| **Continuar relacionamento** | Conta volta a Contato estabelecido, sem oportunidade ativa, com próxima ação |
| **Contato cancelado** | Move a conta para cancelado (motivo obrigatório) |

Sempre registra nota no histórico. **A conta nunca é excluída nem duplicada.**

### 4.6 Sub-recursos da oportunidade

- **Visitas** (6 status): agendada, confirmada, realizada, cancelada, reagendada, cliente não compareceu.
- **Propostas** (8 status): em preparação, enviada, em análise, contraproposta, aceita, recusada, expirada, cancelada.
- **Vínculo de imóveis** ao perfil buscado: vinculado / apresentado / rejeitado.
- Campos de busca: tipo de imóvel, cidade/bairro, valor-alvo, forma de pagamento, possibilidade de financiamento, prazo pretendido, permuta (com imóvel e valor estimado), características indispensáveis.

---

## 5. Automações e integrações transversais

| Automação | Como funciona |
|-----------|---------------|
| **Conversão lead → conta** | Interações do lead migram automaticamente para a conta (trigger na mesma transação); conta nasce em Marketing / A contatar |
| **Unificar lead em conta duplicada** | RPC que vincula o lead à conta existente e transfere interações, tarefas e reuniões — sem criar cadastro duplicado |
| **Destino Captação/Reunião** | Trigger cria card no funil de Captação de Imóveis; reversão remove o card se ainda intocado |
| **Qualificação → Oportunidade** | RPC idempotente (chave única) — impede oportunidade duplicada para a mesma conta |
| **Notificação de novo lead** | E-mail automático para usuários com o aviso ativado (toggle por usuário), disparado por trigger ao inserir o lead |
| **WhatsApp integrado** | Caixa de entrada com atualização em tempo real por responsável; follow-up com IA; envio direto pelo detalhe |
| **Tarefas com countdown** | Tags "contatar hoje/amanhã/em X dias/atrasada" nos cards de Leads e Contas; tarefa futura = atendimento programado (não conta como ocioso) |
| **Relatórios** | Abas espelhando cada funil (Leads com SLA, Contas, Oportunidades, Captação) + conversão Leads→Contas |
| **Dashboard** | KPIs de ociosidade e etapa alinhados à aba Leads (excluem convertidos e quem tem tarefa futura) |

### Regras transversais

- **Fuso horário:** todos os prazos e exibições usam **America/Cuiaba (UTC-4, sem horário de verão)**.
- **Interações:** apenas **admin** pode editar ou excluir registros do histórico.
- **Papéis:** admin, gestor, corretor, marketing, secretaria — com visões e permissões distintas (ex.: corretor vê apenas suas abas operacionais; marketing acessa Imóveis; secretaria acessa Agenda).
- **Exclusões de leads e contas: apenas admin.** Contas e oportunidades encerradas preservam cadastro e histórico completos.

---

## 6. Modelo de dados essencial

### `leads`
`id, nome, telefone, email, origem, status, etapa_funil, qualificacao, valor_estimado, imovel_interesse, observacoes, tags, corretor_id, data_entrada, ultima_interacao, created_by, created_at, updated_at, temperatura, regiao, meta_form_data, tipo_acompanhamento, motivo_desclassificacao`

### `contas`
`id, nome, tipo, documento, email, telefone, endereco, observacoes, tags, lead_id_origem, responsavel_id, created_by, created_at, updated_at, status, interesse, is_partner, etapa_funil, ramo_atividade, temperatura, parceiro_origem_id, desclassificada, motivo_desclassificacao, categoria, origem, data_entrada_carteira, destino_comercial, motivo_cancelamento, cancelado_em, cancelado_por, qualificacao_status, qualificacao_em, qualificacao_por, proxima_acao_em`

### `oportunidades`
`id, cliente_tipo, cliente_id, conta_id, lead_id_origem, titulo, descricao_busca, valor_alvo, tipo_imovel, cidade, bairro, estagio, corretor_id, prioridade, observacoes, categoria_origem, origem, forma_pagamento, possibilidade_financiamento, prazo_pretendido, possui_permuta, imovel_permuta, valor_estimado_permuta, caracteristicas_indispensaveis, data_diagnostico, diagnostico_por, valor_final, data_fechamento, imovel_fechamento_id, proposta_aceita_id, motivo_perda, obs_perda, destino_conta_perda, encerrada_em, encerrada_por, estagio_desde, chave_idempotencia, created_by, created_at, updated_at`

### Entidades de apoio
- **`interacoes`** — histórico unificado: `lead_id / conta_id / oportunidade_id, tipo, canal, resultado, pontualidade, descricao, proxima_acao, agendado_para, created_by, created_at`
- **`tarefas`** — `titulo, descricao, prioridade, status, prazo, responsavel_id, lead_id / conta_id / oportunidade_id`
- **`visitas`** — `lead_id / conta_id, imovel_id, corretor_id, data_visita, status, origem`
- **`conta_propostas`** — `conta_id, imovel_id, data_proposta, valor, status, corretor_id`
- **`conta_fechamentos`** — `conta_id, oportunidade_id, imovel_id, data_fechamento, valor`
- **`captacoes_imovel`** — funil de captação: `conta_id, imovel_id, estagio, data_agendada, responsavel_id, origem` (etapas: novo → agendar → detalhamento 24h antes → agendada → cadastro do imóvel → concluído)

### Checklist de regras de negócio

1. Lead entra sempre em "Novo Lead" com `data_entrada`; SLA de tentativas: mensagem imediata, áudio +24h, ligação +48h (tolerância de pontualidade: 1h).
2. "Sucesso no contato" exige corretor e move para Conversa Ativa; "Sem contato" gera tarefa de retorno +24h.
3. Tarefa futura = atendimento programado: tira o registro dos filtros/KPIs de ociosidade.
4. Conversão lead→conta verifica duplicidade na base de contas (telefone/e-mail/CPF bloqueiam; nome avisa) e migra o histórico automaticamente.
5. Unificar nunca cria conta nova: transfere histórico para a conta existente.
6. Conta convertida nasce em Marketing / A contatar; Contato estabelecido marca qualificação pendente.
7. Destino "Captação/Reunião" cria card no funil de Captação (com reversão segura).
8. Gerar oportunidade exige diagnóstico mínimo e é idempotente.
9. Ganha exige imóvel + valor + data + corretor e gera Fechamento na conta.
10. Perdida exige motivo + destino da conta, com tarefa de retorno e nota no histórico.
11. Conta nunca é excluída em perdas/cancelamentos — histórico preservado.
12. Fuso America/Cuiaba em todos os prazos; edição/exclusão de interações e exclusão de leads/contas: apenas admin.
