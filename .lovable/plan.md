# Lista de Contas com colunas separadas

## Objetivo
Na tela `/app/contas`, exibir cada conta em **colunas independentes**: Nome, Telefone, E-mail, CPF/CNPJ e Proprietário (responsável). Hoje a tabela mistura tudo numa coluna "Cliente" e mostra Interesse/Operação/Valor — vou substituir por essas 5 colunas.

## Mudanças

### `src/pages/Accounts.tsx`
1. Adicionar `documento` e `responsavel_id` ao `select` da query de contas e ao tipo `Account`.
2. Buscar em paralelo os perfis (`profiles: user_id, nome`) e montar mapa `user_id → nome` para exibir o proprietário.
3. **Tabela desktop** — substituir cabeçalhos atuais por:
   - Nome (com badge "Parceiro" se aplicável, link para detalhe)
   - Telefone (formatado, `—` quando vazio)
   - E-mail (`—` quando vazio)
   - CPF/CNPJ (formatado conforme `tipo` PF/PJ, `—` quando vazio)
   - Proprietário (nome do perfil, `—` quando não atribuído)
   - Status (mantém badge ativo/inativo, mais compacto)
   - Ações (abrir + excluir, inalterado)
   
   Remover colunas: Interesse, Operação/Aptidão, Propriedades, Valor total, Comissão.
4. **Card mobile** — reorganizar para mostrar as mesmas 5 informações em linhas rotuladas (Telefone, E-mail, CPF/CNPJ, Proprietário), removendo blocos de Propriedades/Valor/Comissão.
5. Ajustar `buildExportRows` (Excel/CSV) para refletir as mesmas colunas: Nome, Telefone, E-mail, CPF/CNPJ, Proprietário, Status, Criado em.
6. Atualizar o resumo no header: remover "Negócios"/"Comissões" (não há mais essas colunas visíveis) e manter só `X de Y contas`.

### Sem mudanças
- Kanban (`ContasKanban`) permanece como está.
- Detalhe da conta (`/app/contas/:id`) permanece como está.
- Schema do banco — `documento` e `responsavel_id` já existem.

## Notas técnicas
- Formatação de CPF (`000.000.000-00`) e CNPJ (`00.000.000/0000-00`) feita no front por helper local.
- Como `contas.responsavel_id` não tem FK declarada para `profiles`, faço a query separada e junto no cliente (consistente com o resto do app).
- RLS de `profiles` permite a admin/gestor ver todos; corretor só vê o próprio. Para corretor o nome de outros responsáveis vai aparecer como `—` (aceitável, pois ele só enxerga as próprias contas mesmo).
