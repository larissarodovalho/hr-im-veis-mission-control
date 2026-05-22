## Atualização do prompt da Sofia

### O que muda

**1. Novo system prompt da Sofia** em `supabase/functions/whatsapp-webhook/index.ts` (linhas 45–96)
- Substituo o texto atual pela nova versão completa que você colou: identidade HR Imóveis (urbano), tom, fluxo de qualificação, regras anti-alucinação, lista hardcoded de 12 imóveis em destaque, scripts de handoff, exemplos.
- Mantenho a regra de saudação atual (só na primeira mensagem da conversa) e atualizo o texto da saudação inicial para a versão nova da Sofia.

**2. Manter tool calls (opção A)**
- Continuo usando as tools existentes: `update_lead_info`, `send_booking_link`, `request_immediate_contact`.
- Adapto o novo prompt para instruir a Sofia a chamar essas tools nos mesmos pontos do fluxo (ao captar nome/interesse/região, ao oferecer agendamento, em emergências).
- Os blocos `[LEAD_DADOS]` e `[LINK_DE_AGENDAMENTO]` do texto que você mandou **não** vão pro modelo — substituo pela instrução equivalente via tool. Se o modelo emitir esses blocos por engano, sanitizo a resposta antes de enviar pro WhatsApp (regex que remove `[...]` markers do texto final).

**3. Expansão de enums com compatibilidade**
- `interesse` na tool `update_lead_info`: adiciono `alto_padrao`, `parceria`, `propriedade`, `outro`. Mantenho aceitos os valores antigos (`compra`, `venda`, `aluguel`, `incorporacao`, `investimento_ocasiao`).
- `kind` em `send_booking_link` e em `booking-confirm`/`booking-info`: aceito `reuniao` como sinônimo de `presencial` (normalizo para `presencial` antes de gravar no banco, pra não quebrar dados/RLS/UI existentes). Os valores `presencial`, `videochamada`, `ligacao` continuam funcionando.
- Sem migração de banco — a coluna `interesse` em `leads` é texto livre; só amplio os valores aceitos na tool e na validação da função.

**4. Lista de imóveis em destaque — hardcoded**
- Os 12 imóveis (HR-0023, HR-0017, etc.) ficam embutidos no prompt como bloco `[IMOVEIS_EM_DESTAQUE]`. Quando quiser atualizar, é editar o arquivo.

### O que NÃO muda

- Schema do banco (nenhuma migração).
- `booking-confirm` / `booking-info` continuam funcionando com os mesmos kinds (só ganham apelido `reuniao` → `presencial`).
- UI do CRM, agenda, reuniões, ligações — tudo intacto.
- Fluxo de handoff humano e rede de segurança da saudação inicial.

### Arquivos tocados

- `supabase/functions/whatsapp-webhook/index.ts` — novo system prompt, expansão dos enums das tools, normalização `reuniao` → `presencial`, sanitização de blocos `[...]` residuais.
- `supabase/functions/booking-confirm/index.ts` — aceitar `reuniao` no `kindReq` (normalizar para `presencial`).
- `supabase/functions/booking-info/index.ts` — aceitar `reuniao` no `kindOverride` (normalizar para `presencial`).

Confirma que pode seguir?
