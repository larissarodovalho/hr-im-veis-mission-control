# Auditoria final — Links temporários de imóveis

Data: 17/08/2026 (America/Cuiaba). Escopo: auditoria de ponta a ponta, sem novas funcionalidades.

## Matriz PASS/FAIL

| # | Requisito | Status | Evidência |
|---|-----------|--------|-----------|
| 1 | Prazos 30 min, 1h, 1h30, 2h e personalizado | PASS | `src/lib/imovelLinks.ts` (`VALIDADES`, `VALIDADE_MIN=15`, `VALIDADE_MAX=43200`), `CompartilharImovelDialog.tsx` |
| 2 | Expiração no servidor | PASS | `supabase/functions/imovel-link-publico/index.ts` — cálculo de `expira_em` e retorno `status: "expirado"` antes de qualquer conteúdo |
| 3 | Página expirada sem conteúdo | PASS | payload de expirado traz só `codigo_referencia` e `expira_em`; `LinkImovelPublico.tsx` renderiza estado bloqueado |
| 4 | Fotos privadas assinadas | PASS | bucket privado `imoveis-compartilhados`, `createSignedUrls` com TTL = min(1h, tempo restante); sem fallback para URL pública |
| 5 | Abertura registrada | PASS | insert em `imovel_link_eventos` (`tipo_evento='abertura'`) |
| 6 | Primeiro e último acesso | PASS | update de `primeiro_acesso_em` / `ultimo_acesso_em` |
| 7 | Visitantes únicos | PASS | `visitor_id_hash` (SHA-256 do token+semente) e contador `visitantes_unicos` |
| 8 | Dispositivo | PASS | `parseUA` grava dispositivo, navegador e SO |
| 9 | Responsividade | PASS | validado via Playwright em 390px e 1280px (etapas 17 e 18), sem overflow horizontal |
| 10 | Botão no card e no detalhe | PASS | `src/pages/Imoveis.tsx:658,668`; também em `ContaFluxoAtendimento.tsx` |
| 11 | WhatsApp, copiar, share nativo, QR Code | PASS | `src/components/imoveis/CompartilharAcoes.tsx` |
| 12 | Deep link interno autenticado | PASS | rota pública `/l/:token` (`src/App.tsx:75`) + acesso interno pela Central de Links |
| 13 | Conta e Oportunidade | PASS | `conta_id` / `oportunidade_id` em `imovel_links_compartilhados`, evento comercial via `imovel_link_evento_comercial` |
| 14 | Histórico da Conta e do imóvel | PASS | `imovel_link_log_criacao`, `ImovelHistoricoDrawer.tsx`, `ContaImoveisVinculados.tsx` |
| 15 | `oportunidade_imoveis` sem duplicidade | PASS | índice único `(oportunidade_id, imovel_id)` |
| 16 | Seleção com vários imóveis | PASS | `imovel_link_itens` + `SelecaoImoveisAcoes.tsx` |
| 17 | Feedback e pedido de visita | PASS | eventos `gostei`, `rejeitou`, `solicitou_informacoes`, `solicitou_visita` com idempotência por visitante |
| 18 | Central de links compartilhados | PASS | `src/pages/imoveis/LinksCompartilhadosTab.tsx` |
| 19 | Notificações | PASS | trigger `notificar_link_evento` (notificação + tarefa de follow-up) e `notificar_imovel_indisponivel` |
| 20 | Relatório | PASS | `src/components/reports/LinksImoveisReport.tsx` + RPC `imovel_links_performance` |
| 21 | Papéis e RLS | PASS | RLS ativa nas 6 tabelas do módulo; `imovel_link_rate_limit` sem policies (apenas service role) |
| 22 | Auditoria | PASS | `imovel_link_auditoria` + função `imovel_link_auditar` |
| 23 | America/Cuiaba | PASS | telas usam `fmtDateTime` de `src/lib/datetime.ts`; nenhum `toLocaleString` de data sem fuso |
| 24 | Nenhuma funcionalidade de locação | PASS | nenhuma ocorrência de locação/aluguel nos arquivos do módulo |
| 25 | Sem vazamento de dados sensíveis | PASS | select do endpoint é explícito e não inclui proprietário, matrícula, documentos, comissão, observações internas nem dados de cliente; endereço limitado a bairro/cidade ou oculto |
| 26 | Site público permanente preservado | PASS | rotas e componentes do site não foram alterados |
| 27 | Regra de proposta/fechamento preservada | PASS | fluxo agendada → visita → proposta intacto em `OportunidadeDetailDialog.tsx` |
| 28 | Imóvel vendido bloqueia o link | PASS | filtro `status startsWith "dispon"`; sem itens visíveis retorna `status: "indisponivel"` |
| 29 | Sem service_role no frontend | PASS | `rg service_role src` → nenhuma ocorrência |
| 30 | Lint, typecheck, build | PASS com ressalva | typecheck 0 erros; build OK (27s); lint só acusa `@typescript-eslint/no-explicit-any`, padrão pré-existente em todo o projeto (1050 ocorrências) |

## Testes executados
- `tsgo --noEmit`: 0 erros.
- `npm run build`: sucesso.
- `POST /functions/v1/imovel-link-publico` com token inexistente → HTTP 404 `{"status":"invalido"}`.
- Consultas de catálogo: RLS e índices confirmados no banco.
- Playwright (etapas 17/18): página pública e Central de Links em 390px e 1280px.

## Vulnerabilidades encontradas e corrigidas nas etapas anteriores
- Fotos servidas por URL pública permanente → substituídas por bucket privado com URL assinada e TTL limitado ao link.
- CORS aberto → restrito a localhost, `*.lovable.app` e `hrimoveis.com`.
- Ausência de rate limit → 60 req/min por visitante e 240 req/min por token.
- Prévias de crawlers consumindo validade → detecção de bot, sem iniciar validade nem contar métrica.
- Cache de payload → `Cache-Control: no-store`.

## Pendências reais
- Lint global com `any` (débito técnico anterior ao módulo, sem impacto funcional).
- Bundle único acima de 500 kB (aviso do Vite, geral do projeto).

## Decisão final
Pronto para produção. Nenhum requisito crítico em FAIL.
