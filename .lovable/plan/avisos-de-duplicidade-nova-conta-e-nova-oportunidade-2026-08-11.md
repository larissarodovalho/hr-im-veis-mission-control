# Avisos de duplicidade: nova conta e nova oportunidade

Reforçar os dois pontos de entrada para que ninguém crie registro repetido sem perceber.

## 1. Criar Oportunidade — conta já vinculada

Hoje o modal já busca oportunidades da conta e só bloqueia se houver alguma **ativa**, com um aviso simples. Melhorias:

- Mostrar o aviso assim que a conta é selecionada, com destaque visual (amarelo) e a informação completa de cada oportunidade existente: título, etapa atual, responsável e data de criação.
- Incluir também oportunidades já encerradas (ganha/perdida) em uma linha separada e discreta ("esta conta já teve X oportunidades encerradas"), apenas informativo.
- Cada oportunidade listada vira link para abrir o registro existente em nova aba.
- Manter a regra: com oportunidade ativa, o botão Criar fica bloqueado até marcar "É uma busca realmente diferente".

## 2. Nova Conta — contato já existe em Carteira ou Marketing

Hoje a verificação usa telefone, e-mail e documento. Melhorias:

- Verificar também por **nome** (normalizado, sem acento/caixa) contra contas existentes — nome sozinho apenas alerta, não bloqueia (coerente com a regra já usada na conversão de lead).
- No alerta, exibir em qual funil o contato já está: badge "Carteira" ou "Marketing" (ou "Sem categoria"), além da etapa e do responsável, como já ocorre.
- Telefone / e-mail / documento coincidentes continuam bloqueando o salvamento até o usuário confirmar "Cadastrar mesmo assim".
- O texto do aviso deixa explícito: "Este contato já existe na base de contas (Carteira/Marketing)".

## Detalhes técnicos

- `src/lib/duplicates.ts`: adicionar busca opcional por nome (`nome` no input, comparação com `normName`, consulta em `contas` com `ilike`), retornar `categoria` no `DuplicateMatch` e classificar match `"nome"` como não bloqueante (`soft`).
- `src/components/DuplicateAlert.tsx`: renderizar badge de categoria e distinguir visualmente matches fortes (bloqueiam) de matches por nome (apenas aviso).
- `src/components/contas/NovaContaDialog.tsx`: incluir `form.nome` no debounce da verificação; bloquear o botão Salvar apenas quando houver match forte.
- `src/components/oportunidades/CriarOportunidadeDialog.tsx`: `selecionarConta` passa a trazer `estagio`, `corretor_id` e separar ativas/encerradas; ajustar o bloco de aviso com links e etapas.

Sem alterações no banco de dados.
