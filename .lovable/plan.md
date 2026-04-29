## Visão geral

Hoje, quando a Sofia capta a preferência de contato (videochamada / presencial / ligação), ela apenas avisa "o Hans confirma em breve". O lead nunca escolhe data e hora — quem agenda é o Hans depois, manualmente.

A proposta é: a Sofia envia um **link público de agendamento** no WhatsApp. O lead abre no navegador, vê o tipo de reunião já pré-selecionado, escolhe data/hora num calendário visual, confirma. Isso cria automaticamente uma `reuniao` no CRM, vinculada ao lead, e a Sofia confirma de volta no WhatsApp.

Não dá pra mostrar calendário interativo *dentro* do WhatsApp (limite do canal). Link externo é o padrão de mercado (Calendly, Cal.com, etc.) e funciona bem.

---

## Como vai funcionar (fluxo do lead)

1. Conversa segue o fluxo atual no WhatsApp até a Sofia perguntar a preferência.
2. Lead escolhe (ex.: "videochamada").
3. Sofia chama a tool `send_booking_link` (já existe) e responde algo como:
   > "Perfeito! Escolhe o melhor dia e horário aqui: https://hrimoveis.app/agendar/abc123"
4. Lead abre o link → página pública carrega o tipo de reunião + nome do lead, mostra calendário com dias úteis dos próximos 14 dias e os horários livres (9h–18h, slots de 30 ou 60 min).
5. Lead seleciona dia e horário, confirma.
6. Sistema cria `reuniao` no banco (tipo correto, agendada_para, lead_id, criado_por_ia=true) e mostra tela de "Agendamento confirmado".
7. Sofia recebe um aviso (via webhook interno) e envia no WhatsApp:
   > "✅ Anotado! Sua videochamada com o Hans está marcada para terça, 5/maio às 14h."
8. Hans vê a reunião na agenda do CRM (`/app/agenda`) imediatamente.

---

## Como vai funcionar (lado backend)

### Token único por agendamento
Cada vez que `send_booking_link` é chamada, gera um token aleatório (32 chars), salva numa tabela nova `booking_links` com:
- `token` (único, indexado)
- `lead_id`, `conversation_id`, `phone`, `nome` (snapshot, pra página pública carregar sem precisar acessar `leads` direto)
- `kind` (videochamada / presencial / ligacao)
- `expires_at` (7 dias)
- `used_at` (preenche quando o lead confirma)

Token vai na URL: `https://<dominio>/agendar/{token}`.

### Página pública de agendamento
Rota nova `/agendar/:token` (acessível sem login):
- Carrega via edge function `booking-info` (passa token, devolve dados do snapshot + slots disponíveis dos próximos 14 dias úteis).
- Calcula slots batendo contra `agenda_bloqueios` e `reunioes` existentes (fim de semana fora, 9h–18h, duração de acordo com o tipo: ligação 30min, video/presencial 60min).
- Renderiza shadcn `Calendar` + lista de horários. Tipo de reunião já vem fixado (badge no topo, sem opção de trocar — ele já escolheu na conversa).
- Ao confirmar, chama edge function `booking-confirm` (token + datetime ISO).

### Edge functions novas
- `booking-info` (GET, público): valida token, devolve `{ kind, nome, slots: [...] }`.
- `booking-confirm` (POST, público): valida token + slot ainda livre → cria `reuniao` (via service role) → marca `used_at` → dispara mensagem de confirmação no WhatsApp via `whatsapp-send` → devolve `{ ok, reuniao_id }`.

### Mudança no `whatsapp-webhook`
No bloco `send_booking_link` atual: gerar token, gravar em `booking_links`, montar URL e injetar na resposta da Sofia (anexar ao texto se ela não pôs sozinha). Atualizar o prompt para a Sofia mencionar "vou te mandar o link" quando chamar a tool.

---

## Arquivos afetados

```text
NOVOS:
  supabase/functions/booking-info/index.ts        edge function pública
  supabase/functions/booking-confirm/index.ts     edge function pública
  src/pages/AgendarPage.tsx                       página pública /agendar/:token
  src/components/booking/SlotPicker.tsx           calendário + slots
  + migração: tabela booking_links

EDITADOS:
  supabase/functions/whatsapp-webhook/index.ts    gerar token + URL no send_booking_link, ajustar prompt
  src/App.tsx                                     rota pública /agendar/:token
```

---

## Detalhes técnicos

- **Domínio do link**: usar `window.location.origin` quando disponível ou variável `PUBLIC_BASE_URL` (preview Lovable + custom domain quando houver). No webhook, o domínio vem do env `PUBLIC_APP_URL` (novo secret — pergunto antes); fallback: `https://id-preview--{project-id}.lovable.app`.
- **Tipo → duração**: `ligacao=30min`, `videochamada=60min`, `presencial=60min`.
- **Cálculo de slots**: backend gera todos os slots úteis dos próximos 14 dias e remove os que conflitam com `reunioes.agendada_para` (mesma duração) ou caem dentro de `agenda_bloqueios`. Sem GCal por enquanto (a integração existe no projeto mas só do lado do dev — não dá pra ler a agenda do Hans sem OAuth dele; deixo pra depois se quiser).
- **Nova tabela `booking_links`**: RLS com SELECT público apenas via edge function (service role); sem políticas para `authenticated` (ninguém precisa ler direto).
- **Dedup**: se o lead clicar 2x e confirmar 2 vezes, o `used_at` impede duplicar reunião. Conflito de slot devolve erro amigável e re-renderiza horários.
- **Fuso**: tudo em America/Sao_Paulo na UI; gravado em UTC no banco.
- **Confirmação de volta**: `booking-confirm` chama `whatsapp-send` (já existe) com a mensagem formatada e insere também na tabela `whatsapp_messages` como outbound.

---

## O que **não** vai mudar agora

- Nada no widget de chat web (a outra adaptação que conversamos antes não foi aprovada — esse plano é só WhatsApp).
- Sem integração com Google Calendar do Hans (precisa OAuth próprio dele; posso fazer depois).
- Sem reagendamento/cancelamento via link (versão 2, se quiser).
- Sem secret novo se você preferir hardcodar o domínio do preview por enquanto — pergunto antes.

---

## Pergunta antes de implementar

Qual domínio usar para o link?
- Preview atual `id-preview--9ba329fa-bc86-4fa7-8521-f11e9da54abe.lovable.app` (funciona já).
- Domínio customizado (qual?).
- Um secret `PUBLIC_APP_URL` que você atualiza quando publicar.