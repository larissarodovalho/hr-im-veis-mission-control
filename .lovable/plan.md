# Reestruturação dos funis de Contas — Carteira e Marketing (5 etapas)

## Estado atual (verificado no banco)

Total: 1.427 contas — 1.354 Carteira, 56 Marketing, 3 sem tag, **0 com as duas tags**, 0 desclassificadas.

| Etapa atual | Carteira | Marketing |
|---|---|---|
| A contatar | 633 | 18 |
| Contatado | 13 | 3 |
| Sem retorno | 207 | 1 |
| Contato estabelecido | 86 | 7 |
| Captação/Imóvel | 31 | 0 |
| Reunião | 14 | 2 |
| Visita | 3 | 2 |
| Permuta | 1 | 0 |
| Proposta | 1 | 2 |
| Fechado | 9 | 3 |
| Oportunidade futura (`perdido`) | 333 | 18 |
| Parceiros | 23 | 0 |

## 1. Banco de dados (uma migração)

Novos campos em `contas`:
- `categoria` (text: `carteira` | `marketing`, nullable) — categoria principal de atendimento
- `origem` (text) — origem do contato (manual, importação, indicação, Meta Ads, site…)
- `data_entrada_carteira` (timestamptz, default now() no cadastro)
- `destino_comercial` (text: `captacao_reuniao` | `comprar_oportunidade` | `vender_hrx_producoes` | `oportunidade_futura`, nullable)
- `motivo_cancelamento` (text), `cancelado_em`, `cancelado_por` (uuid)

Backfill e migrações não destrutivas:
- `categoria` preenchida a partir das tags (`carteira`/`marketing`); as 3 contas sem tag ficam com `categoria = NULL` → "pendente de revisão"
- 23 contas da etapa `parceiros` → `is_partner = true` + etapa `contato_estabelecido`, com registro da etapa anterior no histórico
- Nada é excluído: etapas comerciais (captacao_imovel, reuniao, visita, permuta, proposta, fechado, perdido) permanecem no banco como legado
- Trigger em `contas`: toda mudança de `etapa_funil` ou `categoria` grava uma linha em `interacoes` (tipo `nota`) com etapa anterior → nova etapa, categoria, usuário e data/hora

## 2. Configuração do funil (`src/lib/contasFunil.ts`)

- `ETAPAS` ativas (5): `a_contatar`, `contatado`, `sem_retorno`, `contato_estabelecido`, `contato_cancelado` (nova)
- `ETAPAS_LEGADO`: captacao_imovel, reuniao, visita, permuta, proposta, fechado, perdido, parceiros — preservadas com rótulo "(legado)"
- O id `perdido` não é renomeado nem reutilizado

## 3. Aba Contas (`src/pages/Accounts.tsx` + `ContasKanban.tsx`)

- Kanbans de Carteira e Marketing filtram pela **categoria principal** (não só pela tag); arrastar entre etapas nunca altera a categoria
- Kanban passa a ter as 5 colunas; contas em etapas legadas ficam fora do Kanban e acessíveis na visão de lista com o filtro **"Mostrar etapas comerciais legadas"** (mesmo padrão da aba Leads)
- Arrastar ou mover para **Contato cancelado** abre diálogo com motivo obrigatório (9 motivos; "Outro" exige observação) + mensagem de agradecimento opcional
- Ação separada **"Alterar categoria da conta"** (menu ⋯ do card e detalhe): confirmação, mostra categoria atual/nova, motivo obrigatório, opção de reiniciar em "A contatar", registra no histórico — nunca pelo arrastar
- Cards ganham: badge de categoria, data/tipo do último contato, próxima ação, tempo na etapa; Carteira destaca o corretor, Marketing destaca origem/campanha
- Lista **"Categoria pendente de revisão"** para as contas sem categoria, com ação para defini-la
- Filtros novos: origem/campanha (Marketing) e por corretor (já existe, mantido)

## 4. Detalhe da conta (`src/pages/AccountDetail.tsx`)

Card "Fluxo de atendimento" conforme a etapa:
- **A contatar**: registrar 1º contato (mensagem) → grava histórico e move para Contatado
- **Contatado**: registrar 2º contato (áudio ou ligação) com desfechos: resposta → Contato estabelecido; sem resposta → Sem retorno; inválido → Contato cancelado (motivo)
- **Sem retorno**: registrar nova tentativa, registrar envio de link, criar tarefa de retorno com próxima data, ou mover manualmente
- **Contato estabelecido**: ação **"Definir destino comercial"** (4 opções, não viram colunas; salva na conta + histórico, sem trocar categoria e sem mover para etapas antigas)
- **Contato cancelado**: exibe motivo, data e responsável; conta preservada

## 5. Cadastro e conversão

- `NovaContaDialog`: ao cadastrar na Carteira, campos de corretor responsável, origem, interesse, temperatura e observação inicial; `data_entrada_carteira` automática; categoria gravada conforme a aba de origem
- `LeadDetail.tsx`: conversão em **Conta Cliente** → Marketing › A contatar (já existente, mantido); conversão em **Conta Desclassificada** → agora entra em **Marketing › Contato cancelado** com `motivo_cancelamento` preenchido e registro de origem "Leads" (em vez de A contatar)

## 6. Relatórios

- `FunilContasReport` e demais relatórios de conversão passam a usar as 5 etapas ativas + agrupamento das legadas, sem perder os dados antigos

## 7. Verificação e relatório final

- Typecheck + teste no navegador dos dois Kanbans, diálogos de cancelamento/categoria/destino e conversão de lead
- Relatório final com: contagens antes/depois por categoria, contas migradas de Parceiros (23), contas com duas tags (0), pendentes de revisão (3), campos criados, automações alteradas e registros aguardando o módulo de Oportunidades (408 contas em etapas comerciais legadas)

## Fora de escopo (conforme solicitado)

Não cria o funil de Oportunidades/Negócios, não move contas para etapas comerciais, não automatiza contatos por temperatura, não exclui nenhum registro.