# Replicar configuração WhatsApp + IA da Brazil Lands no HR Imóveis

## Diagnóstico das diferenças

Comparei os dois projetos. A Brazil Lands é mais simples e funciona porque:

1. **Nome do secret diferente:** Brazil Lands usa `EVOLUTION_INSTANCE` (sem `_NAME`). HR está com `EVOLUTION_INSTANCE_NAME` — por isso o `whatsapp-instance` retorna HTML (instância não casa).
2. **Não existe `whatsapp-instance` na Brazil Lands.** A conexão (QR Code, status, restart, logout) é feita **direto no painel da Evolution**, não pelo CRM. O CRM apenas:
   - **Recebe** mensagens via `whatsapp-webhook` (a Evolution chama esse endpoint).
   - **Envia** mensagens via `whatsapp-send` (com IA de fallback).
3. **IA conversacional rica no `whatsapp-webhook`:**
   - `callAI()` chama `https://ai.gateway.lovable.dev/v1/chat/completions`
   - Cascata de modelos: `gemini-2.5-pro` → `gemini-2.5-flash` → `gpt-5-mini`
   - Suporte a **transcrição de áudio** com `gemini-2.5-flash`
   - Sistema de **tool calling** (função `ToolCall`) para a IA executar ações no CRM
4. **Chat público (`/captura`)** usa `public-chat` Edge Function com `gemini-2.5-flash`.
5. Aceita também **Z-API** como provider alternativo (`WA_PROVIDER=zapi`).

## O que vou alterar

### 1. Renomear o secret no HR Imóveis
- Adicionar novo secret `EVOLUTION_INSTANCE` com o **mesmo valor** que está hoje em `EVOLUTION_INSTANCE_NAME`.
- Atualizar `supabase/functions/whatsapp-send/index.ts` e `whatsapp-webhook/index.ts` para ler `EVOLUTION_INSTANCE` (com fallback para `EVOLUTION_INSTANCE_NAME` por compatibilidade).
- Adicionar suporte a `WA_PROVIDER` (evolution|zapi).

### 2. Substituir `whatsapp-instance` pela abordagem da Brazil Lands
- **Remover** `supabase/functions/whatsapp-instance/index.ts` (não existe na Brazil Lands).
- **Remover** o card "Status da instância / QR Code / Reiniciar / Desconectar" do `ConfiguracoesPage.tsx`.
- Manter apenas:
  - **Card informativo** explicando que QR Code e status são gerenciados no painel da Evolution.
  - **Card de teste de envio** (continua funcionando via `whatsapp-send`).
  - **Card webhook** mostrando a URL `whatsapp-webhook` que o usuário cola na Evolution.

### 3. Replicar `whatsapp-webhook` com IA (cópia adaptada da Brazil Lands)
- Trazer a estrutura completa do webhook da Brazil Lands:
  - Cascata de modelos (`gemini-2.5-pro` → `gemini-2.5-flash` → `gpt-5-mini`)
  - Função `transcribeAudio` para mensagens de voz
  - Sistema de `tool calling` (ações da IA no CRM)
  - Função `fetchEvolutionMediaBase64` para buscar mídia
- Adaptar **system prompt** para o contexto HR Imóveis (imobiliária urbana, não rural).
- Adaptar tabelas/IDs ao schema do HR (já tem `whatsapp_conversations`, `whatsapp_messages`, `leads`).

### 4. Replicar `public-chat` (chat da landing `/captura`)
- Criar `supabase/functions/public-chat/index.ts` com a mesma estrutura.
- System prompt customizado para HR Imóveis.
- Modelo `gemini-2.5-flash`.

### 5. Atualizar UI de Configurações → IA
- Mostrar a cascata de modelos usados (Pro → Flash → GPT-5-mini), em vez de apenas `gemini-3-flash-preview`.
- Mencionar suporte a transcrição de áudio.

## Detalhes técnicos

### Arquivos editados
- `supabase/functions/whatsapp-send/index.ts` — usar `EVOLUTION_INSTANCE`
- `supabase/functions/whatsapp-webhook/index.ts` — reescrever com IA + tool calling + áudio
- `supabase/functions/public-chat/index.ts` — **novo**
- `src/pages/ConfiguracoesPage.tsx` — remover bloco `WhatsAppConnection` (status/QR), simplificar
- `supabase/functions/whatsapp-instance/index.ts` — **deletar**

### Secrets
- Adicionar runtime secret `EVOLUTION_INSTANCE` (vou abrir o formulário durante a execução).
- (Opcional) `WA_PROVIDER` se quiser usar Z-API no futuro.

### System prompt da IA
Vou usar uma versão adaptada do prompt da Brazil Lands, focada em **HR Imóveis** (imobiliária urbana). Texto base que vou usar:
- "Você é a assistente virtual da HR Imóveis"
- Qualifica leads, captura interesse (compra/aluguel, região, faixa de preço)
- Sugere imóveis disponíveis no banco
- Agenda visitas
- Transfere para corretor humano quando detecta intenção forte

Se quiser ajustar o prompt antes de eu rodar, me avise.

## Fora do escopo
- Não vou criar ainda a página `/captura` (frontend da landing) — só a Edge Function que ela vai consumir.
- Não vou tocar em ClickSign, e-mail transacional, ou outras funções que não pertencem ao WhatsApp/IA.
