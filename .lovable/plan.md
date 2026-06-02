## Visão geral
Integrar Meta Lead Ads ao CRM via webhook nativo. Quando alguém preencher um formulário de anúncio no Facebook/Instagram, o lead cai automaticamente na tabela `leads`.

## Arquitetura

```text
Meta Lead Ads → webhook leadgen → Edge Function `meta-leadgen-webhook`
                                          ↓
                              Graph API (busca dados com Page Access Token)
                                          ↓
                              Insert em public.leads (+ tags, origem = "meta_ads")
```

## Mudanças técnicas

### 1. Banco (migration)
Nova tabela `meta_lead_forms` para mapear formulários:
- `id`, `page_id`, `form_id`, `form_nome`
- `tags text[]`, `corretor_responsavel_id uuid`, `etapa_funil_inicial text` (default `'novo'`)
- `ativo boolean default true`, timestamps
- RLS: admin/gestor full, staff select
- GRANTs para `authenticated` e `service_role`

### 2. Edge Function `meta-leadgen-webhook` (verify_jwt = false)
- **GET** `?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` → retorna o challenge se o verify token bater (handshake exigido pelo Meta).
- **POST** com payload `{ entry: [{ id: page_id, changes: [{ field: "leadgen", value: { leadgen_id, form_id, page_id, created_time } }] }] }`:
  1. Para cada `leadgen_id`, chama `GET https://graph.facebook.com/v21.0/{leadgen_id}?access_token={PAGE_TOKEN}` para buscar `field_data`.
  2. Mapeia campos comuns (`full_name`, `email`, `phone_number`, `cidade`, etc.).
  3. Procura mapeamento em `meta_lead_forms` por `form_id` → puxa tags, corretor, etapa.
  4. Insere em `leads` com `origem='meta_ads'`, `data_entrada=now()`.
  5. Loga em `activity_log` (tipo `lead_meta`).
- Service role client para bypass RLS.
- Retorna 200 sempre (Meta exige), erros vão pro log.

### 3. Secrets
- `META_VERIFY_TOKEN` — string aleatória que você gera (ex.: `hr-meta-2026-xyz`)
- `META_PAGE_ACCESS_TOKEN` — Page Access Token de longa duração (60 dias / nunca expira)
- `META_APP_SECRET` — pra validar assinatura `X-Hub-Signature-256` (segurança)

### 4. UI — nova aba "Meta Lead Ads" em Configurações
Mostra:
- URL do webhook (copiável): `https://<projeto>.supabase.co/functions/v1/meta-leadgen-webhook`
- Verify Token (mostra se já configurado)
- Botão "Testar conexão" (chama Graph API `/me` com o token, confirma se está válido e qual página)
- Tabela de **Mapeamento de Formulários**: lista `meta_lead_forms`, com botões adicionar/editar/excluir. Form: `Form ID`, `Nome`, `Tags`, `Corretor responsável`, `Etapa inicial`.
- Passo-a-passo visual (accordion) com o tutorial de como criar o App no Meta.

### 5. Passo-a-passo que vou entregar no chat (não no código)
Vou te mandar um guia simples cobrindo:
1. Criar App no [developers.facebook.com](https://developers.facebook.com) (tipo "Business").
2. Adicionar produto "Webhooks" + "Permissions and Features" pedindo `leads_retrieval` e `pages_manage_metadata`.
3. Gerar **Page Access Token** de longa duração no Graph API Explorer.
4. Inscrever a Página em `leadgen` (Webhooks → Page → leadgen).
5. Colar a URL do webhook e o Verify Token nas configurações do App.
6. Conectar a Página de Anúncios ao App.
7. Voltar no CRM, abrir Configurações → Meta Lead Ads, colar o Page ID + Form ID nos mapeamentos.
8. Fazer um lead de teste no Meta Lead Ads Testing Tool.

## Detalhes técnicos extras
- Sem alteração no schema de `leads` — só insere usando campos existentes.
- Validação opcional de assinatura HMAC SHA-256 do header `X-Hub-Signature-256` com `META_APP_SECRET` (recomendado).
- Sem dependência externa nova; tudo via `fetch` na edge function.

## O que você vai precisar ter em mãos depois do código
- Conta no Meta for Developers (gratuita).
- Página do Facebook conectada ao Gerenciador de Anúncios.
- Permissão de admin na Página.

Confirmo o plano e parto pra implementação?