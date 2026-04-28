## Conectar o WhatsApp no HR Imóveis — passo a passo dentro do CRM

Hoje a página WhatsApp está dando erro (lista de conversas não carrega) e não existe nenhuma tela para conectar/parear o número. Vamos resolver os dois pontos.

### Parte 1 — Corrigir o erro da lista de conversas (bug atual)

A página tenta fazer um JOIN entre `whatsapp_conversations` e `leads`, mas a coluna `lead_id` é texto sem chave estrangeira, então o Supabase retorna **400 PGRST200** e a lista some.

Correção: buscar os nomes dos leads em uma segunda chamada (filtrando só IDs em formato UUID) e juntar em memória. Sem mudança de banco.

### Parte 2 — Nova aba "WhatsApp" em Configurações (igual Brazil Lands)

Vou criar uma seção dedicada em `/app/configuracoes` chamada **"Conexão WhatsApp"** com tudo que você precisa para parear o número, no mesmo padrão do Brazil Lands:

**1. Cartão "Status da instância Evolution"**
- Mostra o nome da instância configurada (`EVOLUTION_INSTANCE_NAME`).
- Indicador colorido: 🟢 **Conectada** / 🟡 **Aguardando QR Code** / 🔴 **Desconectada**.
- Botão **"Atualizar status"** (consulta `GET /instance/connectionState/{instance}` da Evolution).
- Botão **"Reiniciar instância"** (chama `PUT /instance/restart/{instance}`).
- Botão **"Desconectar"** (chama `DELETE /instance/logout/{instance}`).

**2. Cartão "Conectar número (QR Code)"**
- Botão grande **"Gerar QR Code"** que chama a Evolution (`GET /instance/connect/{instance}`).
- Mostra a imagem do QR Code retornada (base64).
- Instrução curta: "Abra o WhatsApp no celular → Aparelhos conectados → Conectar um aparelho → escaneie".
- Atualiza automaticamente o status a cada 5 segundos enquanto o modal está aberto; quando ficar **Conectada**, mostra ✅ e fecha sozinho.

**3. Cartão "Webhook de mensagens recebidas"**
- Mostra a URL do webhook que você precisa colar na Evolution:
  `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/whatsapp-webhook`
- Botão **"Copiar URL"**.
- Botão **"Configurar webhook na Evolution"** que faz a chamada `POST /webhook/set/{instance}` automaticamente, registrando essa URL para os eventos `MESSAGES_UPSERT` e `CONNECTION_UPDATE`. Assim você não precisa entrar no painel da Evolution.
- Indicador "Webhook ativo: sim/não" (consulta `GET /webhook/find/{instance}`).

**4. Cartão "Testar envio"**
- Campo telefone + campo mensagem + botão **"Enviar teste"**.
- Chama a edge function `whatsapp-send` com `{ phone, content }`.
- Mostra resultado: ✅ enviado, ou ❌ erro com a mensagem da Evolution.

### Parte 3 — Edge function nova: `whatsapp-instance`

Centraliza todas as chamadas administrativas para a Evolution (status, QR, restart, logout, set webhook, find webhook). A página de configurações chama essa função com `{ action: "status" | "qrcode" | "restart" | "logout" | "set-webhook" | "find-webhook" }`. Vantagens:
- Não expõe a `EVOLUTION_API_KEY` no front.
- Validação de JWT (só admin pode chamar).
- Reaproveita as 3 secrets que já existem: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`.

### Como você vai usar (passo a passo no CRM, depois de pronto)

1. Vai em **Configurações → Conexão WhatsApp**.
2. Clica em **"Configurar webhook na Evolution"** (uma vez só) — registra automaticamente o webhook que recebe as mensagens.
3. Clica em **"Gerar QR Code"** → escaneia com o celular.
4. O status muda pra 🟢 **Conectada** sozinho.
5. Faz um **"Enviar teste"** para o seu próprio número pra confirmar.
6. Pronto: a partir daí, a página `/app/whatsapp` recebe e envia mensagens normalmente.

### Arquivos afetados

- `src/pages/WhatsApp.tsx` — corrige o JOIN quebrado.
- `src/pages/Settings.tsx` (ou `Configuracoes.tsx`) — adiciona a nova seção "Conexão WhatsApp". Vou identificar o arquivo exato e a estrutura de abas dele antes de editar.
- `supabase/functions/whatsapp-instance/index.ts` — função nova, gerencia conexão Evolution.

### O que não muda

- Tabelas, RLS, secrets — tudo já está pronto.
- `whatsapp-send` e `whatsapp-webhook` — continuam como estão.
