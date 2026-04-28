## Contexto

A cópia do CRM Brazil Lands → HR Imóveis foi feita em **25/04/2026 ~21:40**. De lá pra cá, o Brazil Lands recebeu várias melhorias que ainda não estão aqui. Listei o que faz sentido trazer (adaptando ao schema do HR Imóveis: `leads`, `contas`, `imoveis`, `interacoes`, `whatsapp_*`, `reunioes` etc.) e o que não vale.

## O que vou trazer

### 1. Módulo de Documentos com Clicksign (assinatura eletrônica)
Maior adição do período. Permite enviar contratos pra cliente assinar com validade jurídica, vinculando ao lead/conta.

- **Banco**: tabelas novas `signed_documents`, `document_signers`, `document_events`; bucket privado `signed-documents`; RLS staff vê tudo, admin deleta; realtime ligado.
- **Edge functions**:
  - `clicksign-create-document` — upload do PDF + criação na Clicksign + signers
  - `clicksign-webhook` (sem JWT, valida HMAC) — atualiza status em tempo real
  - `clicksign-resend-notification`, `clicksign-cancel-document`, `clicksign-download-signed`
  - `_shared/clicksign.ts` — helper de API + HMAC
- **Páginas/componentes novos**: `Documents.tsx` (lista com filtros de status), `DocumentDetail.tsx` (timeline + ações), `SendDocumentDialog.tsx`, `EntityDocumentsTab.tsx`, `DocumentStatusBadge.tsx`.
- **Integração nas telas**: aba "Documentos" em `LeadDetail.tsx` e `AccountDetail.tsx`, item no sidebar (`AppLayout.tsx`/`AppSidebar.tsx`), rotas em `App.tsx`.
- **Validação**: signer precisa ter nome + sobrenome (mínimo 2 partes com 2+ caracteres) — front e edge.
- **Secrets**: vou pedir `CLICKSIGN_API_TOKEN`, `CLICKSIGN_HMAC_SECRET`, `CLICKSIGN_ENV` (`sandbox` ou `production`). Webhook URL: `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/clicksign-webhook`.

### 2. WhatsApp — normalização de telefone BR + sem duplicar lead
Resolve o caso de o mesmo contato gerar conversa/lead novo só porque veio com/sem o "9" extra ou com/sem DDI 55.

- Migração: função `public.normalize_br_phone(text)` que retorna DDD + 8 últimos dígitos (canônico).
- `whatsapp-webhook/index.ts`: lookup de conversa e lead por **tail canônico** (últimos 8–10 dígitos) antes de criar registros novos.
- `whatsapp-send/index.ts`: ajustar erro genérico (sumir "Z-API não configurado", priorizar Evolution se variáveis presentes).

### 3. Editar e excluir conversa no WhatsApp
- `WhatsApp.tsx`: botão lápis (editar telefone) e lixeira (admin only, com `AlertDialog`); cascade delete em `whatsapp_messages` antes de remover a conversa; normalização de telefone na edição.

### 4. Botão "Chamar no WhatsApp" no LeadDetail
- Em `LeadDetail.tsx`: botão verde no card de Contato. Cria conversa em `whatsapp_conversations` se não existir e navega para `/app/whatsapp?conv={id}`.
- Em `WhatsApp.tsx`: ler `?conv=` via `useSearchParams` e abrir a conversa automaticamente.

### 5. Interação tipo "videochamada" no LeadDetail
- Garantir que o select de "Registrar interação" tenha `Reunião` e `Videochamada` (em interacoes.tipo é text, basta adicionar opções e label amigável).

### 6. Badge "Convertido em conta" no Lead
- `LeadDetail.tsx` e `Leads.tsx` (kanban + lista): se houver `contas.lead_id_origem = lead.id`, mostrar badge verde "Convertido em conta" (linkando pra `/app/contas`) ao invés do botão "Converter em conta".
- Conversão **não muda** mais a etapa do funil — o lead continua onde estava.

### 7. Botão "Editar lead" no LeadDetail
- Dialog para corrigir nome, telefone, email, região, qualificação/interesse, valor estimado, temperatura.

### 8. Responsividade mobile (varredura)
Aplicar o padrão usado no Brazil Lands em todas as páginas que ainda não estão adaptadas:
- Padding adaptativo `p-4 sm:p-6 lg:p-8` (Leads, LeadDetail, AccountDetail, Schedule, Dashboard, Reports, Users, Settings, Meetings, Calls, Visits).
- Headers `flex-col md:flex-row`.
- Tabelas viram **cards no mobile** + tabela no desktop em Meetings/Calls/Visits/Leads (lista).
- Kanban com `overflow-x-auto -mx-4 px-4` para edge-to-edge.
- WhatsApp: alternar lista/chat em tela cheia no mobile, botão "voltar", URLs clicáveis com `break-all`, scroll automático para última mensagem ao abrir conversa.
- `AppLayout.tsx`: `h-[100dvh]` + `overscroll-y-contain` + barra superior fixa no mobile.
- `index.css`: `html/body/#root` com altura 100% e `overscroll-behavior-y: none`.

### 9. Auth — mostrar/esconder senha
- `Auth.tsx`: toggle olho (Eye/EyeOff) no campo senha.

### 10. Pequenos ajustes
- `update-user` edge: usar `getClaims(token)` em vez de `getUser()` (resolve 401 stale token).
- Validação de nome+sobrenome nos signers de documento (já listado no item 1, citando aqui pra reforço).

## O que NÃO vou trazer (ou não se aplica)

- **Páginas Audit, Trash, Unsubscribe, Capture pública, Agendar, AppointmentPicker, NotificationBell, AssignSelector** — são de produtos/fluxos do Brazil Lands (rural, captação pública, auditoria avançada) que não foram pedidos aqui.
- **Edge functions: `available-slots`, `book-appointment`, `public-chat`, `lead-webhook`, `notify-*`, `*email*`, `invite-user`, `auth-email-hook`, `process-email-queue`, `send-transactional-email`** — pertencem a fluxos de captação pública e e-mails transacionais que o HR Imóveis não tem hoje.
- **Refatorações específicas do AccountDetail do Brazil Lands** (múltiplas propriedades por conta com `account_properties`, comissão removida, exportação Excel da lista de contas) — o HR Imóveis tem modelo diferente de contas + página `Imoveis` separada; mexer aí é refator grande, fora do escopo "trazer alterações". Posso fazer em loop separado se quiser.

## Detalhes técnicos

### Migração principal (Documentos)
```sql
create type signed_document_status as enum ('draft','sent','viewed','signed','cancelled','expired');
create type document_signer_status as enum ('pending','viewed','signed','refused');

create table signed_documents (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  status signed_document_status not null default 'draft',
  lead_id uuid references leads(id) on delete set null,
  conta_id uuid references contas(id) on delete set null,
  file_url text, signed_file_url text,
  clicksign_key text, clicksign_env text,
  created_by uuid not null, created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- + document_signers, document_events, RLS, índices, realtime
```

### Função de normalização BR
```sql
create or replace function public.normalize_br_phone(p text)
returns text language plpgsql immutable as $$
declare digits text;
begin
  digits := regexp_replace(coalesce(p,''), '\D', '', 'g');
  if length(digits) > 10 and left(digits,2) = '55' then digits := substr(digits,3); end if;
  if length(digits) = 11 and substr(digits,3,1) = '9' then
    return substr(digits,1,2) || substr(digits,4);
  end if;
  return right(digits,10);
end$$;
```

### supabase/config.toml
Adicionar bloco com `verify_jwt = false` para `clicksign-webhook`.

## Ordem de execução
1. Migração SQL (Clicksign + normalize_br_phone) e bucket
2. Edge functions Clicksign + ajustes em whatsapp-webhook/whatsapp-send
3. Páginas/componentes Documentos + integração no sidebar e detail pages
4. WhatsApp: editar/excluir, chamar do lead, deep-link `?conv=`
5. LeadDetail: editar lead, badge convertido, videochamada, conversão sem mover etapa
6. Auth: olho da senha
7. Varredura mobile global (último porque toca muitos arquivos)
8. Pedir os 3 secrets do Clicksign no final

## Confirmação
Posso seguir trazendo todos esses itens? Ou quer que eu pule algum (por ex. pular Clicksign agora e deixar pra depois, ou pular o item 8 de mobile)?