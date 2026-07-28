
## Situação encontrada

Rodei uma varredura em `leads` e `contas` cruzando por telefone normalizado, e-mail e nome.

**Leads ↔ Contas:** zero duplicatas cruzadas (a última rodada de consolidação limpou tudo).

**Contas ↔ Contas (mesmo telefone):** 11 pares duplicados, 22 registros no total. Todos são o mesmo cliente cadastrado duas vezes (uma na importação de maio e outra criada manualmente pelos corretores depois):

| Cliente | Manter | Excluir |
|---|---|---|
| Igor Neves Oliveira | `ab3011f0` (carteira, e-mail, mais completo) | `57b269d1` (marketing/fechado, sem e-mail) |
| Helio Foton / Moreira | `7f3a78f8` (mais antigo, importado) | `8e8e8b84` |
| Thaylla | `6ca7949e` (minúscula) | `fc2dcd73` |
| Adriano Miotti | `430e7271` (importado) | `4346f647` |
| Alexandre Vial | `afc3306b` (captação em andamento) | `c0d7362f` (perdido) |
| Joires Antônio Maciel | `be593135` (importado) | `a17e5fb8` (migrar e-mail antes) |
| Salvador | `46c10180` (captação) | `7b026d52` ("- duplicado") |
| Ronaldo Ceni | `d7fbe986` (importado) | `5a770fed` |
| Clodoaldo Oliveira | `e65152a7` (importado) | `bea00831` |
| Douglas Carniel | `6ef7ce68` (importado) | `d3228586` |
| Dino Sani | `66650d27` (com e-mail) | `341a36bc` (fechado — migrar valor de fechamento antes) |

Regra da consolidação: manter o registro **mais completo** (com e-mail, tags de importação, corretor responsável original); migrar para ele todo o histórico da duplicata — `interacoes`, `tarefas`, `visitas`, `reunioes`, `ligacoes`, `conta_propostas`, `conta_fechamentos`, `conta_propriedades`, `captacoes_imovel`, `notas` — e só então excluir a duplicata. Se a duplicata estiver em `fechado`/`captacao_imovel`, o valor/estágio é copiado para a mantida antes da exclusão.

## Prevenção no cadastro

Ao lançar **nova conta** (`NovaContaDialog`) ou **novo lead** (`NewLeadDialog` em `Leads.tsx`), quando o corretor sair do campo telefone (ou e-mail), o formulário faz uma checagem via `list_contas_min`/consulta direta cruzando `normalize_br_phone(telefone)` e `lower(trim(email))` contra `contas` e `leads`.

- Se houver match, aparece um alerta amarelo dentro do dialog:
  > "Já existe um cadastro com este telefone: **Fulano de Tal** (Conta · Marketing · Responsável: X). [Abrir cadastro existente]"
- O botão **Salvar** fica desabilitado até o corretor confirmar em um checkbox "Salvar mesmo assim (não é duplicado)". Isso preserva a possibilidade de dois cadastros legítimos com o mesmo número (familiares) mas força uma decisão consciente.
- Como as políticas RLS de `leads` e `contas` filtram por responsável para corretores, a checagem passa a rodar por uma nova função SECURITY DEFINER `check_duplicate_contact(_phone, _email)` que devolve apenas `{tipo, id, nome, etapa, responsavel_nome}` — nunca dados sensíveis — para todo staff conseguir ver mesmo quando o registro pertence a outro corretor.

## Passos

1. **Consolidar as 11 duplicatas** listadas via `supabase--insert` (uma migração de dados, sem schema).
2. **Criar função `check_duplicate_contact(text, text)`** via `supabase--migration` — retorna matches em `leads` e `contas` por telefone normalizado ou e-mail.
3. **Atualizar `src/components/contas/NovaContaDialog.tsx`**: debounce onBlur no telefone/e-mail, banner de aviso com link, checkbox de confirmação.
4. **Atualizar `NewLeadDialog` em `src/pages/Leads.tsx`**: mesma UX.
5. **Testar** criando uma conta com telefone `66984170652` — deve avisar "Helio Foton já cadastrado".

## Fora do escopo

- Não altero a UI dos Kanbans nem a lógica de conversão lead→conta.
- Não crio índice único em telefone (bloquearia casos legítimos de familiares); a checagem é apenas um aviso.
- Não mexo em duplicatas de leads (a query mostrou zero).
