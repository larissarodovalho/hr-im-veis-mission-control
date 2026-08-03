# Unificar ou editar ao converter lead com conta duplicada

## Objetivo
Quando a conversão de lead em conta detecta uma conta já existente (mesmo telefone/nome), oferecer duas ações em vez de apenas bloquear:
- **Unificar**: vincula o lead à conta existente (sem criar conta nova), puxando todo o histórico do lead para essa conta. A conta existente mantém seus dados atuais.
- **Editar**: devolve o foco ao formulário de conversão para corrigir nome/telefone antes de converter.

## Mudanças

### 1. Banco de dados — função `unificar_lead_em_conta(p_lead_id, p_conta_id)`
Nova migration com função `SECURITY DEFINER` (necessária porque a política de atualização de `interacoes` é restrita a autor/admin/gestor):

- Valida permissão: admin/gestor, ou corretor/criador do lead, ou responsável/criador da conta — caso contrário, erro.
- Se `contas.lead_id_origem` estiver vazio, preenche com o lead (é o que faz o lead aparecer como "Convertido em conta" no funil, Dashboard e relatórios).
- Transfere o histórico: move `interacoes`, `tarefas` e `reunioes` do lead (`lead_id = p_lead_id AND conta_id IS NULL`) para a conta. Assim tarefas agendadas e o cronograma de tentativas acompanham a conta.
- Caso raro: se a conta já estiver vinculada a outro lead, mantém o vínculo original e marca `leads.status = 'Convertido'` para o lead sair do funil.
- Retorna resumo (id da conta, quantidade de registros movidos). `GRANT EXECUTE` apenas para `authenticated`.

### 2. `src/components/DuplicateAlert.tsx`
- Nova prop opcional `onMerge?: (match) => void`: quando presente, cada conta encontrada na lista ganha um botão **Unificar** ao lado do nome.

### 3. `src/pages/LeadDetail.tsx` (dialog "Converter lead em Conta Cliente")
- Quando houver duplicidade (`convertDups`), o alerta passa a exibir:
  - **Unificar** em cada conta correspondente → chama `confirmMerge(contaId)` → executa a função do banco, fecha o dialog, toast "Lead unificado à conta existente" e navega para `/crm/contas/<id>`.
  - **Editar dados** → foca o campo Telefone do formulário (o formulário já fica visível acima do alerta; a verificação de duplicidade reage automaticamente ao digitar).
- O botão "Converter em Conta Cliente" continua bloqueado enquanto houver duplicidade (a opção "Cadastrar mesmo assim" permanece como hoje).

## Resultado
- Nenhuma conta duplicada é criada: unificar mantém uma única conta com o telefone/nome do cliente, com todo o histórico do lead (interações, tarefas e reuniões) nela.
- O lead sai do funil de leads e passa a constar como "Convertido em conta" no funil, Dashboard e relatórios.

## Verificação
- Teste com Playwright: converter um lead cujo telefone já existe em uma conta, clicar em **Unificar** e confirmar que a conta única recebeu o histórico e o lead aparece como convertido.
