# Prazo do pagamento anual no imóvel

## O que muda
- No cadastro e na edição do imóvel, ao marcar **Pagamento anual**, aparece o campo **"Em quantos anos o proprietário aceita receber?"** com opções rápidas 2, 3, 4, 5 anos e um campo para digitar outro número (1 a 30).
- Ao desmarcar Pagamento anual, o prazo é apagado.
- Nos detalhes do imóvel, o selo mostra **"Pagamento anual — até 4 anos"** (por exemplo).
- No filtro de **Condição de pagamento** da aba Imóveis, quando "Pagamento anual" estiver marcado, aparece **"Prazo mínimo desejado pelo cliente"**: mostra só imóveis que aceitam pelo menos esse número de anos (ex.: cliente quer pagar em 4 anos → aparecem imóveis com 4 anos ou mais).
- Informação interna, não aparece no site.

## Detalhes técnicos
- Migração: coluna `imoveis.pagamento_anual_anos smallint NULL` com CHECK 1–30.
- `FormasPagamento.tsx`: novas props `anos`/`onAnosChange`; chips 2–5 + input numérico.
- `NovoImovelDialog`/`EditarImovelDialog`: estado e gravação (null se "anual" não marcado).
- `DetalhesImovelDialog`: rótulo com anos.
- `Imoveis.tsx`: filtro adicional `pagamento_anual_anos >= N`.
