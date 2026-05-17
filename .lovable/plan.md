## Objetivo
Quando um admin cadastrar um novo usuário em **Usuários**, o sistema envia automaticamente um e-mail para esse usuário com:
- saudação personalizada (nome)
- link de acesso ao CRM
- e-mail de login + senha temporária
- orientação para trocar a senha no primeiro acesso

## Como funciona

1. **Novo template transacional** `user-welcome` na infraestrutura de e-mails já existente do projeto (a mesma usada hoje para alertas de contato imediato — não precisa configurar Resend nem domínio novo).
   - Assunto: "Seu acesso ao CRM HR Imóveis"
   - Corpo com nome, e-mail, senha temporária em destaque, botão "Acessar CRM" e nota sobre alterar a senha após o primeiro login.

2. **Registrar** o template em `_shared/transactional-email-templates/registry.ts` para ficar disponível na função `send-transactional-email`.

3. **Atualizar** `admin-create-user` (ação `create`): logo após criar o usuário com sucesso, dispara `send-transactional-email` com o template `user-welcome` para o e-mail do novo usuário, passando nome, e-mail, senha e URL do app.
   - O envio é "best effort" — se falhar, o usuário ainda é criado e o admin recebe a senha na tela (igual hoje). Erro vai apenas para o log.

4. **UI** em `UsuariosAdminPage.tsx`: após criar com sucesso, mostrar toast informando "Usuário criado. E-mail de boas-vindas enviado para {email}".

## Detalhes técnicos

- Arquivos criados/editados:
  - `supabase/functions/_shared/transactional-email-templates/user-welcome.tsx` (novo)
  - `supabase/functions/_shared/transactional-email-templates/registry.ts` (adicionar entrada)
  - `supabase/functions/admin-create-user/index.ts` (chamar `send-transactional-email` via fetch interno após criar)
  - `src/pages/UsuariosAdminPage.tsx` (texto do toast)
- Deploy: `admin-create-user` e `send-transactional-email`.
- Nenhuma migração de banco necessária — infra de e-mail e domínio já estão configurados.

## Fora do escopo
- Não altera fluxo de redefinição de senha (botão "redefinir senha" continua só mostrando a nova senha ao admin, como hoje). Posso depois adicionar envio por e-mail também se quiser.