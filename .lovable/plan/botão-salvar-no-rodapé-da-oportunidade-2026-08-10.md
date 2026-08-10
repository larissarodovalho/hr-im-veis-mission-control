# Botão "Salvar" no rodapé da Oportunidade

## Problema

No diálogo de detalhes da oportunidade, o rodapé tem apenas "Excluir", "Perdida" e "Ganha". Os campos preenchidos (título, descrição da busca, valor-alvo, tipo, cidade/bairro, prioridade, corretor, permuta, observações etc.) só são salvos pelo botão que fica dentro da aba Diagnóstico — quem preenche e fecha o diálogo perde os dados.

## O que será feito

- Adicionar um botão **"Salvar"** no rodapé do diálogo, ao lado de "Perdida" e "Ganha" (à esquerda deles), sempre visível enquanto a oportunidade não estiver finalizada (Ganha/Perdida).
- O botão grava os dados do formulário na oportunidade (mesma gravação já usada na aba Diagnóstico), mostra confirmação "Dados salvos" e atualiza o card no funil — sem mudar a etapa.
- Fica desabilitado enquanto está salvando e exige o título preenchido, como hoje.
- O botão existente dentro da aba Diagnóstico continua funcionando (inclusive o "Concluir diagnóstico", que é o que avança para Buscando imóvel).

## Detalhes técnicos

- Arquivo: `src/components/oportunidades/OportunidadeDetailDialog.tsx`.
- Reutilizar a função `salvarDiagnostico` no `DialogFooter`, com `disabled={saving}`, renderizada quando `!finalizada`.
- Nenhuma alteração de banco de dados ou de outras telas.
