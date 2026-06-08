## Visão geral

Na aba **Newsletter** você passa a ter um compositor de campanha: escolhe imóveis em destaque do site, escreve um trecho sobre o mercado, gera um rascunho, recebe um e-mail de aviso para aprovar e, ao confirmar, o sistema dispara um e-mail individual para cada inscrito ativo (com link de descadastro).

Sem cron semanal — você dispara quando o conteúdo estiver pronto. O fluxo previne envio duplicado e respeita a lista de e-mails suprimidos (bounces/unsubscribes).

## Como vai funcionar (passo a passo do usuário)

1. Em **Newsletter**, nova sub-aba **Campanhas** com botão **Nova campanha**.
2. Tela do compositor:
   - **Assunto** do e-mail
   - **Manchete** e **texto sobre o mercado** (editor simples, multilinha)
   - **Imóveis em destaque**: busca/seleção de até 6 imóveis publicados (foto, título, preço, link para a página do imóvel no site)
   - **Pré-visualização** do e-mail renderizado
   - Botões: **Salvar rascunho** / **Enviar para aprovação**
3. Ao enviar para aprovação:
   - Campanha fica com status **aguardando_aprovacao**
   - Admins recebem e-mail "Nova campanha aguardando aprovação" com link para a aba
4. Na lista de campanhas, admin/gestor vê botão **Aprovar e enviar**:
   - Confirma o número de destinatários ativos
   - Ao confirmar, o backend enfileira um envio individual por inscrito (idempotente)
   - Status passa para **enviando** → **enviada** com contagem de enviados/falhas
5. Cada e-mail traz rodapé padrão da Lovable Emails com link de **descadastrar** (one-click), atualizando `newsletter_subscribers.status = 'unsubscribed'`.

## O que vai existir no banco

- Tabela `newsletter_campanhas`: assunto, manchete, corpo_markdown, imoveis_ids[], status (rascunho | aguardando_aprovacao | aprovada | enviando | enviada | cancelada), agendada_para (nullable, para futuro), criada_por, aprovada_por, total_destinatarios, total_enviados, total_falhas.
- Tabela `newsletter_envios`: campanha_id, subscriber_id, email, status (pending | sent | failed | suppressed), error_message, sent_at. Único por (campanha_id, email) → evita duplicar.
- RLS: apenas admin/gestor podem ver/criar/aprovar; service role para o worker.

## Backend (edge functions)

- `newsletter-request-approval`: marca campanha como aguardando aprovação e envia e-mail para cada admin.
- `newsletter-send-campaign`: chamada quando admin aprova. Lê inscritos ativos, cria linhas em `newsletter_envios`, e enfileira no `send-transactional-email` um a um (idempotency key = `newsletter-<campanha_id>-<subscriber_id>`).
- Template novo `newsletter-weekly` em `_shared/transactional-email-templates/` com manchete, parágrafo de mercado e cards de imóveis. Hook de unsubscribe já existente cuida do descadastro.

## Considerações

- **Volume**: a infra envia ~120 e-mails/min. Para listas grandes o envio fica em fila e processa em background — a tela mostra progresso.
- **Reputação**: este fluxo é informativo solicitado pelo inscrito (opt-in via site), portanto se encaixa como app email permitido.
- **Sem agendamento automático agora**: posso adicionar depois um cron opcional (ex.: "toda terça 9h aprovar e enviar última campanha aprovada"). Fora do escopo deste plano.
- **Anexos**: e-mail não terá PDF/anexo; imóveis aparecem como cards com link para o site.

## O que NÃO muda

- Página pública de inscrição, página de unsubscribe, infra de e-mail (já configurada) e templates existentes (`new-lead-alert`, `user-welcome`, `immediate-contact-alert`).
