## Objetivo

Restringir **todas as exclusões** do sistema apenas ao papel `admin`. Hoje o `gestor` também consegue excluir em quase todas as tabelas — isso será removido.

Corretor e gestor continuam podendo criar e editar normalmente; apenas a ação de excluir (DELETE) passa a ser exclusiva do admin.

## Mudanças no banco (RLS)

Substituir as policies de DELETE nas tabelas abaixo, trocando `has_role(uid,'admin') OR has_role(uid,'gestor')` (e variações com autor/owner) por **apenas** `has_role(auth.uid(), 'admin')`:

- `agenda_bloqueios`
- `agentes`
- `campanhas_metrics_daily`
- `campanhas_trafego`
- `conta_propriedades`
- `contas`
- `contatos`
- `conteudo_posts`
- `document_events`, `document_signers`, `signed_documents` (hoje usam `is_admin()` que inclui gestor — trocar para `has_role(uid,'admin')`)
- `imoveis`
- `interacoes`
- `leads`
- `ligacoes`
- `notas`
- `propostas`
- `reunioes`

A função `public.is_admin()` será mantida intacta (é usada em SELECT/UPDATE de várias policies; mexer nela teria efeito colateral). As policies de DELETE deixam de chamá-la e passam a usar `has_role` diretamente.

Tabelas que já são admin-only ou irrelevantes (`activity_log` sem DELETE, `email_*` só service_role, `profiles`/`lead_historico`/`newsletter_subscribers` sem DELETE) ficam como estão.

## Mudanças no frontend

Esconder/desabilitar botões de excluir para quem não é admin, evitando que o usuário clique e tome erro de RLS:

- `UsuariosAdminPage` — já é admin-only (página inteira), sem mudança.
- Telas/componentes que oferecem exclusão e hoje aparecem para gestor: ocultar o botão quando `!isAdmin`. Lista preliminar a confirmar durante a implementação:
  - `Leads` / `LeadDetail`
  - `Accounts` / `AccountDetail` (incluindo `ContaInteracoesTimeline`, `ContaAgendaQuickAdd`)
  - `Imoveis`
  - `Documents` / `DocumentDetail`
  - `Calls`, `Meetings`, `Visits`, `Schedule`, `AgendarPage`
  - `Conteudo`, `TrafegoPago`, `RedesSociais`, `Marketing`
  - `Newsletter`
  - Componentes de timeline/notas

Padrão: `{isAdmin && <Button …>Excluir</Button>}` usando `useAuth()` / `useRole()`.

## Fora de escopo

- Não cria novos papéis nem altera o enum `app_role`.
- Não muda lógica de SELECT/UPDATE: gestor continua vendo tudo e editando.
- Não toca em edge functions (admin-create-user já valida admin internamente).
