# Explicar o que conta como CRM atualizado e desatualizado

O corte a partir do primeiro contato já vale igual para o CRM: os dois quadros ("CRM atualizado × desatualizado" e "Follow-up feito × não feito") usam a mesma base de conta-dias, que agora só começa no dia do primeiro contato. Contas ainda a contatar ficam fora dos dois. Nada a mudar no cálculo.

Falta o detalhamento: hoje o texto só diz "entram apenas as ocorrências em que a conta exigia contato ou atualização".

## O que será acrescentado

Abaixo de cada quadro, em linguagem simples, o critério usado:

**CRM atualizado × desatualizado**
- Conta entra na contagem do dia quando havia algo a fazer: tarefa vencida, próxima ação marcada para aquele dia ou antes, ou o prazo máximo entre contatos estourado.
- Conta como **atualizado** o dia em que houve atendimento registrado na conta, ou em que o último contato ainda estava dentro do prazo e não havia tarefa vencida.
- Conta como **desatualizado** o dia em que não houve registro e o prazo já tinha passado, ou havia tarefa vencida.
- A contagem começa no dia do primeiro contato da conta; dias anteriores não entram.

**Follow-up feito × não feito**
- Mesma base de dias exigíveis.
- **Não feito** é o dia exigível sem nenhum atendimento registrado com o prazo entre contatos já vencido.
- **Feito** é o restante: atendimento registrado no dia ou contato ainda dentro do prazo.

O mesmo texto vai para o PDF, logo abaixo dos quadros correspondentes.

## Detalhe técnico

- Somente apresentação: `AcompanhamentoCorretoresReport.tsx` (bloco da seção 03, textos por quadro) e `acompanhamentoPdf.ts` (mesmo texto após `barraGeralPdf`).
- Sem migração e sem mudança em `acompanhamento_apurar_diario`.
- Validação: typecheck, testes de `acompanhamentoPdf` e build.
