## Objetivo

Permitir, dentro de cada conta, escolher se ela pertence à **Carteira** ou ao **Marketing**, alinhando com as abas já existentes em `/app/contas` (que filtram por essas tags) para suportar qualificação e nutrição.

## Como funciona hoje

- A classificação "carteira" / "marketing" já existe como tag no array `contas.tags`.
- A página `Accounts.tsx` (linhas 113, 195–198) filtra a lista pela tag.
- No detalhe da conta (`AccountDetail.tsx`) **não há** controle para definir/alterar essa lista — só dá pra setar na criação/importação.

## Mudança

Adicionar um seletor "Lista" no detalhe da conta, mantendo as demais tags intactas.

### Arquivo: `src/pages/AccountDetail.tsx`

1. **Header da conta** — exibir badge da lista atual ("Carteira" / "Marketing") ao lado do nome, quando aplicável. Derivar de `acc.tags`.

2. **Dialog "Editar conta"** — adicionar campo:
   ```
   <Label>Lista</Label>
   <Select value={listaAtual} onValueChange={...}>
     <SelectItem value="nenhuma">Nenhuma</SelectItem>
     <SelectItem value="carteira">Carteira</SelectItem>
     <SelectItem value="marketing">Marketing</SelectItem>
   </Select>
   ```
   - O state `editing` ganha um campo `lista` derivado de `tags` na abertura.
   - No `save()`, recompor `tags`: remover `"carteira"` e `"marketing"` das existentes e adicionar a nova (se diferente de "nenhuma"). Persistir junto no `update` em `contas`.

3. **Adicionar botão de atalho** no header da conta: "Mover para Carteira" / "Mover para Marketing" via dropdown rápido (opcional, mas útil — fica visível sem abrir o dialog).

### Não muda

- Schema: `tags text[]` já existe em `contas`.
- RLS: já cobre update por dono/admin/gestor.
- Listagem `/app/contas`: continua filtrando pelas mesmas tags automaticamente.
- Página de leads / outras telas: fora do escopo.

## Observação

As tags são mutuamente exclusivas para essa dimensão: uma conta fica em **uma** lista por vez (Carteira **ou** Marketing **ou** nenhuma). Se você quiser permitir as duas ao mesmo tempo, me avise antes de eu implementar.
