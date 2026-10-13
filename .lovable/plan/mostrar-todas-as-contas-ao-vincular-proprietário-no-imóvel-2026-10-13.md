# Mostrar todas as contas ao vincular proprietário no imóvel

## Causa
No cadastro e na edição do imóvel, o campo "Proprietário (conta)" pede até 2.000 contas de uma vez. Só que o sistema entrega no máximo 1.000 por consulta, e hoje há mais de 1.500 contas. Por isso as contas que vêm depois na ordem alfabética (por exemplo, nomes que começam com R, S, T...) não aparecem na busca. É o mesmo problema que já corrigimos na janela de Nova venda.

## Correção
- Em `src/components/imoveis/ResponsavelProprietarioSection.tsx` (usado em Novo imóvel e Editar imóvel), buscar as contas em lotes de 1.000 até trazer todas.
- Após criar uma conta nova pelo botão "+", a lista é recarregada inteira e a conta nova já vem selecionada.
- Conferir os outros campos de conta da aba Imóveis (Nova proposta, captação) e aplicar a mesma correção onde houver o mesmo limite.
- Nada muda nos dados.

## Verificação
No preview, abrir Novo imóvel e buscar uma conta do fim da ordem alfabética (ex.: "Ricardo Nicolau" ou "Sandra Pires") no campo Proprietário — ela deve aparecer e ser selecionável.
