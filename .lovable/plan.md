# Corrigir envio de PDF (planta baixa) em Editar imóvel → Documentos

## O que já foi conferido
- O limite da tela é 10 MB, então um arquivo de 8 MB deveria passar.
- A pasta de documentos não tem limite próprio nem restrição de tipo, e os corretores/gestores/admins têm permissão de envio.
- A causa exata ainda não está confirmada. Suspeitas mais prováveis:
  1. O Mac/navegador às vezes não informa o tipo do arquivo como "PDF" (ex.: arquivos exportados de programas de projeto), e a tela recusa por "apenas PDF".
  2. Limite geral de tamanho de arquivos do sistema abaixo de 8 MB.
  3. Envio lento/interrompido sem aviso claro.

## O que vou fazer
1. Aceitar o arquivo como PDF também pela extensão `.pdf`, não só pelo tipo informado pelo navegador.
2. Aumentar o limite por arquivo para 25 MB (plantas costumam ser pesadas) e garantir que o limite geral do sistema comporte isso.
3. Mostrar mensagens claras quando falhar (tipo, tamanho ou erro de envio), e permitir anexar o mesmo arquivo de novo logo após um erro.
4. Testar o envio de um PDF de ~8 MB na tela.

## Detalhes técnicos
- `ImovelDocumentosTab.tsx`: validação `f.type === "application/pdf" || /\.pdf$/i.test(f.name)`; `MAX_BYTES = 25MB`; limpar `input.value` após seleção; texto "máx. 25 MB".
- `supabase--configure_storage` para limite global ≥ 25MB se estiver abaixo.
