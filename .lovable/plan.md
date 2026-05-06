## Problema

Quando o lead clica no link `/agendar/:token` **depois** de ter agendado, a página não exibe a confirmação com a data/hora. No domínio publicado (hrimoveis.com) a versão atual mostra apenas "Agendamento já confirmado" genérico — sem dia, horário ou tipo da reunião — o que dá a sensação de "página em branco" pra quem esperava ver o agendamento.

Causa raiz: `booking-info` retorna apenas `{ used: true, nome, kind, reuniao_id }` quando o link já foi usado. A página `AgendarPage` então renderiza um `Status` genérico, sem buscar a data/hora da reunião/ligação criada.

Confirmado no banco: o token `uwHQ4L8Lze66E27Qn30FRTE6_OVpRAw_` está com `used_at = 2026-05-06 15:09:53`, `reuniao_id` preenchido, `kind = presencial`.

## Mudanças

### 1) `supabase/functions/booking-info/index.ts`

Quando `link.used_at` existir, buscar o registro correspondente em `reunioes` (kind = `presencial` | `videochamada`) ou `ligacoes` (kind = `ligacao`) usando `link.reuniao_id` e devolver também o horário marcado:

```ts
if (link.used_at) {
  let datetime_iso: string | null = null;
  if (link.reuniao_id) {
    if (link.kind === "ligacao") {
      const { data } = await supabase.from("ligacoes")
        .select("data").eq("id", link.reuniao_id).maybeSingle();
      datetime_iso = data?.data ?? null;
    } else {
      const { data } = await supabase.from("reunioes")
        .select("agendada_para").eq("id", link.reuniao_id).maybeSingle();
      datetime_iso = data?.agendada_para ?? null;
    }
  }
  return Response(... { used: true, nome, kind, reuniao_id, datetime_iso });
}
```

### 2) `src/pages/AgendarPage.tsx`

- Adicionar `datetime_iso` na interface `InfoResponse`.
- Quando `info.used` e houver `datetime_iso`, renderizar o **mesmo bloco de sucesso** que aparece após a confirmação (ícone, "Tudo certo!", data/hora formatadas, badge do tipo, mensagem de WhatsApp), em vez do `Status` genérico de "já confirmado".
- Se não vier `datetime_iso` (caso raro, link antigo), manter o fallback atual.

### 3) Republish

A versão atualmente no ar em `hrimoveis.com` é mais antiga que o código no repo (estilo claro vs. tema escuro novo com logo HR). Após as alterações, publicar para atualizar o domínio personalizado.

## Resultado esperado

Lead clica no link após ter agendado → vê a tela de confirmação com:
- "Tudo certo!"
- "Sua reunião presencial com o Hans está marcada para quarta-feira, 13 de maio às 14:00"
- Badge do tipo (Presencial / Videochamada / Ligação)
- Aviso de WhatsApp

Mesmo comportamento no fluxo recém-confirmado (já funciona) e em re-acessos posteriores ao link.
