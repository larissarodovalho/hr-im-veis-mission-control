## Anexar PDF da proposta assinada

Ao iniciar uma proposta no imóvel, o corretor poderá anexar (obrigatoriamente) o PDF da proposta já assinada pelo cliente. O arquivo fica armazenado no backend e pode ser baixado depois.

### Banco
- Nova coluna em `propostas`:
  - `documento_url text` — URL pública do PDF assinado
  - `documento_nome text` — nome original do arquivo (para exibição)
- Novo bucket de Storage **`propostas`** (privado), com policies:
  - INSERT/SELECT autenticados (staff)
  - Service role full access

### UI
- `src/components/imoveis/NovaPropostaDialog.tsx`:
  - Novo campo **"Proposta assinada (PDF)"** com `<input type="file" accept="application/pdf">`
  - Validação: obrigatório, máx 20 MB, apenas PDF
  - Ao salvar: faz upload para `propostas/{imovel_id}/{timestamp}-{nome}.pdf`, gera signed URL de longa duração (ou public URL via `getPublicUrl` se o bucket for público) e salva em `documento_url`
- `src/pages/Imoveis.tsx`:
  - Nos cards das abas **Em Proposta** e **Em Fechamento**, mostrar botão **"Ver PDF assinado"** que abre `documento_url` em nova aba
  - Aba **Vendidos**: também mostrar o link do PDF da proposta aceita

### Decisão de bucket
Bucket **privado** + signed URL de 1 ano na hora de exibir (mais seguro, já que é documento assinado pelo cliente). Sem alteração de RLS além das policies do próprio bucket.

### Fora do escopo
- Assinatura eletrônica dentro do sistema (já existe fluxo separado em /contratos com Clicksign).
- Substituição/versionamento do PDF — por ora, uma única versão por proposta.