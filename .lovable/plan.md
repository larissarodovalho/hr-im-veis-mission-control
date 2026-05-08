## Subabas "Carteira" e "Marketing" na aba Contas

Adicionar duas subabas independentes dentro de `/app/contas`, filtrando contas pela tag correspondente (`carteira` ou `marketing`) usando o campo `tags` já existente na tabela `contas`.

### Comportamento

- Acima dos filtros atuais, exibir um `Tabs` com duas opções: **Carteira** e **Marketing**.
- A subaba ativa filtra a lista (cards/tabela) para mostrar apenas contas cujo array `tags` contém o valor correspondente (`"carteira"` ou `"marketing"`).
- Contadores no cabeçalho ("X de Y · Negócios · Comissões") passam a refletir apenas a subaba ativa.
- Persistir a subaba selecionada via query string `?lista=carteira|marketing` (default: `carteira`) para manter o estado ao navegar/voltar.
- Botão **Nova conta** já existente continua o mesmo, mas pré-popula a tag da subaba ativa (ex.: criando dentro de "Marketing" já marca tag `marketing`).
- Filtros, busca e exportação operam sobre a subaba ativa.

### Mudanças técnicas (frontend apenas)

- `src/pages/Accounts.tsx`:
  - Novo state `lista: "carteira" | "marketing"` lido/escrito em `useSearchParams`.
  - Componente `<Tabs>` (shadcn) renderizado logo abaixo do header, antes da grid de filtros.
  - Pipeline `filtered` ganha mais um predicado: `(a.tags ?? []).includes(lista)`.
  - Ajuste no `NovaContaDialog`: passar prop opcional `defaultTags={[lista]}` para que a nova conta nasça já classificada.
- `src/components/contas/NovaContaDialog.tsx`:
  - Aceitar `defaultTags?: string[]` e mesclar no payload `tags` do insert.
- `src/components/contas/ImportarContasDialog.tsx`:
  - Aceitar `defaultTags?: string[]` e aplicar a cada linha importada (sem sobrescrever tags existentes da planilha).

### O que NÃO muda

- Schema do banco: nenhum novo campo. Apenas uso do array `tags` já existente em `contas`.
- RLS, edge functions, rotas e demais páginas permanecem iguais.
- Contas antigas sem tag não aparecerão em nenhuma subaba; o usuário pode editá-las e adicionar a tag desejada (ou criar via uma das subabas para já marcar).

### Pergunta operacional (resolvida na implementação)

Para contas legadas sem tag, posso opcionalmente exibir um aviso discreto na subaba "Carteira" do tipo "X contas sem categoria — classificar" levando para um filtro extra. Se quiser, sinalize ao aprovar; caso contrário sigo sem esse aviso.