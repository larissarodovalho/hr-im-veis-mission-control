# Links Temporários de Imóveis — Documentação Técnica e Operacional

Módulo: Links temporários (Imóveis)
Última atualização: 17/08/2026 · Responsável técnico: equipe de produto CRM HR Imóveis
Fuso de referência de todos os horários: America/Cuiaba (UTC-4)

---

## 1. Visão geral

Permite ao corretor enviar uma seleção de imóveis para o cliente por um link público com
prazo de validade, sem expor a base de imóveis nem dados internos do CRM. Todo acesso e
todo feedback do cliente voltam para o CRM em métricas, notificações e tarefas.

Escopo: **somente venda**. Não há qualquer funcionalidade de locação.

### Diagrama do fluxo

```text
  Imóvel / Seleção de imóveis
            |
            v
  Geração do link  --------->  imovel_links_compartilhados (+ itens)
            |                        | token, prazo, conta, oportunidade
            v                        v
  Compartilhamento           imovel_link_auditoria (criação)
  WhatsApp | E-mail | Copiar | QR Code | Share nativo
            |
            v
  Abertura pelo cliente  ->  Edge Function imovel-link-publico
            |                 valida token/prazo, assina fotos, registra evento
            v
  imovel_link_eventos (abertura, visualizacao_imovel, feedback)
            |
            +--> notificar_link_evento  -> notificacoes (corretor)
            |                            -> tarefas (follow-up com prazo)
            v
  Conta e Oportunidade (histórico, oportunidade_imoveis)
            |
            v
  Relatórios -> aba "Links" (KPIs, CSV) e Central de links
```

---

## 2. Estrutura técnica

### Tabelas

| Tabela | Papel |
|---|---|
| `imovel_links_compartilhados` | Link: token, código de referência, prazo, início da validade, conta, oportunidade, corretor, status, contadores de acesso |
| `imovel_link_itens` | Imóveis do link e a configuração pública de cada item |
| `imovel_link_eventos` | Eventos: `abertura`, `visualizacao_imovel`, `gostei`, `rejeitou`, `solicitou_informacoes`, `solicitou_visita` |
| `imovel_link_auditoria` | Trilha de auditoria (criação, alteração, revogação, exclusão) — preservada mesmo após exclusão do link |
| `imovel_link_rate_limit` | Controle de rate limiting por token/IP |
| `imovel_apresentacao_config` | Configuração padrão de apresentação por imóvel (fotos públicas, exibir valor, nível de localização) |

### Funções e RPCs

`imovel_link_pode_ver`, `imovel_link_rate_ok`, `imovel_link_auditar`,
`imovel_link_log_criacao`, `imovel_link_marcar_apresentado`, `imovel_link_evento_comercial`,
`imovel_link_descricao_itens`, `imovel_link_valida_endereco`,
`imovel_links_expirados_sem_abertura`, `imovel_links_performance`,
`notificar_imovel_indisponivel`, `notificar_link_evento` (notificação + tarefa de follow-up).

### Edge Function

`supabase/functions/imovel-link-publico` — único ponto público. Responsável por:
validar token e prazo no servidor, montar o payload sem dados internos, assinar todas as
fotos em uma única chamada (com espelhamento sob demanda no bucket privado), registrar
eventos, aplicar rate limiting, detectar bots e restringir CORS aos domínios da HR.

### Bucket privado

`imovel-links-compartilhados` — cópia das fotos usadas nos links. Acesso somente por URL
assinada com TTL curto gerada pela Edge Function. O bucket público `imoveis` continua
servindo apenas o site permanente.

### Front-end

- Público: `src/pages/ImovelLinkPublico.tsx`, `src/components/imoveis/publico/AcoesClienteLink.tsx`,
  `src/lib/imovelLinkPublico.ts` (fetch com `cache: "no-store"`).
- CRM: `src/pages/imoveis/LinksCompartilhadosTab.tsx` (central), `CompartilharImovelDialog.tsx`,
  `CompartilharAcoes.tsx`, `LinkDetalhesDialog.tsx`, `LinkMetricasDialog.tsx`,
  `SelecaoImoveisAcoes.tsx`, `src/lib/imovelLinks.ts`.
- Relatórios: aba **Links** com KPIs agregados no servidor e exportação CSV.
- Notificações: sino no header, com atualização em tempo real.

### Rotas

- Pública: `/imovel/link/:token` (sem autenticação).
- CRM: `/crm/imoveis` → aba **Links temporários** (deep link interno autenticado por link/ID).

### RLS e matriz de permissões

| Ação | Corretor | Gestor | Admin | Marketing/Secretaria | Público (anon) |
|---|---|---|---|---|---|
| Criar link | sim (dos seus imóveis/contas) | sim | sim | não | não |
| Ver links | próprios | todos | todos | não | não |
| Revogar/renovar/substituir | próprios | todos | todos | não | não |
| Ver endereço completo no link | não | sim | sim | não | somente se autorizado no link |
| Ler payload público | — | — | — | — | via Edge Function, com token válido |
| Ler tabelas do módulo direto | via RLS por responsável | por RLS | por RLS | não | nenhuma |

Nenhuma tabela do módulo é legível por `anon`; o acesso público passa só pela Edge Function.

### Fluxo de expiração

1. O prazo é definido na criação (`validade_minutos`) e a contagem inicia **na criação** ou
   **no primeiro acesso** (`inicio_validade`).
2. Quando inicia no primeiro acesso, `validade_iniciada_em` é gravado na primeira abertura e
   `expira_em` é calculado a partir dele.
3. A validação é **sempre no servidor**: link expirado devolve página de expirado, sem nenhum
   dado do imóvel e sem fotos assinadas.
4. Imóvel vendido/indisponível é removido do payload mesmo em link ainda válido; se todos os
   imóveis saírem, o link deixa de exibir conteúdo.
5. Revogação é imediata e definitiva; a renovação gera um novo link e marca o anterior como
   substituído.

### Regras de auditoria

Toda criação, edição, renovação, revogação e exclusão grava linha em `imovel_link_auditoria`
com autor, data/hora em America/Cuiaba e descrição dos itens. A trilha sobrevive à exclusão
do link. Eventos de bots são marcados e excluídos das métricas, mas permanecem registrados.

### Variáveis de ambiente

Sem valores nesta documentação. A Edge Function usa `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` (apenas no servidor). O front usa somente as chaves públicas
do projeto (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`).
**Service role nunca é usada no front-end.**

---

## 3. Manual do corretor e do gestor

### Como gerar um link

1. **Imóveis** → abra o imóvel (ou use **Criar seleção** para vários) → **Compartilhar**.
2. Escolha **Conta** e, se houver, a **Oportunidade** — é isso que liga o link ao histórico
   comercial do cliente.
3. Escolha a **validade**: 30 minutos, 1 hora, 1h30, 2 horas, 6 horas, 24 horas, 3, 7, 15 ou
   30 dias, ou **Personalizado** (mínimo 15 minutos, máximo 30 dias).
   - 30 min a 2h: envio durante uma conversa ativa, quando o cliente vai olhar na hora.
   - 24h a 7 dias: cliente que vai analisar com a família.
   - 15 a 30 dias: acompanhamento longo, com poucos imóveis.
4. Escolha se a contagem começa **na criação** ou **no primeiro acesso** (recomendado quando
   o envio é fora do horário comercial).
5. Defina o que aparece: exibir valor, nível de localização (bairro e cidade, só cidade,
   oculto, ou endereço completo — este só para Admin/Gestor), botão de falar com o corretor
   e botão de agendar visita.

### Como criar uma seleção de imóveis

Em **Imóveis**, clique em **Criar seleção**, marque os imóveis, dê um título
(ex.: "Opções em Jardim das Américas") e siga o mesmo fluxo de compartilhamento. Um único
link mostra todos os imóveis escolhidos.

### Como enviar

- **WhatsApp**: botão pronto, com mensagem sugerida e o link.
- **Copiar**: cola em qualquer canal.
- **QR Code**: mostre a tela ou imprima para atendimento presencial.
- **Compartilhar** (share nativo do celular): envia por qualquer app instalado.

### Como saber se foi aberto e interpretar os acessos

- O corretor recebe notificação no sino do CRM na **primeira abertura**.
- Na central **Links temporários**: status do link, primeiro e último acesso, total de
  acessos, visitantes únicos e dispositivo.
- **Detalhes** mostra a ficha completa; **Métricas** mostra imóvel por imóvel.
- Muitos acessos e nenhum feedback: cliente interessado mas indeciso — vale ligar.
  Nenhum acesso perto do fim do prazo: reenviar por outro canal.

### Como acompanhar o feedback

O cliente tem quatro botões na página. Cada um gera notificação e, nos casos de intenção,
uma tarefa automática já vinculada à conta e à oportunidade:

| Ação do cliente | Tarefa criada | Prazo | Prioridade |
|---|---|---|---|
| Gostei | Retornar contato | +1 dia | Média |
| Quero mais informações | Enviar informações | +6h | Alta |
| Quero agendar uma visita | Agendar visita | +4h | Alta |
| Não tenho interesse | — (só notificação) | — | — |

O mesmo pedido repetido em até 48h não gera tarefa duplicada.

### Como revogar e como gerar um novo link

Na central, o botão **Revogar** derruba o acesso na hora. **Substituir** cria um novo link
(com novos imóveis ou novo prazo) e mantém o anterior no histórico como substituído.

### Limitações de identidade

O link não exige login. Se o cliente encaminhar, os acessos do terceiro entram nas métricas
como outro visitante, sem identificação. Por isso: prazos curtos e valor/endereço liberados
apenas quando fizer sentido.

### Link temporário x anúncio permanente do site

| | Link temporário | Anúncio do site |
|---|---|---|
| Objetivo | atendimento individual | captação aberta |
| Duração | expira | permanente |
| Fotos | URL assinada, temporária | URL pública |
| Métricas | por cliente, por link | tráfego geral do site |
| Endereço/valor | configuráveis por link | conforme o cadastro público |

---

## 4. Troubleshooting

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Link expirado" | prazo encerrado ou revogado | gerar novo link em **Substituir**; usar prazo maior ou contagem a partir do primeiro acesso |
| "Link inválido" / token inválido | link truncado no envio, ou link excluído | reenviar o link copiado direto do CRM (não digitar à mão) |
| Imóvel sumiu do link | imóvel marcado como vendido/indisponível | é o comportamento esperado; substituir o item por outro imóvel |
| Foto não aparece | foto ainda não espelhada no bucket privado | recarregar a página (o espelhamento é feito sob demanda); se persistir, reenviar a foto no cadastro do imóvel |
| WhatsApp não abre | app não instalado ou bloqueio do navegador | usar **Copiar** e colar na conversa |
| QR Code não lê | tela com brilho baixo ou impressão pequena | aumentar o brilho/tamanho ou enviar o link por WhatsApp |
| Abertura não registrada | acesso identificado como robô (pré-visualização de app) ou rate limiting | conferir em Métricas; acessos de bots são registrados mas não contam nas métricas |
| "Sem permissão" no CRM | perfil sem acesso ao módulo ou link de outro corretor | pedir ao gestor; corretor só enxerga os próprios links |

---

## 5. Backfill de fotos e rollback

**Backfill**: as fotos são espelhadas no bucket privado na criação do link e, se faltar
alguma, novamente sob demanda na primeira requisição pública. Para forçar o espelhamento de
uma carteira inteira, basta abrir os links (ou recriá-los) — a Edge Function copia o que
faltar. Não há necessidade de script manual.

**Rollback do módulo**: revogar os links ativos pela central (ação em massa por filtro),
o que derruba todo o acesso público imediatamente. As tabelas e a auditoria permanecem para
consulta; a Edge Function pode ser desativada sem impacto no site permanente, que usa outro
bucket e outras rotas.

---

## 6. Documentos relacionados

- `docs/FLUXO-IMOVEIS.md` — fluxo completo do módulo Imóveis.
- `docs/SEGURANCA-LINKS-TEMPORARIOS.md` — auditoria de segurança e privacidade.
