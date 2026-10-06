# Abrir o PDF do contrato da venda sem bloqueio

## Causa
O link "Ver contrato atual" leva o navegador direto para o endereço do servidor de arquivos. A tela mostra `ERR_BLOCKED_BY_CLIENT`: quem bloqueia é o próprio Chrome, quase sempre por uma extensão (bloqueador de anúncios ou de privacidade) que barra esse endereço. O arquivo foi salvo corretamente.

## Correção
- Ao clicar em "Ver contrato atual", o sistema baixa o PDF por dentro do CRM (pelo mesmo canal que já funciona no resto do app) e abre em uma nova aba como arquivo local. Assim nenhuma extensão barra.
- Se o navegador bloquear a nova aba, o PDF é baixado direto como arquivo.
- Mensagem de erro clara caso o arquivo não seja encontrado.
- Aplicar o mesmo jeito de abrir nos outros lugares com o mesmo problema: contratos (aba Contratos), documentos do imóvel, propostas e documentos assinados.

## Detalhes técnicos
- Novo helper `src/lib/abrirArquivoStorage.ts`: `supabase.storage.from(bucket).download(path)` -> `URL.createObjectURL(blob)` -> `window.open`; fallback com `<a download>`; revogar a URL após 60s.
- `NovaVendaDialog.tsx`: trocar o `<a href={signedUrl}>` por botão que chama o helper; remover o `createSignedUrl` da linha 162.
- Mesma troca em `ContratosTab.tsx`, `ImovelDocumentosTab.tsx`, `Imoveis.tsx`, `ImovelHistoricoDrawer.tsx`, `DocumentDetail.tsx` (só nos pontos de "abrir/ver").
- Validar no preview clicando no contrato da venda do Cassio.
