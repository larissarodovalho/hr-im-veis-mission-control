## Adicionar aba "Integrações & IA" em Configurações (igual Brazil Lands)

A aba **WhatsApp** já está completa (status, QR Code, webhook, teste). Vou agora replicar o restante do que a Brazil Lands tem em Configurações, criando uma nova aba **"Integrações & IA"** em `/app/configuracoes`.

### Nova aba "Integrações & IA" — 3 cartões

**1. Webhook de captação de leads**
- Mostra a URL: `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/lead-webhook`
- Botão **"Copiar URL"**.
- Texto explicativo: "Configure este endpoint no Meta Lead Ads, Google Ads ou em formulários externos."
- Exemplo do JSON esperado em `<code>`: `{ "full_name", "phone", "email", "source", "interest", "region", "notes" }`.

**2. IA conversacional**
- Cartão informativo: "A IA atende leads no WhatsApp quando o toggle está ativo na conversa."
- Badge mostrando o modelo: `google/gemini-3-flash-preview` (via Lovable AI).
- Texto: "Para personalizar o prompt da IA, peça ao Lovable."

**3. Landing de captura**
- Mostra a URL pública: `{origem}/captura`.
- Botão **"Copiar URL"**.
- Texto: "Compartilhe a URL pública nos seus anúncios."

### Pequenos ajustes na aba existente

- Tornar a `TabsList` `flex-wrap` para acomodar a nova aba sem cortar em telas menores.
- Adicionar ícones novos do `lucide-react`: `Webhook`, `Bot`, `Globe`, `Check`.

### O que NÃO vou fazer agora

- **Não vou criar** a edge function `lead-webhook` nem a página `/captura` neste passo — apenas mostrar a URL/configuração na tela, exatamente como a Brazil Lands faz no card visual. Se você quiser ativar de verdade depois (criar o endpoint que recebe os leads do Meta Ads e a landing pública), me avisa que eu implemento num passo seguinte.

### Arquivo afetado

- `src/pages/ConfiguracoesPage.tsx` — adicionar a aba e o componente.

### Sem mudanças em

- Banco, RLS, secrets, edge functions existentes.
