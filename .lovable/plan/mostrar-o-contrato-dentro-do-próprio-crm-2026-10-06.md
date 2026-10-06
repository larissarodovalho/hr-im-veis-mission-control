# Mostrar o contrato dentro do próprio CRM

## Causa
O arquivo agora chega ao CRM, mas a nova aba em que ele abre também é barrada pelo Chrome (a tela "está bloqueado" sem endereço é exatamente essa aba). Uma extensão do navegador (bloqueador de anúncios ou de privacidade) está barrando a abertura de PDFs fora do CRM.

## Correção
- Ao clicar em "Ver contrato atual", abre uma **janela dentro do próprio CRM** com as páginas do contrato desenhadas na tela. Não abre nova aba, então nenhuma extensão barra.
- Na janela: rolagem pelas páginas, botão **Baixar PDF** (salva o arquivo no computador) e botão **Fechar**.
- Aviso claro se o arquivo não for encontrado.
- A mesma janela fica disponível para os outros lugares que abrem arquivos (aba Contratos, documentos do imóvel, propostas e documentos assinados), que hoje podem ter o mesmo bloqueio.

## Detalhes técnicos
- Adicionar `pdfjs-dist`; novo `src/components/common/PdfViewerDialog.tsx` que recebe `bucket` + `path`, faz `supabase.storage.download`, renderiza cada página em `<canvas>` (worker via `?url` do Vite).
- "Baixar PDF": `<a download>` com blob URL (download não é navegação, não é barrado).
- `NovaVendaDialog.tsx`: botão abre o `PdfViewerDialog` em vez de `abrirArquivoStorage`; remover o helper de nova aba ou mantê-lo só como download.
- Trocar os pontos de "ver/abrir" em `ContratosTab.tsx`, `ImovelDocumentosTab.tsx`, `Imoveis.tsx`, `ImovelHistoricoDrawer.tsx`, `DocumentDetail.tsx` para o mesmo diálogo.
- Validar no preview abrindo o contrato da venda do Cassio e conferindo que as páginas aparecem.
