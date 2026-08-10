# Erro "interacoes_check" ao registrar interação na oportunidade

## O que a mensagem significa

O banco exige que toda interação do histórico esteja ligada a **um lead ou a uma conta de cliente**. A regra é literalmente: "lead preenchido OU conta preenchida".

Quando a interação é registrada a partir de uma **oportunidade que não tem conta vinculada**, ela vai só com o vínculo da oportunidade — nenhum dos dois campos exigidos é preenchido — e o banco recusa o registro com essa mensagem.

Situação atual: das 33 oportunidades, **3 estão sem conta vinculada**. Só nessas o erro aparece.

## Correção proposta

1. Ajustar a regra do banco para aceitar também interações ligadas apenas a uma oportunidade (lead OU conta OU oportunidade).
2. Nas telas de oportunidade (detalhe, ganha, perdida, qualificação), quando a oportunidade tiver conta, continuar gravando a conta junto — assim o histórico segue aparecendo na ficha do cliente.
3. Como as 3 oportunidades sem conta são um sintoma, sinalizar na tela da oportunidade quando não houver cliente vinculado, para o time completar o cadastro.

## Detalhes técnicos

- Migração: substituir o `CHECK (lead_id IS NOT NULL OR conta_id IS NOT NULL)` de `public.interacoes` por `CHECK (lead_id IS NOT NULL OR conta_id IS NOT NULL OR oportunidade_id IS NOT NULL)`.
- Sem mudança de RLS: as políticas de leitura/escrita de `interacoes` continuam as mesmas; conferir se alguma delas depende só de `conta_id`/`lead_id` e, se depender, estender para o caminho da oportunidade.
- Arquivos envolvidos no frontend: `src/components/oportunidades/OportunidadeDetailDialog.tsx`, `GanhaDialog.tsx`, `PerdidaDialog.tsx`, `QualificacaoOportunidadeDialog.tsx`.
