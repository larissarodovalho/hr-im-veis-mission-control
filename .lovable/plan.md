## Objetivo

Quando o usuário clicar em **"Enviar para assinatura"** num contrato (aba Contratos), a janela de envio (`SendDocumentDialog`) já deve abrir com o **PDF do contrato carregado** e o **nome pré-preenchido** — sem precisar baixar o PDF e re-anexar manualmente. Depois de enviado, o documento aparece automaticamente na aba **Documentos** (esse fluxo já funciona via `clicksign-create-document` → tabela `signed_documents`).

## Mudanças

### 1. `src/components/SendDocumentDialog.tsx`
- Adicionar props opcionais:
  - `defaultName?: string` — nome pré-preenchido do documento.
  - `defaultFile?: { blob: Blob; filename: string }` — PDF já pronto para anexar.
- No `useEffect` (quando `open` vira true) ou no estado inicial: se vier `defaultFile`, converter para `File` e setar em `setFile`; se vier `defaultName`, setar em `setName`.
- Resetar para valores default ao fechar (manter o `reset()` existente respeitando os defaults).

### 2. `src/components/contratos/ContratosTab.tsx`
- No clique do botão `Send` (linha 179), em vez de só abrir o dialog:
  - Buscar/gerar o blob do PDF do contrato (reaproveitando a lógica de `handleDownload`: se houver `pdf_url`, baixa do storage `signed-documents`; senão gera com `generatePdfBlob` a partir de `conteudo_renderizado`).
  - Armazenar `{ blob, filename }` num novo state `sendFile`.
  - Abrir `SendDocumentDialog` passando `defaultFile={sendFile}` e `defaultName={"Contrato — " + cliente_nome}`.
- Mostrar um pequeno loading enquanto prepara o PDF (toast/loading state no botão).
- Limpar `sendFile` ao fechar.

### 3. Vínculo com a aba Documentos
- Nenhuma mudança necessária — `SendDocumentDialog` já chama `clicksign-create-document` com `lead_id`/`conta_id`, que insere em `signed_documents`. A página `/crm/documentos` (`Documents.tsx`) já lista esses registros em realtime.
- Garantir que `leadId`/`contaId` do contrato continuem sendo passados (já são).

## Detalhes técnicos

- O blob do PDF já existente no storage é baixado via `createSignedUrl` + `fetch` (mesmo padrão de `handleDownload`).
- Conversão `Blob → File`: `new File([blob], filename, { type: "application/pdf" })`.
- Nome do arquivo sugerido: `contrato-<slug-cliente>-<id8>.pdf`.
- Não muda backend, schema, RLS, edge functions, nem o template do contrato.

## Resultado

1. Clicar em "Enviar para assinatura" na linha do contrato → diálogo abre com PDF anexado e nome preenchido.
2. Usuário só ajusta signatários/mensagem/prazo e clica em **Enviar**.
3. Documento aparece imediatamente na aba **Documentos** (já em realtime) e no painel da Conta/Lead.