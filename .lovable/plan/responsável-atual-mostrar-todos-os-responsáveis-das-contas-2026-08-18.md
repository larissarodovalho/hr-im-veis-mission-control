# Responsável atual: mostrar todos os responsáveis das contas

## O problema

No passo 2 da Distribuição de Carteira, o filtro "Responsável atual" só lista usuários com perfil **Corretor** (hoje: Douglas, Gabriel, Rafael). Hans Rodovalho tem perfil **Admin**, por isso não aparece — mesmo sendo o responsável de 1.070 contas da base da empresa (origem HR Imóveis), justamente as que você quer distribuir em lotes.

## O que muda

O seletor "Responsável atual" passa a listar **todos os usuários que hoje são responsáveis por alguma conta**, independentemente do perfil (admin, gestor, corretor, marketing, secretaria). Continua com as opções "Qualquer" e "Sem responsável" no topo.

Cada nome mostra a quantidade de contas sob sua responsabilidade, por exemplo "Hans Rodovalho (1.070)", para facilitar escolher a base certa.

Nada muda no passo 1 (escolha dos corretores que recebem os lotes): lá continua valendo apenas quem tem perfil Corretor.

## Detalhes técnicos

- Novo hook (ou extensão em `src/hooks/useCarteira.ts`) que busca os `responsavel_id` distintos de `contas` com contagem e cruza com `profiles` para obter o nome.
- `src/pages/CarteiraDistribuicao.tsx` passa a usar essa lista no Select de "Responsável atual", mantendo `corretores` apenas para o passo de destinatários dos lotes.
- Sem alteração de banco, RLS ou lógica de elegibilidade.
