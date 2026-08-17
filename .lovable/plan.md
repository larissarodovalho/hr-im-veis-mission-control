# Etapa 0 — Auditoria técnica (somente leitura) para "Links temporários dos imóveis"

Nenhum arquivo do projeto foi alterado. Abaixo o mapa real do sistema, verificado no código e no banco, e a ordem recomendada de implementação. Conforme sua resposta, a Etapa 1 (remover Locação/Temporada e tipos rurais) fica **fora do escopo** — as opções atuais de finalidade e tipo permanecem como estão.

## 1. Arquitetura confirmada

- React 18 + Vite + TypeScript, Tailwind + shadcn/ui, roteador `react-router-dom` v6 (rotas em `src/App.tsx`), estado de servidor com `@tanstack/react-query` (mas o módulo Imóveis usa `useState` + chamadas diretas ao cliente).
- Cliente único em `src/integrations/supabase/client.ts`; papéis resolvidos por `AuthContext` (`isAdmin`, `isGestor`, `isMarketing`) e no banco por `has_role`/`is_staff`/`is_admin` com enum `app_role` (admin, gestor, corretor, marketing, secretaria).
- Scripts reais: `dev`, `build`, `build:dev`, `lint` (eslint), `test` (vitest). **Não existe script de typecheck**; a verificação de tipos sai do build.
- Edge Functions: 39 funções em `supabase/functions`, com `verify_jwt = false` declarado em `supabase/config.toml` para endpoints públicos.

## 2. Módulo Imóveis (arquivos que serão tocados)

- `src/pages/Imoveis.tsx` — 7 abas derivadas de `imoveis` + `propostas`; status permanece "Disponível" durante proposta/fechamento (regra preservada).
- `src/components/imoveis/` — `NovoImovelDialog`, `EditarImovelDialog`, `DetalhesImovelDialog`, `ImovelHistoricoDrawer`, `NovaPropostaDialog`, `NovaVendaDialog`, `ImovelDocumentosTab`.
- `src/lib/uploadFotoImovel.ts` — hoje grava 2 versões com o mesmo path: original no bucket privado `imoveis-originais` e versão com marca d'água no bucket público `imoveis`.
- `src/lib/watermark.ts` — marca d'água em canvas, `maxDimension` 2400, qualidade 0.9.
- Site público: `src/pages/site/ImoveisPage.tsx` e `ImovelDetalhePage.tsx`, alimentados pela view `imoveis_public` (única view do schema public).

## 3. Banco e storage hoje

- Tabelas relevantes existentes: `imoveis` (39 colunas), `imovel_documentos`, `captacoes_imovel`, `propostas`, `vendas`, `oportunidades`, `oportunidade_imoveis`, `interacoes`, `tarefas`, `visitas`, `activity_log`, `contas`, `corretores_parceiros`.
- RLS de `imoveis`: leitura anônima só de disponíveis, staff lê tudo, insert por staff, update por dono/admin/gestor, delete só admin.
- Buckets: `imoveis` (público), `imoveis-originais`, `imoveis-docs`, `propostas`, `contratos-vendas`, `signed-documents` (todos privados), `site-assets` (público).
- **Não existe** nenhuma tabela, função, view ou componente de links compartilháveis, tokens de imóvel, seleções de imóveis ou rastreamento de abertura.

## 4. Precedente reaproveitável e colisões de rota

- Já existe um padrão de link público por token: `booking_links` + rota `/agendar/:token` + Edge Functions `booking-info` / `booking-confirm` (`verify_jwt = false`, validação de formato do token, service role só no servidor). Esse é o modelo a seguir para os links temporários.
- Rotas públicas ocupadas: `/`, `/imoveis`, `/imovel/:id`, `/sobre`, `/contato`, `/agendar/:token`, `/captura`, `/unsubscribe`, `/site/*`, `/landing`, `/app/*`, `/crm/*`.
- Para evitar colisão com a página permanente `/imovel/:id`, os links temporários devem usar prefixo próprio — sugestão `/l/:token` (imóvel único e seleção) e `/crm/imoveis/links` para a central interna.

## 5. Riscos identificados

- O bucket `imoveis` é público: qualquer URL de foto continua acessível após a expiração do link. Por isso a Etapa 3 (bucket privado `imoveis-compartilhados` + URLs assinadas) é pré-requisito real da página pública.
- Acesso anônimo às novas tabelas deve passar **somente** por Edge Function com service role; nenhuma policy `anon` direta.
- `booking-info` usa offset fixo de São Paulo (UTC-3); o novo fluxo deve usar `America/Cuiaba` via `src/lib/datetime.ts`, sem copiar esse trecho.
- Sem script de typecheck: validar com `npm run build` além de lint e vitest.

## 6. Ordem recomendada de implementação

1. Modelo de dados (Etapa 2): `imovel_apresentacao_config`, `imovel_links_compartilhados`, `imovel_link_itens`, `imovel_link_eventos`, `imovel_link_auditoria`, índices e view de status calculado, com RLS só para staff.
2. Bucket privado `imoveis-compartilhados` e sincronização das fotos com marca d'água (Etapa 3).
3. Edge Functions de criação/resolução/revogação/eventos com service role (Etapa 4).
4. Botão "Compartilhar" e diálogo de geração no card do imóvel (Etapa 5) e link interno da equipe (Etapa 6).
5. Página pública `/l/:token` de imóvel único (Etapa 7) + rastreamento (Etapa 8) + WhatsApp/copiar/QR (Etapa 9).
6. Integração com Contas/Oportunidades e histórico (Etapa 10), seleção multi-imóvel (Etapa 11), feedback e pedido de visita (Etapa 12).
7. Central "Links compartilhados" (Etapa 13), notificações (Etapa 14), relatório de performance (Etapa 15).
8. Endurecimento de RLS/privacidade/auditoria (Etapa 16), testes e homologação (Etapa 17), documentação (Etapa 18).

Sem novas dependências obrigatórias, exceto uma biblioteca de QR Code na Etapa 9 (ou geração via canvas, a decidir naquela etapa).

## 7. Próximo passo

Aprovar esta auditoria para eu seguir com a **Etapa 2 (modelo de dados)** na próxima mensagem.
