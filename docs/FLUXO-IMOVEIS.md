# Fluxo completo da aba "Imóveis" — HR Imóveis CRM

Documento técnico-funcional do módulo de Imóveis. Descreve telas, campos, regras de negócio, banco de dados, storage e integrações, com detalhe suficiente para replicar o módulo em outro CRM.

---

## 1. Visão geral

- **Rota:** `/crm/imoveis` (arquivo `src/pages/Imoveis.tsx`).
- **Aba interna via querystring:** `?tab=proposta`, `?tab=fechamento`, `?tab=vendidos`, `?tab=oportunidades`, `?tab=captacao`, `?tab=parceiros`. Sem parâmetro = `disponiveis`.
- **Quem enxerga:** usuários com papel `admin`, `gestor`, `corretor` ou `marketing` (leitura de todos os imóveis).
- **Quem edita/cadastra:** `admin`, `gestor`, `marketing` (constante `canEdit` na página); corretores podem editar apenas os imóveis onde são `corretor_id` ou `created_by` (regra do banco).
- **Quem exclui:** somente `admin`.

### As 7 abas

| Aba | Origem dos dados | Critério de entrada |
|---|---|---|
| Disponíveis | `imoveis` | status ≠ "Vendido" e sem proposta em análise/aceita |
| Em Proposta | `imoveis` + `propostas` | existe proposta com status "Em análise" |
| Em Fechamento | `imoveis` + `propostas` | existe proposta com status "Aceita" |
| Vendidos | `imoveis` (status "Vendido") e aba `VendidosTab` sobre `vendas` | venda confirmada |
| Oportunidades de Negócio | `oportunidades` / `oportunidade_imoveis` | imóveis vinculados a oportunidades abertas |
| Captação | `captacoes_imovel` | conta com destino comercial "captação/reunião" |
| Parceiros | `corretores_parceiros` | cadastro manual de corretores parceiros |

> Regra central (comentada no topo de `src/pages/Imoveis.tsx`): **o campo `imoveis.status` continua "Disponível" durante todo o ciclo de proposta e fechamento**. As abas "Em Proposta" e "Em Fechamento" são *derivadas* das propostas, não do status. O status só vira "Vendido" na confirmação da venda. Assim o imóvel permanece visível no site público durante a negociação.

---

## 2. Fluxo ponta a ponta

```text
  CAPTAÇÃO                 CADASTRO                NEGOCIAÇÃO                  FECHAMENTO
┌────────────┐        ┌─────────────────┐     ┌──────────────────┐        ┌────────────────┐
│ Conta com  │  cria  │ Imóvel cadastra-│     │ Proposta         │ aceita │ Em Fechamento  │
│ destino =  │ ─────► │ do (imoveis)    │ ──► │ (Em análise)     │ ─────► │ contrato/PDF   │
│ captação/  │trigger │ + fotos + docs  │     │ várias por imóvel│        │                │
│ reunião    │        │ publicado?      │     └──────────────────┘        └───────┬────────┘
└────────────┘        └────────┬────────┘            │ recusada                   │ confirmar
                               │ publicado=true      ▼                            ▼
                               ▼                 volta p/ Disponíveis      Venda (vendas)
                        Site público                                       status = Vendido
                      (view imoveis_public)                                 comissões/splits
```

### 2.1 Captação
1. Uma conta (`contas`) recebe `destino_comercial = 'captacao_reuniao'` (ou a etapa legada `etapa_funil = 'captacao_imovel'`).
2. O trigger `sync_captacao_from_conta()` cria automaticamente um card em `captacoes_imovel` com `estagio = 'novo'`, herdando `responsavel_id` e `created_by` da conta. Só cria se ainda não houver card não concluído para a conta.
3. Se o destino comercial for retirado, o trigger apaga o card **somente se ele estiver intocado** (estágio novo, sem data agendada, sem checklist, sem imóvel vinculado e sem observações).
4. O kanban da aba **Captação** (`src/pages/imoveis/CaptacaoTab.tsx`, drag-and-drop com `@dnd-kit/core`) move o card entre os estágios de `src/lib/captacaoFunil.ts`:

| id | Label |
|---|---|
| `novo` | Novo (recebido) |
| `agendar` | Agendar captação |
| `detalhamento` | Enviar detalhamento 24 horas antes |
| `agendada` | Captação agendada |
| `cadastro` | Cadastro do imóvel |
| `concluido` | Concluído |

5. No estágio "Cadastro do imóvel" o card é vinculado a um registro de `imoveis` (`captacoes_imovel.imovel_id`) e depois marcado como concluído.

### 2.2 Cadastro
Feito pelo diálogo `NovoImovelDialog` (ver seção 3). Gera o registro em `imoveis` com `codigo` automático (`HR-0001`, `HR-0002`…) pelo trigger `imoveis_set_codigo()` sobre a sequence `imoveis_codigo_seq`.

### 2.3 Proposta
- Botão "Iniciar proposta" no card de imóvel abre `NovaPropostaDialog`.
- Exige selecionar um **lead** e anexar o **PDF assinado** (obrigatório, apenas `application/pdf`, máx. 20 MB), enviado para o bucket privado `propostas` no path `{imovel_id}/{timestamp}-{nome}.pdf`.
- Insere em `propostas` com `status = 'Em análise'`, `corretor_id` = corretor do imóvel (ou usuário atual).
- Um mesmo imóvel pode ter várias propostas em análise — a aba mostra todas com valor, telefone do lead, condições e link para o PDF (URL assinada).

Ações na aba "Em Proposta":
- **Aceitar** → a proposta vira `Aceita` e **todas as outras em análise viram `Recusada`** automaticamente; imóvel passa a "Em Fechamento".
- **Recusar** → proposta vira `Recusada`.

### 2.4 Fechamento
- Mostra comprador, valor acordado, corretor, PDF assinado e atalho para `/crm/contratos`.
- **Cancelar** → devolve a proposta para `Em análise` (volta para "Em Proposta").
- **Confirmar venda** → atualiza `imoveis.status = 'Vendido'` e grava um registro em `activity_log` (tipo `venda`, metadata com `imovel_id`).

### 2.5 Venda registrada
`NovaVendaDialog` (usado na aba Vendidos) grava em `vendas` com: imóvel, proposta, lead/conta, corretor vendedor, captador, parceiro, valor de venda, contrato PDF (bucket privado `contratos-vendas`) e o **split de comissão**.

Matriz de comissão (`src/lib/comissaoHR.ts`) — total sempre 5% do VGV:

| Origem do negócio | Nível | Captador | Vendedor | HR |
|---|---|---|---|---|
| Base do Corretor (orgânico) | Júnior | 0,5% | 1,0% | 3,5% |
| Base do Corretor (orgânico) | Sênior | 1,0% | 2,0% | 2,0% |
| Base Institucional (CRM) | Júnior | 0,5% | 0,5% | 4,0% |
| Base Institucional (CRM) | Sênior | 0,5% | 2,0% | 2,5% |
| Base HRX (tráfego/marketing) | Júnior | 0,5% | 0,5% | 4,0% |
| Base HRX (tráfego/marketing) | Sênior | 0,5% | 1,5% | 3,0% |

Padrões: origem `base_corretor`, nível `senior`.

### 2.6 Exclusividade
`src/lib/exclusividade.ts` calcula a partir de `imoveis.exclusividade_fim`:
- sem data → `none`;
- data futura → `ativa` com `diasRestantes` e flag `alerta` quando faltam ≤ 30 dias;
- data passada → `vencida` com `diasAtras`.

---

## 3. Cadastro do imóvel — campos e regras

Arquivo: `src/components/imoveis/NovoImovelDialog.tsx` (edição em `EditarImovelDialog.tsx`).

### Identificação
| Campo | Coluna | Regra |
|---|---|---|
| Título * | `titulo` | obrigatório |
| Tipo * | `tipo` | lista fixa (ver abaixo) |
| Finalidade * | `finalidade` | Venda, Locação, Venda e Locação, Temporada |
| Status | `status` | Disponível, Reservado, Vendido, Alugado, Em construção, Indisponível |
| Descrição | `descricao` | livre |
| Matrícula | `matricula` | uso interno, não vai ao site |
| Imóvel em destaque | `destaque` | usado na home do site |
| Publicado no site | `publicado` | default `true`; controla visibilidade pública |
| Código | `codigo` | gerado pelo banco: `HR-0001`… |

**Tipos:** Casa, Sobrado, Apartamento, Cobertura, Kitnet/Studio, Loft, Terreno, Lote em condomínio, Chácara, Sítio, Fazenda, Galpão, Sala comercial, Loja, Prédio comercial, Ponto comercial.

### Vínculos (`ResponsavelProprietarioSection`)
| Campo | Coluna | Fonte |
|---|---|---|
| Corretor responsável | `corretor_id` | `profiles` (ativos); default = usuário logado |
| Proprietário | `proprietario_id` | `contas` (com busca; permite criar conta na hora) |
| Corretor captador | `corretor_captador_id` | `profiles` |
| Corretor parceiro | `corretor_parceiro_id` | `corretores_parceiros` (ativos) |

### Valores
`valor` (obrigatório na prática), `valor_condominio`, `valor_iptu`. Strings vazias viram `null`; vírgula é convertida em ponto.

### Áreas e cômodos — **condicional por tipo**
- **Terreno/rural** (Terreno, Lote em condomínio, Chácara, Sítio, Fazenda): mostra apenas `area_total` e `vagas`.
- **Comercial** (Galpão, Sala comercial, Loja, Prédio comercial, Ponto comercial): áreas + `banheiros` (sem quartos/suítes).
- **Residencial:** áreas + `quartos`, `suites`, `banheiros`, `vagas`.
- Inteiros ausentes gravam `0`; áreas ausentes gravam `null`.

### Localização
`cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado` (UF, 2 letras, maiúsculas).

### Características (array `caracteristicas`)
Piscina, Churrasqueira, Área gourmet, Academia, Salão de festas, Playground, Quadra esportiva, Portaria 24h, Elevador, Mobiliado, Semi-mobiliado, Ar-condicionado, Aquecimento solar, Energia solar, Jardim, Quintal, Varanda, Sacada, Lavabo, Escritório, Closet, Despensa, Lareira, Sauna, Hidromassagem, Garagem coberta, Próximo ao centro, Próximo a escolas, Aceita financiamento, Aceita FGTS, Aceita permuta, Documentação ok.

### Fotos — original privado + público com marca d'água
Regra implementada em `src/lib/uploadFotoImovel.ts` + `src/lib/watermark.ts`:

1. Limite de **20 fotos** por imóvel no formulário.
2. Path único por foto: `{user_id}/{timestamp}-{nome}.jpg` — **o mesmo path nos dois buckets**, para casar original ↔ marcada.
3. Sobe o arquivo original no bucket **privado** `imoveis-originais`.
4. Aplica a marca d'água (logo `/logo-hr-branco.png`, opacidade 0.35, largura 38% da menor dimensão, qualidade 0.9, lado maior limitado a 2400 px, saída sempre JPEG) via canvas no navegador.
5. Sobe a versão marcada no bucket **público** `imoveis`; a URL pública dessa versão é o que fica em `imoveis.fotos[]`.
6. Se falhar a versão marcada, o original órfão é removido.
7. `baixarOriginaisZip()` permite baixar em ZIP (JSZip) os originais sem marca d'água a partir das URLs públicas (`extractImovelPath` reconstrói o path).

### Documentos do imóvel
`ImovelDocumentosTab`: apenas **PDF**, até **10 MB** por arquivo, armazenados no bucket privado `imoveis-docs` e indexados em `imovel_documentos` (`nome`, `storage_path`, `tamanho_bytes`, `mime_type`).

---

## 4. Listagem, filtros e ações do card

Filtros globais (valem para as 4 primeiras abas):
- **Busca** por título, cidade ou código.
- **Ano** e **Mês** de `created_at`.
- **Captador** (lista derivada dos `corretor_captador_id` existentes).
- **Faixa de valor:** até 500 mil / 500 mil–1 mi / 1–2 mi / 2–5 mi / 5–10 mi / 10–20 mi / acima de 20 mi.
- **Bairro** (texto livre; casa também com endereço e complemento).
- Botão "limpar filtros" quando algum estiver ativo.

Cada aba exibe um **contador** (badge) com o total filtrado.

No card: capa (primeira foto), badge de status/estágio, toggle **Publicado / Não publicado** (só para `canEdit`, altera `imoveis.publicado` na hora), botão **detalhes**, **histórico** e **editar**.

**Histórico do imóvel** (`ImovelHistoricoDrawer`): timeline unificada de `propostas`, `reunioes`, `visitas` e vendas registradas em `activity_log` (tipo `venda`, metadata com `imovel_id`), com nome/telefone do lead resolvidos em `leads`.

---

## 5. Arquivos do módulo

```text
src/pages/Imoveis.tsx                    página principal, abas, filtros, ações de proposta/venda
src/pages/imoveis/CaptacaoTab.tsx        kanban de captação (dnd-kit)
src/pages/imoveis/VendidosTab.tsx        tabela de vendas registradas
src/pages/imoveis/ParceirosTab.tsx       CRUD de corretores parceiros
src/components/imoveis/
  NovoImovelDialog.tsx                   cadastro (constantes TIPOS_IMOVEL, FINALIDADES, STATUS_OPTIONS, CARACTERISTICAS)
  EditarImovelDialog.tsx                 edição + gestão de fotos (add/remove nos 2 buckets)
  DetalhesImovelDialog.tsx               visualização completa
  ImovelDocumentosTab.tsx                PDFs do imóvel (bucket imoveis-docs)
  ImovelHistoricoDrawer.tsx              timeline de propostas/visitas/reuniões/vendas
  NovaPropostaDialog.tsx                 proposta + PDF assinado (bucket propostas)
  NovaVendaDialog.tsx                    venda + comissões + contrato (bucket contratos-vendas)
  NovoCorretorParceiroDialog.tsx         cadastro de parceiro
  ResponsavelProprietarioSection.tsx     seleção de corretor/proprietário/captador/parceiro
src/lib/
  captacaoFunil.ts                       estágios do funil de captação
  uploadFotoImovel.ts                    upload duplo + ZIP de originais
  watermark.ts                           marca d'água em canvas
  exclusividade.ts                       cálculo de vigência da exclusividade
  comissaoHR.ts                          matriz de splits de comissão
  format.ts                              formatBRL
```

---

## 6. Banco de dados

### 6.1 `imoveis` (tabela central)
`id`, `codigo`, `titulo`, `descricao`, `tipo`, `finalidade`, `status`, `valor`, `valor_condominio`, `valor_iptu`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`, `area_total`, `area_construida`, `area_util`, `quartos`, `suites`, `banheiros`, `vagas`, `caracteristicas` (text[]), `fotos` (text[]), `destaque`, `publicado`, `matricula`, `exclusividade_inicio`, `exclusividade_fim`, `exclusividade_observacoes`, `corretor_id`, `corretor_captador_id`, `corretor_parceiro_id`, `proprietario_id`, `created_by`, `created_at`, `updated_at`.

**Triggers:** `imoveis_set_codigo()` (BEFORE INSERT — gera `HR-####` quando `codigo` vem vazio) e `update_updated_at_column()`.

### 6.2 Tabelas relacionadas
| Tabela | Papel | Colunas-chave |
|---|---|---|
| `imovel_documentos` | PDFs do imóvel | `imovel_id`, `nome`, `storage_path`, `tamanho_bytes`, `mime_type`, `created_by` |
| `captacoes_imovel` | funil de captação | `conta_id`, `estagio`, `data_agendada`, `checklist_enviado`, `checklist_observacoes`, `imovel_id`, `responsavel_id`, `origem`, `publicado_no_crm` |
| `corretores_parceiros` | parceiros externos | `nome`, `telefone`, `email`, `documento`, `creci`, `cidade`, `estado`, `comissao_padrao`, `dados_bancarios`, `ativo` |
| `propostas` | propostas por imóvel | `imovel_id`, `lead_id`, `corretor_id`, `valor`, `condicoes`, `status`, `documento_url`, `documento_nome` |
| `vendas` | vendas fechadas | `imovel_id`, `proposta_id`, `lead_id`, `conta_id`, `valor_venda`, `valor_comissao`, `percent_vendedor`, `percent_captador`, `percent_hr`, `origem_negocio`, `nivel_corretor`, `corretor_vendedor_id`, `corretor_captador_id`, `corretor_parceiro_id`, `contrato_pdf_path`, `data_venda`, `status_pagamento` |
| `oportunidade_imoveis` | imóveis apresentados numa oportunidade | `oportunidade_id`, `imovel_id`, `interesse`, `status`, `apresentado_em`, `feedback_cliente`, `motivo_rejeicao` |
| `meta_ads_imoveis` | vínculo anúncio Meta ↔ imóvel | `ad_id`, `imovel_id`, `nome_anuncio`, `ativo` |
| `activity_log` | log de venda confirmada | `tipo = 'venda'`, `metadata.imovel_id` |

### 6.3 Funções e triggers de apoio
- `imoveis_set_codigo()` — código sequencial do imóvel.
- `sync_captacao_from_conta()` — cria/remove card de captação a partir do destino comercial da conta.
- `conta_tem_captacao(_conta_id)` — SECURITY DEFINER, indica se a conta já tem captação.

### 6.4 Regras de acesso (RLS) — resumo
**`imoveis`**
- SELECT (`authenticated`): admin, gestor, corretor ou marketing — todos veem tudo.
- SELECT (`anon`): apenas `status = 'Disponível' AND publicado = true`.
- INSERT: staff (admin/gestor/corretor/marketing) e `created_by = auth.uid()`.
- UPDATE: admin, gestor, marketing, ou `corretor_id = auth.uid()`, ou `created_by = auth.uid()`.
- DELETE: apenas admin.

**`imovel_documentos`** — leitura para admin/gestor/marketing ou responsável/criador do imóvel; inserção só por staff com permissão sobre aquele imóvel; exclusão por admin/gestor ou quem criou.

**`captacoes_imovel`** — staff vê todos (necessário para a agenda); update por admin/gestor/marketing, responsável ou criador; delete só admin.

**`corretores_parceiros`** — leitura/escrita restrita a admin (`is_admin()`), protegendo dados bancários e documento.

**`oportunidade_imoveis`** — leitura/escrita apenas por admin ou pelo dono da oportunidade.

Todas as tabelas exigem os `GRANT` correspondentes para `authenticated`/`anon`/`service_role` além das políticas.

### 6.5 Storage
| Bucket | Visibilidade | Conteúdo |
|---|---|---|
| `imoveis` | **público** | fotos com marca d'água (URLs em `imoveis.fotos`) |
| `imoveis-originais` | privado | fotos originais, mesmo path do bucket público |
| `imoveis-docs` | privado | PDFs de `imovel_documentos` |
| `propostas` | privado | PDFs assinados de propostas (URL assinada na hora de visualizar) |
| `contratos-vendas` | privado | contratos de venda |

---

## 7. Integração com o site público

- View `public.imoveis_public`: expõe apenas colunas comerciais (sem `matricula`, `corretor_id`, `proprietario_id`, `created_by`, exclusividade) e filtra `status = 'Disponível' AND publicado = true`.
- Páginas do site consomem essa view: `src/pages/site/ImoveisPage.tsx` (listagem/filtros), `src/pages/site/ImovelDetalhePage.tsx` (detalhe) e `src/pages/site/HomePage.tsx` (vitrine).
- `destaque = true` alimenta a vitrine da home (até 3 imóveis, mais recentes primeiro); a aba de configurações do site (`SiteSettingsTab` + `site_settings.featured_imoveis`) permite fixar manualmente imóveis específicos para completar os 3.
- O toggle "Publicado/Não publicado" no card do CRM é o interruptor imediato de visibilidade pública.
- Como o status permanece "Disponível" durante proposta e fechamento, o imóvel continua anunciado até a venda ser confirmada.

---

## 8. Guia de replicação em outro CRM

1. **Modelo de dados e permissões:** criar `imoveis` (com código sequencial), `imovel_documentos`, `propostas`, `vendas`, `captacoes_imovel`, `corretores_parceiros`, `oportunidade_imoveis`. Aplicar RLS + GRANTs conforme a seção 6.4 e criar a view pública filtrada.
2. **Storage e marca d'água:** dois buckets de fotos (público marcado / privado original) usando o mesmo path, mais buckets privados para documentos, propostas e contratos.
3. **Cadastro:** formulário com as seções Identificação, Vínculos, Valores, Áreas/cômodos (condicionais por tipo), Localização, Características e Fotos.
4. **Listagem e filtros:** cards com capa, badges, toggle de publicação, e os filtros de busca/ano/mês/captador/faixa de valor/bairro; estágio derivado das propostas, não do status.
5. **Propostas e vendas:** proposta com PDF obrigatório; aceite recusa as demais; fechamento com opção de voltar; venda grava splits de comissão e muda o status para "Vendido".
6. **Captação e parceiros:** trigger que cria o card de captação a partir do destino comercial da conta, kanban de 6 estágios com vínculo final ao imóvel cadastrado; CRUD de parceiros restrito a administradores.
7. **Site público:** view filtrada por publicado + disponível, destaque na home e página de detalhe.

---

*Documento gerado a partir do código-fonte e do schema do banco em produção. Ao alterar o módulo, atualize também este arquivo.*
