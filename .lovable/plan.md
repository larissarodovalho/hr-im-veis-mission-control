## Diagnóstico

No print da Larissa o fluxo foi:

1. Sofia pediu nome → ela respondeu "Larissa Rodovalho"
2. Sofia perguntou interesse → ela respondeu "Vender minha casa"
3. Sofia ofereceu o handoff (Passo 3) → ela respondeu "Reunião presencial"
4. **Sofia respondeu de novo com a saudação inicial** ("Olá! Sou a Sofia… pode me dizer seu nome e sobrenome?") — em vez de chamar `send_booking_link(kind=presencial)` e mandar o link.

A função `whatsapp-webhook` depende 100% do LLM para escolher chamar `send_booking_link`. Quando o modelo "trava" e retorna vazio + sem tool calls, o fallback determinístico em `whatsapp-webhook/index.ts` (linhas 622–632) cai num `if/else` que, em algum caminho, mandou de volta a saudação do Passo 1. Isso só acontece quando o código avalia `hasName=false` naquele momento (ou o próprio modelo gerou o texto do Passo 1 porque se perdeu no contexto).

Em qualquer dos dois casos a raiz é a mesma: **a transição "usuário escolheu o formato (presencial/videochamada/ligação/whatsapp) depois do Passo 3" está delegada ao modelo, sem rede de segurança**. Se o LLM falha, a Sofia vira do avesso.

## Plano

### 1. Investigar (sem mexer em código)

- Ler os logs da edge function `whatsapp-webhook` no horário 12:48 (mensagem "Reunião presencial") para confirmar qual cenário aconteceu:
  - Modelo retornou texto do Passo 1 por conta própria? ou
  - Modelo retornou vazio e o fallback `!hasName` foi acionado? (nesse caso descobrir por que `hasName` virou false — possível causa: `leadRow.nome` ainda começa com "WhatsApp " porque o `update_lead_info` do turno anterior não persistiu)

### 2. Atalho determinístico pós-handoff (correção principal)

Antes de chamar o LLM, detectar este padrão e agir sem depender do modelo:

- Pegar a última mensagem outbound da Sofia.
- Se ela contém a frase do Passo 3 ("Posso te conectar com nosso corretor" / "prefere agendar uma conversa" / "falar agora mesmo"), interpretar a nova mensagem do usuário com regex simples:
  - "presencial" / "pessoal" / "escritório" → `kind = presencial`
  - "video" / "vídeo" / "chamada" → `kind = videochamada`
  - "ligaç" / "telefone" / "me liga" → `kind = ligacao`
  - "whats" / "zap" / "aqui mesmo" → `kind = whatsapp`
  - "agora" / "já" / "imediato" → marcar como `immediateKind`
- Se casar e `canTriggerHandoff = true`, **forçar** `bookingKind`/`immediateKind` direto (mesmo caminho que o tool call já usa, das linhas 670–716), pular o loop do LLM e enviar a explicação + link.

Isso garante que, uma vez que Sofia perguntou o formato, qualquer resposta que combine com um dos 4 formatos sempre vira link, independente do humor do modelo.

### 3. Reforçar o fallback final (rede de segurança)

No bloco `if (!reply)` (linhas 622–632), antes de cair no `!hasName`, checar também se a última pergunta da Sofia foi a saudação Passo 1. Se a última outbound JÁ foi o Passo 1 e a inbound atual não é um nome reconhecível, **não repetir o Passo 1**; responder algo como "Desculpa, não entendi — pode me confirmar seu nome completo?". Isso quebra qualquer loop de repetição.

### 4. Validar

- Testar manualmente via `supabase--curl_edge_functions` simulando a sequência: nome → "vender" → "presencial" e conferir que o link `/agendar/<token>` é enviado.
- Pedir à Larissa para refazer o teste no celular real e confirmar que o link chega.

### 5. Não mexer

- Não tocar na página `/agendar/:token` (já corrigida no ciclo anterior).
- Não mudar prompt do sistema além do necessário — o atalho determinístico fica fora do LLM.

## Detalhes técnicos

Arquivo único alterado: `supabase/functions/whatsapp-webhook/index.ts`.

Inserir, entre o cálculo de `canTriggerHandoff` (linha 512) e o loop de tool calls (linha 524), um bloco:

```ts
const lastAssistantMsg = (history ?? []).filter(h => h.direction === "outbound").slice(-1)[0]?.content || "";
const askedForFormat = /prefere agendar|posso te conectar|falar agora|videochamada.*presencial.*ligaç/i.test(lastAssistantMsg);
const userLower = (content || "").toLowerCase();

let forcedBookingKind: string | null = null;
let forcedImmediate = false;
if (askedForFormat && canTriggerHandoff) {
  if (/\b(agora|j[áa]|imediat|urg)/.test(userLower)) forcedImmediate = true;
  if (/presenc|pessoal|escrit[óo]rio/.test(userLower))      forcedBookingKind = "presencial";
  else if (/v[íi]deo|chamada/.test(userLower))              forcedBookingKind = "videochamada";
  else if (/ligaç|telefon|me liga/.test(userLower))         forcedBookingKind = "ligacao";
  else if (/whats|zap|aqui mesmo/.test(userLower))          forcedBookingKind = "whatsapp";
}
```

Se `forcedBookingKind || forcedImmediate` setar `bookingKind`/`immediateKind` direto e pular o loop do LLM (`MODELS.length = 0` ou guarda condicional).
