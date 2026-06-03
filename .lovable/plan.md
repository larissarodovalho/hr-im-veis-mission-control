## O que vamos entregar

Quando um lead novo for criado (Meta Ads, site, WhatsApp ou cadastro manual), todos os usuários que tiverem ligado o toggle **"Receber e-mail de novos leads"** receberão automaticamente um e-mail com nome, telefone, origem e link para abrir o lead no CRM.

O toggle fica disponível em **Usuários → botão "Permissões"** de cada pessoa (mesma janela onde já se libera/bloqueia os itens de menu), em uma nova seção **"Notificações"**.

## Passo a passo

1. **Banco**
   - Nova coluna `notify_new_leads boolean default false` em `profiles`.
   - Gatilho `AFTER INSERT` em `leads` que chama, via `pg_net`, a nova função `notify-new-lead` (não bloqueia o insert).

2. **Edge function `notify-new-lead`**
   - Recebe `lead_id`, busca o lead, lista os perfis com `notify_new_leads = true` e envia um e-mail para cada um usando a infraestrutura de e-mail já existente (`send-transactional-email`).
   - Idempotência por `new-lead-${lead.id}-${user_id}` para não duplicar em retries.

3. **Template de e-mail `new-lead-alert`**
   - Componente React Email no padrão visual dos templates já existentes, com:
     - Nome do lead, telefone, origem/fonte, intenção (quando houver)
     - Botão "Abrir lead no CRM" apontando para `/leads/<id>`

4. **UI — janela de Permissões do usuário (`UserPermissionsDialog`)**
   - Nova seção "Notificações" acima ou abaixo dos grupos de menu, com 1 switch: **"Receber e-mail quando chegar um lead novo"**.
   - Admin grava direto em `profiles.notify_new_leads` do usuário-alvo.

5. **Defaults**
   - Por padrão o toggle vem **desligado** para todos. O admin liga manualmente para os corretores que devem receber. (Posso inverter para ligado-por-padrão-para-corretores se preferir — diga na aprovação.)

## Fora do escopo

- Não vamos mexer em notificação push/in-app, só e-mail.
- Não vamos enviar e-mail retroativo para leads já existentes.
- Secretaria/marketing também poderão ligar o toggle se o admin quiser — não há restrição por papel, é por usuário.

## Detalhes técnicos

- Trigger usa `pg_net.http_post` para `…/functions/v1/notify-new-lead` com header `Authorization: Bearer <service_role>` (mesmo padrão já usado em `notify-immediate-contact`).
- `notify-new-lead` é deployada com `verify_jwt = false` e valida internamente o bearer `SUPABASE_SERVICE_ROLE_KEY`.
- Registro de `template_name = "new-lead-alert"` em `_shared/transactional-email-templates/registry.ts`.
- RLS de `profiles` já permite admin atualizar qualquer perfil; nada novo a criar.

Posso seguir com a implementação?