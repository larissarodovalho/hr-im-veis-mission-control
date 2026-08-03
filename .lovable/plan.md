# Reforçar verificação de duplicidade ao converter lead em Conta Cliente

## Estado atual (confirmado no código e no banco)
Ao abrir "Converter lead em Conta Cliente", o sistema já verifica duplicidade na base de **contas** por telefone, e-mail e CPF/CNPJ (função `check_duplicate_contact`, SECURITY DEFINER — enxerga contas de todos os corretores) e também por nome+telefone combinados. Quando encontra uma conta, o alerta exibe o botão **Unificar**, que vincula o lead à conta existente e transfere todo o histórico (interações, tarefas e reuniões), sem criar conta nova.

## Lacunas a corrigir
1. **Sem correspondência só por nome**: se o cliente já está na base de contas com o mesmo nome mas telefone diferente (ou sem telefone), nada é detectado e uma conta duplicada pode ser criada.
2. **Verificação invisível**: quando não há duplicidade, nada aparece — não dá para saber se a checagem rodou ou se falhou silenciosamente.

## Mudanças

### 1. Correspondência por nome na base de contas
- `src/lib/duplicates.ts`: estender `matchedBy` com o tipo `"nome"`.
- Na verificação do dialog (`src/pages/LeadDetail.tsx`), além das checagens atuais, buscar contas com **nome normalizado igual** (sem acentos, maiúsculas/minúsculas e espaços extras) ao nome do formulário. Correspondência por nome aparece no alerta com o botão **Unificar**, mas é tratada como aviso: **não bloqueia** o botão "Converter" sozinha (nomes iguais podem ser pessoas diferentes). Bloqueio continua apenas para telefone/e-mail/documento.
- `src/components/DuplicateAlert.tsx`: exibir o rótulo "nome" na descrição da correspondência.

### 2. Verificação visível
- No dialog de conversão, enquanto a checagem roda: indicador discreto "Verificando duplicidade…".
- Ao terminar sem encontrar nada: confirmação sutil em verde, "Nenhuma conta duplicada encontrada na base — pode converter com segurança". Assim toda conversão deixa claro que a base de contas foi consultada.

### 3. Regras mantidas
- Auto-correspondência (o próprio lead) continua ignorada.
- Duplicidade real de conta por telefone/e-mail/documento continua bloqueando a conversão, com as opções **Unificar**, **Editar dados** e "Cadastrar mesmo assim".
- Unificar continua usando a função `unificar_lead_em_conta`: mantém a conta existente, transfere histórico e marca o lead como convertido.

## Resultado
- Toda vez que clicar em "Converter em Conta Cliente", a base de contas é consultada por telefone, e-mail, CPF/CNPJ **e nome**.
- Se o cliente já existir como conta, o botão **Unificar** aparece para juntar as informações em uma conta só.
- Quando não houver duplicidade, o usuário vê a confirmação de que a verificação foi feita.

## Verificação
- Playwright: (a) criar/usar uma conta com o mesmo nome de um lead e confirmar que o alerta com **Unificar** aparece ao abrir a conversão; (b) em lead sem correspondência, confirmar a mensagem "Nenhuma conta duplicada encontrada"; (c) confirmar que correspondência só por nome não bloqueia o botão Converter.
