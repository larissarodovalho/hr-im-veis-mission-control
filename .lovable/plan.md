## Objetivo

Criar um endpoint de diagnóstico que verifica, em tempo real, se a Página HR Imóveis está corretamente inscrita ao app Meta — eliminando a adivinhação sobre por que o webhook não recebe leads de teste.

## O que será construído

### 1. Nova edge function `meta-debug-subscription`

Faz 3 chamadas à Graph API usando o `META_PAGE_ACCESS_TOKEN` salvo e devolve um JSON com diagnóstico:

- **Check 1 — Token válido?**
  `GET /me?fields=id,name` → confirma a qual página o token pertence. Deve retornar `id: 1095453883642999` e `name: HR Imóveis`.

- **Check 2 — Página inscrita ao app?**
  `GET /1095453883642999/subscribed_apps` → lista os apps subscritos e os campos (`subscribed_fields`) de cada um. Procuramos um app com `leadgen` na lista.

- **Check 3 — Formulários disponíveis**
  `GET /1095453883642999/leadgen_forms?fields=id,name,status` → mostra os Form IDs reais que a página possui (útil para preencher o mapeamento em Configurações).

Resposta esperada:
```json
{
  "token_ok": true,
  "page_id_token": "1095453883642999",
  "page_name": "HR Imóveis",
  "subscribed_apps": [{ "app_id": "...", "subscribed_fields": ["leadgen", ...] }],
  "leadgen_subscribed": true,
  "forms": [{ "id": "...", "name": "...", "status": "ACTIVE" }],
  "diagnostico": ["✅ Token OK", "✅ leadgen subscrito", "✅ 3 formulários ativos"]
}
```

Requer JWT de admin (mesmo padrão do `meta-test-token`).

### 2. Botão "Diagnosticar Webhook" em `MetaLeadAdsTab`

Adiciona um botão na aba de Configurações → Meta Lead Ads que chama a função e renderiza o resultado num card com checks verdes/vermelhos e a lista de Form IDs encontrados (com botão de copiar).

## Como interpretar o resultado

| Sintoma | Causa provável | Ação |
|---|---|---|
| `token_ok: false` | Token expirado | Gerar novo Page Access Token |
| `page_id_token` diferente de `1095453883642999` | Token é de outra página | Gerar token correto da HR Imóveis |
| `subscribed_apps` vazio ou sem `leadgen` | Página não inscrita ao app | No app Meta → Webhooks → Add Subscription → HR Imóveis + leadgen |
| Tudo verde mas webhook ainda silencioso | Usuário do teste não é Admin do app | Adicionar usuário em Funções (Roles) |

## Detalhes técnicos

- Arquivo: `supabase/functions/meta-debug-subscription/index.ts`
- Reutiliza padrão de auth do `meta-test-token` (verifica JWT antes de chamar Graph API)
- Frontend: edição mínima em `src/components/configuracoes/MetaLeadAdsTab.tsx` para adicionar o botão e o card de resultado
- Nenhuma alteração de schema, secrets ou tabelas
