## Objetivo
Personalizar o e-mail de boas-vindas (novo usuário do CRM) com a identidade e os dados de contato oficiais da HR Imóveis.

## Dados que serão incluídos (extraídos do site institucional)
- **Endereço:** Av. dos Ingás, 2075 — Jd. Maringá, Sinop/MT
- **Telefone/WhatsApp:** (66) 99999-0000
- **E-mail institucional:** contato@hrimoveis.com.br
- **Site:** www.hrimoveis.com
- **Horário:** Seg a Sex 08h–18h · Sáb 08h–12h

## Mudanças no template
Arquivo único: `supabase/functions/_shared/transactional-email-templates/user-welcome.tsx`

1. **Cabeçalho de marca** — adicionar bloco no topo com nome "HR Imóveis" em destaque + subtítulo "Sinop — Mato Grosso", usando a paleta escura do site (preto/cinza/bege) já presente no template.
2. **Saudação personalizada** — manter "Olá, {nome}!" e ajustar o texto para soar como uma mensagem da equipe ("Seja bem-vindo(a) ao time HR Imóveis. Criamos seu acesso ao nosso CRM…").
3. **Credenciais** — caixa de credenciais com pequena melhoria visual (label em uppercase, espaçamento maior).
4. **Botão CTA** — manter "Acessar o CRM" apontando para `loginUrl`.
5. **Aviso de segurança** — manter, com texto mais claro sobre trocar a senha em Configurações → Perfil.
6. **Assinatura institucional (novo)** — rodapé com:
   - Linha "Equipe HR Imóveis"
   - Endereço, telefone, e-mail, horário
   - Link para o site
   - Pequena separação visual (linha cinza)
7. **Tipografia/cores** — manter `Montserrat`, preto `#2B2A29`, bege/cinza suaves já em uso para combinar com o site.

Subject permanece: "Seu acesso ao CRM HR Imóveis".

## Deploy e verificação
- Redeploy de `send-transactional-email` (carrega o template novo).
- Reenvio do e-mail de teste para o Hans (`hans@gruporodovalho.com.br`) com a senha temporária atual já redefinida, para você ver o resultado na caixa.

## Fora de escopo
- Não vou alterar o e-mail de notificação de lead nem templates de auth.
- Não vou adicionar logo agora (não encontrei arquivo `logo.*` em `public/` ou `src/assets/`). Se quiser, depois é só me dizer qual usar e eu adiciono no topo do e-mail.