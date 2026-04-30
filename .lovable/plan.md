## Diagnóstico

Hoje a função `booking-confirm` cria SEMPRE um registro em `reunioes`, mesmo quando o lead escolheu **ligação**. A aba `/calls` lê de uma tabela diferente (`ligacoes`), então as ligações marcadas pelo link nunca aparecem lá.

Tipos vindos do link (`booking_links.kind`): `videochamada`, `presencial`, `ligacao`, `whatsapp`.
Tabelas-alvo:
- `videochamada` e `presencial` → `reunioes` (já funciona, aparece na aba Reuniões/Agenda).
- `ligacao` → `ligacoes` (não está sendo gravado).
- `whatsapp` → não tem aba dedicada; fica registrado como interação no lead.

## Mudanças

### `supabase/functions/booking-confirm/index.ts`

Substituir o trecho que insere em `reunioes` por uma lógica que escolhe a tabela conforme `link.kind`:

- **`presencial` / `videochamada`** → mantém `INSERT INTO reunioes` (com `tipo` correto, `link.lead_id`, `criado_por_ia=true`).
- **`ligacao`** → `INSERT INTO ligacoes` com:
  ```ts
  {
    lead_id: link.lead_id,
    data: startIso,
    duracao_seg: 30 * 60, // 30 min default
    resultado: 'agendada',
    notas: `Ligação agendada via WhatsApp/Sofia para ${link.nome ?? 'lead'}`,
    corretor_id: <corretor_id do lead se houver>,
  }
  ```
  Salvar o id retornado em `booking_links.reuniao_id` (nome do campo continua, só guarda o id da entidade criada — vou comentar no código).
- **`whatsapp`** → não cria registro em nenhuma das duas; só marca o token como usado. Adiciona uma entrada em `interacoes` (`tipo='whatsapp'`, `agendado_para=startIso`, `descricao='Contato agendado via Sofia'`, `lead_id=link.lead_id`) para deixar trilha no lead.

A mensagem de confirmação no WhatsApp permanece igual (já usa `tipoLabel`).

### Sem mudanças no frontend
As abas Reuniões, Agenda, Ligações e Detalhe do lead já consultam suas tabelas — só precisam dos dados certos lá.

### Deploy
Redeployar `booking-confirm`.

## Fora de escopo
- Não mexo no fluxo do webhook (geração do link já está OK).
- Não crio aba nova para "WhatsApp agendado".
