## Objetivo

Trocar a identidade e o fluxo da assistente de WhatsApp de **Helena (Helena/HR Imóveis genérica)** para **Sofia (HR Imóveis alto padrão, Sinop-MT, corretor Hans Rodovalho)**, mantendo toda a infraestrutura técnica atual (Evolution API, transcrição de áudio, cascata de modelos, persistência no CRM).

## Escopo da mudança

Único arquivo afetado: `supabase/functions/whatsapp-webhook/index.ts`.

Não há mudanças em:
- Banco de dados / RLS
- Edge function `whatsapp-send`
- Frontend (CRM, conversas, etc.)
- Secrets (Evolution já configurada)

## O que muda no prompt

1. **Identidade**: Helena → Sofia, consultora da HR Imóveis (Sinop-MT, alto padrão, corretor Hans Rodovalho, 14 anos de experiência, faixa R$ 500k–R$ 15M).
2. **Tom**: sofisticado, consultivo, sem emojis, máx. 3 linhas por mensagem.
3. **Fluxo de captura**:
   - Passo 1: Nome completo
   - Passo 2: Telefone (novo — antes era "intenção")
   - Passo 3: Agendar visita com o Hans
4. **Regra forte anti-repetição**: nunca pedir nome/telefone se já estiverem no histórico ou no contexto do lead.
5. **Detalhes do imóvel**: só responder quando o cliente perguntar; nunca inventar; usar a ferramenta de consulta.
6. **Urgência** (mudança, herança, divórcio, prazo): marca como URGENTE e prioriza transferência ao Hans.

## O que muda nas tool calls

Mantenho as duas tools existentes mas ajusto semântica:

- **`update_lead_info`**: passa a aceitar `full_name` e, opcionalmente, `phone` (telefone informado em texto pelo lead) e `urgency` (`urgente` | `normal`). Remove `interest` do fluxo principal (Sofia não qualifica intenção — todos são compradores vindos de anúncio).
- **`request_broker`**: mantida; usada quando o lead aceita agendar visita com o Hans. `kind` continua `visita` | `videochamada` | `ligacao` | `agora`.
- **Nova tool `consultar_imoveis`**: busca no portfólio (tabela `imoveis`) por características que o lead perguntar (bairro, quartos, faixa de preço, etc.) e devolve resultados reais. Sem isso, a Sofia inventaria dados — o que o prompt proíbe explicitamente.

## Lógica adicional no código

- **Salvar telefone informado em texto**: se a tool `update_lead_info` retornar um `phone`, atualiza `leads.telefone` (mantém o telefone do WhatsApp como fallback, mas prioriza o que o lead digitou se for diferente — útil quando o WhatsApp é de terceiro).
- **Marcar urgência**: quando `urgency=urgente`, escreve em `leads.observacoes` e move `etapa_funil` para `Em Atendimento` imediatamente, e força `request_broker` com `kind=agora` na sequência.
- **Contexto enviado ao modelo**: incluir `nome`, `telefone` e flag `urgente?` para que a Sofia nunca repita perguntas.
- **Mensagem inicial fallback** (quando o modelo retorna vazio): trocar para o texto da Sofia.

## Implementação técnica

```text
supabase/functions/whatsapp-webhook/index.ts
├── AI_SYSTEM            → reescrito com prompt da Sofia
├── TOOLS                → update_lead_info (full_name, phone?, urgency?)
│                        → request_broker (mantida)
│                        → consultar_imoveis (filtros: bairro, quartos, preco_min, preco_max, tipo)
├── Processamento tools  → trata phone e urgency; chama supabase.from('imoveis')
├── Contexto do lead     → inclui telefone e flag de urgência
└── Fallback messages    → textos da Sofia
```

## Pontos de atenção

- A coluna `qualificacao` em `leads` deixa de receber "comprar/alugar" pelo fluxo da Sofia (todos são compradores). Não quebra nada — campo continua opcional.
- A tool `consultar_imoveis` precisa que a tabela `imoveis` tenha colunas mínimas (preço, bairro, quartos, suítes, área). Se algum filtro pedido não existir, a query simplesmente ignora e a Sofia responde "vou confirmar com o Hans".
- Após implementar, rodo um teste manual mandando mensagem real para confirmar tom e captura.

## Pergunta antes de implementar

Você quer que eu **adicione a tool `consultar_imoveis`** já consultando a tabela `imoveis` do CRM, ou prefere que nesta primeira versão a Sofia apenas responda "vou confirmar com o Hans" para qualquer pergunta técnica (mais simples, sem risco de mostrar imóvel errado)?
