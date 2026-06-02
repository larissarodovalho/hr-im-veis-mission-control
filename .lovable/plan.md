## Plano — Integração Meta Lead Ads

Você já tem os 3 valores em mãos. Agora vou implementar tudo de uma vez.

### 1. Salvar os secrets
Pedir via tool seguro:
- `META_VERIFY_TOKEN`
- `META_PAGE_ACCESS_TOKEN`
- `META_APP_SECRET`

### 2. Edge Function `meta-leadgen-webhook` (`verify_jwt = false`)
- **GET** handshake: valida `hub.verify_token` contra `META_VERIFY_TOKEN` e devolve `hub.challenge`.
- **POST** evento `leadgen`:
  1. Valida assinatura `X-Hub-Signature-256` (HMAC SHA-256 com `META_APP_SECRET`).
  2. Para cada `leadgen_id` no payload, busca `field_data` via Graph API v21.0 com `META_PAGE_ACCESS_TOKEN`.
  3. Mapeia campos comuns (full_name, email, phone_number, cidade, mensagem).
  4. Procura `form_id` em `meta_lead_forms` → herda tags, corretor responsável e etapa inicial.
  5. Insere em `leads` com `origem='meta_ads'`, `data_entrada=now()`.
  6. Loga em `activity_log` (tipo `lead_meta`).
- Service role client para bypass RLS. Retorna 200 sempre (exigência do Meta).

### 3. Adicionar bloco no `supabase/config.toml`
```
[functions.meta-leadgen-webhook]
verify_jwt = false
```

### 4. UI — nova aba "Meta Lead Ads" em Configurações
Arquivo novo `src/components/configuracoes/MetaLeadAdsTab.tsx`, adicionado em `ConfiguracoesPage.tsx`:
- **Card "Webhook"**: mostra URL `https://<projeto>.supabase.co/functions/v1/meta-leadgen-webhook` (botão copiar) + status do Verify Token (configurado/não) + botão "Testar token da página" (chama Graph API `/me` via edge function auxiliar `meta-test-token`).
- **Card "Mapeamento de Formulários"** (tabela CRUD sobre `meta_lead_forms`):
  - Colunas: Form ID, Nome, Tags, Corretor responsável, Etapa inicial, Ativo, Ações.
  - Dialog Novo/Editar com SearchableSelect de corretor e select de etapa do funil.
  - Excluir (apenas admin, conforme RLS já criada).
- **Accordion "Passo a passo"**: tutorial resumido dos 7 passos no painel do Meta + link "Lead Ads Testing Tool".

### 5. Hook `useMetaLeadForms.ts`
CRUD básico sobre `meta_lead_forms` (espelhando padrão de `useMetaAdsMapping`).

### 6. Edge Function auxiliar `meta-test-token` (verify_jwt = true)
GET → chama `https://graph.facebook.com/v21.0/me?access_token=...&fields=id,name` e devolve `{ ok, page_id, page_name }`. Usada pelo botão "Testar conexão" da UI.

## Detalhes técnicos
- Sem alteração de schema: a tabela `meta_lead_forms` já foi criada na migration anterior.
- Sem dependências novas: tudo via `fetch` + `crypto.subtle` (HMAC) nas edge functions.
- Tipagem do Supabase já contempla `meta_lead_forms` (foi regerada).

## O que você faz depois que eu terminar
1. Copio a URL do webhook → você cola em **Webhooks → Page → leadgen** no painel do App Meta.
2. Cola o `META_VERIFY_TOKEN` no mesmo painel.
3. Inscreve sua Página no campo `leadgen`.
4. Cria um lead de teste no **Lead Ads Testing Tool** → o lead deve aparecer em `/crm/leads`.
5. Para cada formulário publicado, abre Configurações → Meta Lead Ads → "Novo mapeamento" e cola o Form ID.

Confirma pra eu partir pra implementação?
