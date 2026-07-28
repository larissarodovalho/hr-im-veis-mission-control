## Contexto
Ao converter um lead em conta, o registro já é criado com `tags: ['marketing']` e `etapa_funil` cai no default `a_contatar` — portanto a conta aparece no funil de Marketing, coluna "A contatar". Porém hoje a navegação leva direto à página de detalhe da conta, dando a impressão de que ela não entrou no funil.

## Mudanças

**`src/pages/LeadDetail.tsx`** (função `doConvert`)
- Definir explicitamente `etapa_funil: 'a_contatar'` no insert de `contas` (garante entrada no funil mesmo se o default do banco mudar).
- Após conversão, redirecionar para `/crm/contas?lista=marketing` (em vez de `/crm/contas/:id`), para o corretor ver o card já posicionado no Kanban de Marketing. Toast continua confirmando "Lead convertido em conta!".

Nenhuma alteração de schema — contas convertidas antigas já foram reclassificadas para a tag `marketing` no backfill anterior.