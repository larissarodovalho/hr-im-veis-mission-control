# Links Temporários de Imóveis — Manual de Operação (Etapa 18)

Documento final de entrega do módulo de links temporários do CRM HR Imóveis.

## 1. Para que serve

Permite ao corretor enviar uma seleção de imóveis para o cliente através de um link
público com prazo de validade, sem expor a base de imóveis nem os dados internos do CRM.
Todo acesso e todo feedback do cliente voltam para o CRM em forma de métricas,
notificações e tarefas.

## 2. Fluxo do corretor

1. **Imóveis → Criar seleção**: escolhe os imóveis, o cliente (conta) e a oportunidade.
2. Define **prazo de validade** (24h, 48h, 7 dias ou personalizado) e as opções de
   exibição por imóvel (mostrar valor, nível de localização: bairro/cidade ou endereço).
3. **Compartilhar**: WhatsApp, e-mail, cópia do link ou QR Code.
4. Acompanha tudo em **Imóveis → Links temporários** (central de links).

A contagem do prazo só começa **na primeira abertura** do link (`validade_iniciada_em`),
para que um link enviado à noite não expire antes de o cliente ver.

## 3. O que o cliente vê

Página pública, sem login, responsiva (validada em 390px, 768px e 1280px):

- Fotos por URL assinada e temporária (bucket privado — nunca URL pública permanente).
- Título, características, valor (se liberado) e localização no nível configurado.
- Botões de feedback: **Gostei**, **Não tenho interesse**, **Quero mais informações**,
  **Quero agendar uma visita**.

Imóveis vendidos ou indisponíveis somem do link automaticamente, mesmo em link já enviado.

## 4. Retorno automático no CRM

| Evento do cliente | Notificação ao corretor | Tarefa criada | Prazo |
|---|---|---|---|
| Primeiro acesso | sim (uma vez) | — | — |
| Gostei | sim | Retornar contato | +1 dia (Média) |
| Quero mais informações | sim | Enviar informações | +6h (Alta) |
| Quero agendar uma visita | sim | Agendar visita | +4h (Alta) |
| Não tenho interesse | sim | — | — |

As tarefas nascem vinculadas à conta e à oportunidade do link e aparecem nos mesmos
lugares das demais tarefas (Tarefas, card da conta, oportunidade), com a tag de contagem
regressiva. Não há duplicação: o mesmo pedido repetido em 48h não gera segunda tarefa.

## 5. Central de links (Imóveis → Links temporários)

- KPIs: links ativos, aberturas, visitantes únicos, pedidos de visita.
- Filtros: status, corretor, tipo, período, abertos/não abertos, dispositivo, resultado.
- Ações por link: Detalhes, Métricas, Compartilhar, Copiar, Substituir imóveis, Revogar,
  Renovar prazo.

## 6. Relatórios → Links

Visão agregada por período e corretor: envios, taxa de abertura, tempo até a primeira
abertura, imóveis mais vistos, feedbacks e conversão em visita. Exportação em CSV.

## 7. Segurança (resumo)

- Token de 32 bytes, indexado e revogável; expiração validada **no servidor**.
- Fotos apenas por URL assinada com TTL curto; espelhamento sob demanda no bucket privado.
- Rate limiting por token/IP e detecção de bots (excluídos das métricas).
- CORS restrito aos domínios da HR Imóveis; resposta com `cache: no-store`.
- Endereço completo visível apenas para Admin/Gestor no CRM.
- Auditoria completa (`imovel_link_auditoria`) preservada mesmo após exclusão do link.

Detalhamento técnico: `docs/SEGURANCA-LINKS-TEMPORARIOS.md`.

## 8. Mapa técnico

- Tabelas: `imovel_links_compartilhados`, `imovel_link_itens`, `imovel_link_eventos`,
  `imovel_link_auditoria`, `imovel_link_rate_limit`, `imovel_apresentacao_config`.
- Edge Function pública: `supabase/functions/imovel-link-publico` (payload, eventos,
  assinatura das fotos em lote).
- Front público: `src/pages/ImovelLinkPublico.tsx` + `src/lib/imovelLinkPublico.ts`.
- CRM: `src/components/imoveis/LinksCompartilhadosTab.tsx`, diálogos de criação,
  métricas e compartilhamento; sino de notificações no header.
- Automação: trigger `notificar_link_evento` (notificação + tarefa de follow-up).
