## Ajustes na aba Contas

### 1. Busca por tag/interesse/profissão
Em `src/pages/Accounts.tsx`:
- Atualizar o placeholder do input de busca para `"Buscar nome, tag, interesse, profissão…"`.
- Estender o filtro `filtered` para que o termo de busca também case com:
  - `a.interesse`
  - qualquer item de `a.tags` (que hoje guarda áreas/profissão)
  - `a.ramo_atividade` (campo já existente em `contas`)
- Continuar casando nome, email, telefone, fazenda e região (sem perder o comportamento atual).

### 2. Filtro por Responsável (carteira)
Em `src/pages/Accounts.tsx`:
- Adicionar um novo `Select` "Responsável" na barra de filtros, ao lado dos selects de Tipo/Interesse/Status/Temperatura.
- Opções: "Todos os responsáveis", "Sem responsável", e um item por usuário a partir do array `owners` já carregado (que vem de `profiles`).
- Estado `ownerFilter` controla o filtro; aplica em `filtered`: `responsavel_id === ownerFilter` (ou `null` para "Sem responsável").
- Layout: ajustar o grid de filtros para acomodar a coluna extra (de `lg:grid-cols-4` para `lg:grid-cols-6` ou similar, mantendo a lupa ocupando 2 colunas).

### 3. Temperatura no menu de três pontinhos do card
Em `src/components/contas/ContasKanban.tsx`:
- Adicionar um terceiro `DropdownMenuSub` "Temperatura" dentro do menu do card, abaixo de "Responsável".
- Itens: cada entrada de `TEMPERATURAS` (Quente/Morno/Frio) + uma opção "Sem temperatura" (null), com check ao lado da atual.
- Propagar a alteração via nova prop `onChangeTemperatura?: (contaId: string, temp: string | null) => void`.

Em `src/pages/Accounts.tsx`:
- Implementar `changeTemperatura(id, temp)` no mesmo padrão de `changeOwner` (optimistic update + `supabase.from("contas").update({ temperatura: temp }).eq("id", id)`).
- Passar `onChangeTemperatura={changeTemperatura}` para `<ContasKanban />`.

### Fora de escopo
- Sem mudanças no Kanban além do menu de três pontinhos e novas props.
- Sem mudanças na view "Lista" (a temperatura já tem coluna lá).
- Sem mudanças em RLS/migrações — apenas frontend e update existente.