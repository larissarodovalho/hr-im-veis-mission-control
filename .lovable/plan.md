# Funil da aba Contas (Carteira e Marketing) — REESTRUTURA IMPLEMENTADA

## Status: concluído

Os dois funis (Carteira e Marketing) usam o mesmo modelo de 5 etapas, separados pela **categoria** da conta (`contas.categoria`: `carteira` | `marketing`, com fallback para tags).

## As 5 colunas ativas (ordem fixa)

```text
1. A contatar
2. Contatado
3. Sem retorno
4. Contato estabelecido
5. Contato cancelado
```

## Regras operacionais implementadas

- **A contatar**: ações de 1º e 2º contato (WhatsApp, ligação, e-mail) com resultado (sem resposta / respondeu / contato inválido). Sem resposta na 2ª tentativa → Sem retorno.
- **Contatado**: agendar tarefa de retorno, enviar link de imóvel, avançar para Contato estabelecido.
- **Sem retorno**: novas tentativas; resposta → Contatado; cancelamento exige motivo.
- **Contato estabelecido**: seleção de **Destino comercial** (não é coluna do funil): Captação/Reunião, Comprar — Oportunidade, Vender — HRX Produções, Oportunidade futura. Gravado em `contas.destino_comercial` + interação.
- **Contato cancelado**: motivo obrigatório (`contas.motivo_cancelamento`, `cancelado_em`, `cancelado_por`) via ContaCancelarDialog; reativação limpa os campos.

## Categoria

- Coluna `contas.categoria` é a fonte principal; tags `carteira`/`marketing` mantidas em sincronia.
- `categoriaDe()` prioriza a coluna e cai para tags em registros antigos (src/lib/contasFunil.ts).
- Transferência Carteira ↔ Marketing exige motivo (AlterarCategoriaDialog), registra interação `transferencia_categoria` e pode reiniciar em A contatar.
- Contas Carteira têm `origem` (ORIGENS_CARTEIRA) e `data_entrada_carteira` no cadastro.

## Legado

- Etapas comerciais antigas (Captação/Imóvel, Reunião, Visita, Permuta, Proposta, Fechado, Oportunidade futura, Parceiros) permanecem no banco como `ETAPAS_LEGADO`.
- Contas em etapa legada não aparecem no Kanban; ficam na visão Lista (filtro "Etapas legadas") e podem ser movidas pelo detalhe da conta (ContaFluxoAtendimento → "Mover para o novo funil").
- 23 contas da coluna "Parceiros" migradas para `is_partner = true` na migração de reestrutura.

## Arquivos-chave

- `src/lib/contasFunil.ts` — etapas, legado, categoria, destinos, motivos
- `src/components/contas/ContaFluxoAtendimento.tsx` — fluxo operacional no detalhe
- `src/components/contas/ContaCancelarDialog.tsx`, `AlterarCategoriaDialog.tsx`
- `src/pages/Accounts.tsx` — Kanban 5 colunas, filtros, visão Lista
- `src/pages/AccountDetail.tsx` — fluxo + alteração de categoria
- `src/pages/LeadDetail.tsx` — conversão gera `categoria: marketing`; desclassificada → Contato cancelado com motivo
