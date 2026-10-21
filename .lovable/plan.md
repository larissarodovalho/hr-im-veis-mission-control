# Liberar "Cadastrar imóvel" para corretores

## O que muda
- Usuários com cargo **Corretor** passam a ver o botão **Cadastrar imóvel** na aba Imóveis e podem cadastrar normalmente (fotos, proprietário, características etc.).
- O resto continua como está: corretores **não** ganham editar imóveis de outros, publicar/ocultar no site nem a aba Vendidos.

## Detalhes técnicos
- Banco já permite: a regra de inserção em `imoveis` aceita o papel `corretor` (com `created_by = auth.uid()`). Nenhuma migração.
- `src/pages/Imoveis.tsx`: criar `canCreate = canEdit || isCorretor` (de `useAuth`) e usar apenas no botão "Cadastrar imóvel" (linha ~571) e na mensagem de lista vazia. `canEdit` segue igual para editar/publicar.
- Verificar no preview logado como corretor que o botão aparece e o cadastro salva.
