## Plano — Sofia coleta apenas Nome + Interesse

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

O número do WhatsApp já é capturado automaticamente pelo CRM, então o Passo 2 (celular) é redundante.

### Mudanças no prompt `AI_SYSTEM`
- **OBJETIVO:** trocar "coletar 3 dados — nome completo, celular e tipo de interesse" por "coletar 2 dados — nome completo e tipo de interesse". Adicionar: "O número de WhatsApp é registrado automaticamente pelo CRM, então NÃO pergunte celular."
- **FLUXO:** remover Passo 2 (Celular). Renumerar:
  - Passo 1 — Nome completo (igual)
  - Passo 2 — Tipo de interesse (antigo Passo 3)
  - Passo 3 — Handoff (antigo Passo 4)
- **REGRAS DE ORDEM OBRIGATÓRIA:** atualizar para "Passo 1 (nome) → Passo 2 (interesse) → Passo 3 (handoff)". Trocar "logo após receber o nome completo, a PRÓXIMA pergunta é SEMPRE sobre o celular" por "logo após receber o nome completo, a PRÓXIMA pergunta é SEMPRE sobre o tipo de interesse".

### Mudança na tool `update_lead_info`
- Remover a propriedade `phone` do schema e atualizar a description para "Salva nome completo e/ou intenção do lead."

Mudança apenas no prompt e schema da tool — sem alterar lógica do webhook, handlers ou banco.
