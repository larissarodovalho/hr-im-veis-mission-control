# Restringir edição de imóveis para corretor

Corretores só podem **buscar/visualizar** imóveis. Admin/gestor/marketing mantêm acesso total.

## Mudanças em `src/pages/Imoveis.tsx`

- Adicionar `const { isAdmin, isGestor, isMarketing } = useAuth(); const canEdit = isAdmin || isGestor || isMarketing;`
- Esconder quando `!canEdit`:
  - Botão "Cadastrar imóvel" (header)
  - Botão lápis "Editar imóvel" no card (linha 194)
  - Toggle Publicado/Não publicado (linha 177–189) — vira badge somente leitura
- Manter visíveis: busca, abas, histórico, propostas e demais ações de negociação (essas são ações de venda, não de cadastro).

## Observações

- O acesso ao **menu lateral** continua o mesmo (corretor já vê "Imóveis").
- RLS do banco já permite UPDATE para corretor dono (`corretor_id = auth.uid()`); não vou mexer no banco — restrição é só de UI.
- Se quiser bloquear também no banco (corretor nunca atualiza imóveis, nem os próprios), me avise que faço a migration separada.

Confirmo?