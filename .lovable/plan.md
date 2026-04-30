## Diagnóstico

Dois bugs visíveis na conversa:

1. **Link antigo (id-preview)**: foi enviado às 11:15, ANTES do redeploy de hoje. Os próximos links já vão para `www.hrimoveis.com`. Nada mais a corrigir aqui — é só um resíduo da mensagem anterior.

2. **Resposta corrompida `5GaqdC1b? kind=presencial&uuid=fb0c6576-...`**: o Gemini "alucinou" e cuspiu como texto algo que parece uma chamada de função/URL, em vez de invocar a tool `send_booking_link` pelo canal `tool_calls`. O webhook então:
   - Não detectou `bookingKind` (porque não foi tool_call de verdade).
   - Mandou o texto cru pro WhatsApp.
   - O regex `reply.replace(/https?:\/\/\S+/g, "")` só limpa URLs com `http(s)://`, não pega esse fragmento.

## Correções

### `supabase/functions/whatsapp-webhook/index.ts`

**a) Sanitizador de resposta** — antes de gravar/enviar `reply`, remover qualquer "vazamento" de tool call ou parâmetro técnico:

```ts
function sanitizeReply(s: string): string {
  return s
    // URLs completas
    .replace(/https?:\/\/\S+/g, "")
    // Fragmentos com kind=... uuid=... token=...
    .replace(/\S*(?:kind|uuid|token|lead_id|conversation_id)\s*=\s*\S+/gi, "")
    // Tokens base64-like soltos no início (ex.: "5GaqdC1b?")
    .replace(/(^|\s)[A-Za-z0-9_-]{8,}\?(\s|$)/g, " ")
    // Marcadores de tool call em texto
    .replace(/\b(send_booking_link|request_immediate_contact|update_lead_info)\s*\([^)]*\)/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
```
Aplicar em `reply` após o loop de tool calls (linha ~607) e novamente nos branches de `immediateKind`/`bookingKind`.

**b) Detecção de intent vazado** — se `reply` contém `kind=(videochamada|presencial|ligacao|whatsapp)` e nenhuma tool foi chamada, **inferir** a tool e tratar como `bookingKind` (ou `immediateKind` se a última msg do user tem urgência). Isso evita que o lead receba lixo quando o modelo falha em chamar a tool corretamente.

**c) Reforço no prompt do sistema** (`AI_SYSTEM`):
- Adicionar regra explícita: "NUNCA escreva nomes de função, parâmetros (kind=, uuid=, token=) nem URLs na sua resposta. Para enviar o link de agendamento, use SEMPRE a tool `send_booking_link` — o sistema gera e anexa o link."

**d) Reordenar cascata de modelos** — colocar `gpt-5-mini` antes do `gemini-2.5-pro`, já que o Gemini está alucinando mais com tool calls neste fluxo:
```ts
const MODELS = ["openai/gpt-5-mini", "google/gemini-2.5-pro", "google/gemini-2.5-flash"];
```

**e)** Redeployar `whatsapp-webhook`.

## Fora de escopo
- Não mexo na página `/agendar` (já funcionando com novo design).
- Não mexo no fluxo de notificação por email.
