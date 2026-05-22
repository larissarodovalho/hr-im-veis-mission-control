## Vincular anúncios do Meta à Sofia (Click-to-WhatsApp)

### Como funciona

Quando o cliente clica num anúncio do Meta com botão "Enviar mensagem" e abre conversa no WhatsApp, a Meta injeta junto da **primeira mensagem** um bloco com os dados do anúncio. Na Evolution API (Baileys), esse bloco vem em `message.contextInfo.externalAdReply` e contém:

```text
sourceId       → ID do anúncio no Meta (ex: "120210000123456")
sourceUrl      → URL do anúncio
title          → headline do criativo
body           → texto do anúncio
thumbnailUrl   → imagem do criativo
```

Vamos capturar isso no webhook, cruzar com uma tabela de mapeamento `ad_id → imóvel`, e injetar a ficha do imóvel no contexto da Sofia.

### Limitação importante da Evolution API

A Evolution baseada em Baileys **só** entrega o `externalAdReply` quando o anúncio usa o formato **Click-to-WhatsApp padrão** (mensagem direta). Funciona na maior parte dos casos, mas não é 100% garantido como na Cloud API oficial. Se algum anúncio não trouxer o `sourceId`, a Sofia segue o fluxo normal (sem identificar o imóvel) — sem quebrar nada.

### O que vai ser construído

**1. Nova tabela `meta_ads_imoveis`**
- `ad_id` (text, único) — ID do anúncio do Meta
- `imovel_id` (uuid → imoveis.id)
- `nome_anuncio` (text, opcional, só pra você identificar na UI)
- `ativo` (bool)
- RLS: admin/gestor faz CRUD; corretor só lê.

**2. Nova aba "Anúncios Meta" em Integrações** (ou subseção em Marketing/Tráfego Pago)
- Lista todos os mapeamentos
- Botão "Novo mapeamento" → cola o ID do anúncio + busca o imóvel (SearchableSelect com HR-XXXX)
- Coluna extra mostrando os últimos referrals recebidos que **ainda não** têm mapeamento (pra você associar rápido)
- Toggle ativo/inativo

**3. Tabela de log `meta_ads_referrals`** (auditoria + descoberta)
- Toda vez que chegar uma mensagem com `externalAdReply`, gravamos: `ad_id`, `title`, `body`, `source_url`, `thumbnail_url`, `conversation_id`, `lead_id`, `recebido_em`, `imovel_id_resolvido` (nullable).
- Serve pra: (a) você ver na UI quais anúncios estão chegando e mapear; (b) auditoria de ROI por anúncio depois.

**4. Captura no `whatsapp-webhook`**
- Ler `data.message.contextInfo.externalAdReply` (ou `message.extendedTextMessage.contextInfo.externalAdReply` — variantes do Baileys).
- Quando presente: gravar em `meta_ads_referrals`, buscar `ad_id` em `meta_ads_imoveis`, e se achar, carregar o imóvel.
- Salvar `imovel_interesse = HR-XXXX` no lead e `origem = 'Meta Ads'`.

**5. Injeção no prompt da Sofia**
- Antes de chamar o modelo, se a conversa tiver um imóvel resolvido pelo anúncio, injetar bloco dinâmico no system prompt:

```text
[CONTEXTO_ANUNCIO]
Este lead chegou pelo anúncio "Sobrado Jardim Bela Vista" no Meta Ads.
Imóvel relacionado: HR-0023
- Título: Sobrado 3 dorm Jardim Bela Vista
- Valor: R$ 890.000
- Quartos: 3 (1 suíte) | Banheiros: 2 | Vagas: 2
- Área útil: 180m²
- Bairro: Jardim Bela Vista, Sinop/MT
- Link: https://hrimoveis.com/imovel/HR-0023
- Foto principal: <url>
[/CONTEXTO_ANUNCIO]

REGRA: na primeira resposta, mencione esse imóvel específico, mande a ficha resumida (título, valor, dorm/banh/vagas, bairro), a foto principal e o link, e pergunte se quer agendar visita ou tirar dúvidas.
```

- A Sofia já sabe enviar texto + mídia (vamos estender o sender pra mandar a foto via Evolution `sendMedia` quando o contexto trouxer thumbnail/foto).

**6. Envio da foto + ficha**
- Função utilitária no webhook: `sendPropertyCard(phone, imovel)` → envia 1 imagem (foto principal do imóvel) com caption contendo título/valor/specs/link.
- Sofia chama isso via nova tool `send_property_card` (com `imovel_codigo` como parâmetro), ou direto no fluxo de boas-vindas quando há contexto de anúncio.

### Arquivos tocados

- **Migração SQL**: criar `meta_ads_imoveis` e `meta_ads_referrals` com RLS.
- `supabase/functions/whatsapp-webhook/index.ts`:
  - Parser do `externalAdReply` (mensagem inbound).
  - Persistência em `meta_ads_referrals`.
  - Resolução `ad_id → imóvel` + carregamento dos dados do imóvel.
  - Injeção do bloco `[CONTEXTO_ANUNCIO]` no system prompt.
  - Nova tool `send_property_card` + helper `sendPropertyCard` (Evolution `sendMedia`).
  - Atualização do lead (`imovel_interesse`, `origem`).
- `src/pages/Integracoes.tsx` (ou nova `src/pages/MetaAds.tsx`):
  - Tela de CRUD do mapeamento `ad_id → imóvel`.
  - Lista de referrals recentes sem mapeamento.
- Novo hook `src/hooks/useMetaAdsMapping.ts`.
- Rota nova no `App.tsx`.

### O que NÃO muda

- Schema dos imóveis, leads, conversations, booking — intacto.
- Prompt principal da Sofia (só ganha bloco condicional quando há contexto).
- Fluxo de handoff humano, agendamento, sanitização.
- Fallback: se o anúncio chegar sem `sourceId` ou sem mapeamento, Sofia segue como hoje (pergunta o que o cliente busca).

### Pré-requisito do seu lado

Pra cada anúncio rodando no Meta, você vai precisar pegar o **ID do anúncio** (não da campanha nem do conjunto). Está no Gerenciador de Anúncios → coluna "ID do anúncio". Cola na nova tela e associa ao HR-XXXX. Os 10 imóveis em tráfego ficam mapeados em ~5 minutos.

### Próximo passo (futuro)

Quando migrarem pra **WhatsApp Cloud API oficial**, ganhamos automaticamente: `ctwa_clid` (pra mandar conversão de volta pro Meta via Conversions API), tracking de ROI por anúncio no painel da Meta, e referral 100% confiável. Mas isso é outra conversa.

Confirma que pode seguir?
