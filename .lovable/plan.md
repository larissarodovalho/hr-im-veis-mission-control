## Objetivo
Alinhar os botões "Solicitar visita / Ver imóvel" no mesmo nível em todos os cards da listagem `/imoveis`, mesmo quando descrições ou listas de características têm tamanhos diferentes.

## Diagnóstico
Hoje cada card tem altura definida pelo seu próprio conteúdo (descrição, specs, características). Como as descrições variam, a barra de CTAs fica em alturas diferentes entre cards lado a lado.

## Mudança
Em `src/pages/site/ImoveisPage.tsx`, no bloco do card (linhas 373-553):

1. Fazer cada item do grid esticar até a altura do mais alto:
   - Adicionar `h-full` no wrapper externo (linha 381) e no card interno (linha 395).
2. Transformar o card em coluna flex:
   - Adicionar `flex flex-col` no card interno (linha 395).
3. Fazer o bloco de conteúdo crescer e empurrar os CTAs para baixo:
   - Adicionar `flex flex-col flex-1` no `<div className="p-5 pb-7 sm:p-6 sm:pb-8">` (linha 453).
   - Adicionar `mt-auto` no `<div className="flex gap-2">` dos CTAs (linha 529).

Resultado: todos os cards passam a ter a mesma altura, e a barra de botões fica fixa na base, alinhada entre os cards.

Sem mudanças em dados, lógica ou outros arquivos.