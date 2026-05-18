## Ajuste no formulário de contrato — imóvel opcional + manual

### Objetivo
No diálogo **Novo contrato**, o campo **Imóvel** deixa de ser obrigatório e passa a aceitar descrição manual, sem depender de um imóvel previamente cadastrado no sistema.

### Mudanças no frontend (`src/components/contratos/NovoContratoDialog.tsx`)

1. **Adicionar estado para descrição manual do imóvel**
   - Incluir `imovel_descricao_manual: ""` no objeto `empty` (estado inicial).

2. **Remover obrigatoriedade visual**
   - Alterar label de `"Imóvel cadastrado *"` para `"Imóvel cadastrado"`.

3. **Adicionar campo de entrada manual**
   - Abaixo do `<Select>` de imóveis cadastrados, incluir um `<Textarea>` (ou `<Input>` multi-line) com label `"Descrição manual do imóvel"`.
   - O campo é preenchido livremente pelo usuário quando não quiser/vai selecionar um imóvel do cadastro.

4. **Remover validação obrigatória no submit**
   - Remover a checagem `if (!imovelId) return toast.error("Selecione o imóvel")`.

5. **Lógica de montagem do endereço do imóvel no contrato**
   - Se `imovelId` estiver preenchido → montar endereço a partir dos dados do imóvel cadastrado (comportamento atual).
   - Se `imovelId` estiver vazio → usar `f.imovel_descricao_manual` como `imovel_endereco`.

6. **Banco de dados**
   - A coluna `imovel_id` na tabela `contratos` já aceita `NULL`, portanto nenhuma migration é necessária.

### Resultado esperado
- O usuário pode gerar um contrato sem ter o imóvel cadastrado no CRM.
- O asterisco de obrigatoriedade some do campo "Imóvel cadastrado".
- O PDF do contrato exibe a descrição manual do imóvel quando nenhum imóvel cadastrado for selecionado.