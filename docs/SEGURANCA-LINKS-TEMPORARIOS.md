# Links temporários de imóveis — Auditoria de segurança (Etapa 16)

Data: 17/08/2026 (America/Cuiaba) · Responsável técnico: equipe CRM HR Imóveis

## 1. Matriz de permissões (RLS)

| Papel | Links | Itens/Eventos | Auditoria | Config. pública | Endereço completo |
|---|---|---|---|---|---|
| admin | todos (ler, revogar, excluir) | todos | leitura | sim | autoriza |
| gestor | todos (ler, revogar) | todos | leitura | sim | autoriza |
| marketing | todos (leitura/relatórios) | todos | não | sim | não |
| corretor | apenas os próprios | apenas dos próprios links | não | sim | não |
| secretaria | sem acesso | sem acesso | não | não | não |
| anon | nenhum acesso direto | nenhum | não | não | não |

O escopo é aplicado pela função `imovel_link_pode_ver(link_id)` usada nas policies de
`imovel_link_itens` e `imovel_link_eventos`; a leitura da auditoria ficou restrita a admin/gestor.

## 2. Vulnerabilidades encontradas e corrigidas

| # | Problema | Correção |
|---|---|---|
| 1 | Fotos caíam em URL pública permanente quando o espelhamento falhava | Removido o fallback: só URL assinada do bucket privado; espelhamento sob demanda no servidor |
| 2 | URL assinada podia durar mais que o link (1h fixa) | TTL passa a ser `min(1h, tempo restante do link)` |
| 3 | CORS aberto (`*`) | Restrito a localhost, `*.lovable.app` e `hrimoveis.com` |
| 4 | Sem `Cache-Control` | `no-store, no-cache, must-revalidate, private` em todas as respostas + `cache: "no-store"` no fetch |
| 5 | Sem rate limit | 60 req/min por visitante e 240 req/min por token (`imovel_link_rate_ok`, tabela sem acesso público) |
| 6 | Prévias do WhatsApp/crawlers contavam como acesso e iniciavam a validade | Detecção de bot: evento marcado `metadata.bot=true`, sem contagem e sem iniciar a contagem regressiva |
| 7 | Imóvel vendido/indisponível continuava no payload | Itens fora de "Disponível" são removidos; sem itens, o link responde `indisponivel` |
| 8 | Eventos/itens visíveis a qualquer staff | Escopo por papel/dono via `imovel_link_pode_ver` |
| 9 | Secretaria podia alterar a apresentação pública | Policy restrita a admin/gestor/marketing/corretor |
| 10 | Sem auditoria de revogação, substituição, compartilhamento, config e exclusão | Trigger `imovel_link_auditar` cobre todo o ciclo de vida |
| 11 | Auditoria sumia junto com o link excluído | FK em cascata removida — auditoria preservada |
| 12 | Endereço completo sem controle | Só admin/gestor podem definir `endereco_completo` (trigger no banco + opção condicional na interface) |

## 3. Verificações aprovadas (testes negativos executados)

- anon lendo `imovel_links_compartilhados` e `imovel_link_eventos` via API: retorno vazio (RLS).
- anon inserindo evento direto na tabela: `42501 row-level security`.
- token inexistente: `404 {"status":"invalido"}`, sem qualquer dado.
- 70 chamadas seguidas: bloqueio a partir da 61ª com `429`.
- origem não permitida: `Access-Control-Allow-Origin: null`.
- link expirado: resposta `expirado` sem conteúdo, inclusive para eventos.
- relógio do cliente: a expiração é recalculada no servidor a partir de `validade_iniciada_em`; alterar o horário do dispositivo não prolonga nada.
- payload público conferido: sem proprietário, matrícula, documentos, comissão, preço interno, margem, observações internas, dados da conta ou IDs internos de imóvel.
- token: 32 bytes de CSPRNG em base64url (não sequencial, não previsível) e nunca gravado em auditoria, logs ou métricas — a auditoria usa apenas o código de referência.
- navegador: nada do conteúdo é gravado em localStorage/IndexedDB; só um UUID anônimo de visitante/sessão.

## 4. Pendências conhecidas (baixo risco)

- O `item_id` (UUID aleatório do item do link) é enviado ao cliente porque é necessário para registrar feedback por imóvel; não identifica o imóvel nem permite consulta.
- Imóvel em proposta/fechamento continua visível no link, conforme a regra atual do CRM: só a venda confirmada bloqueia.
