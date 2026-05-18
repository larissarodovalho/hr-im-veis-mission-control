## Problema

Após clicar em "Baixar/Ver PDF" o link assinado não abre. Causas prováveis:

1. **Signed URL expira em 60s** — em `ContratosTab.handleDownload`, `createSignedUrl(path, 60)`. Se houver qualquer atraso (popup blocker, segunda aba), o token expira (o link que você colou tinha `exp - iat = 60s`).
2. **`window.open` em nova aba** pode ser bloqueado pelo navegador e/ou abre uma aba que apenas tenta carregar o PDF inline — alguns navegadores bloqueiam o domínio assinado.
3. Não há fallback para forçar download quando a aba não consegue renderizar.

## Solução

Ajustar **`src/components/contratos/ContratosTab.tsx`** → função `handleDownload`:

1. Aumentar `createSignedUrl(path, 3600)` (1h).
2. Em vez de `window.open(signedUrl)`, **baixar o arquivo via `fetch`**, gerar um `Blob URL` local e abrir / forçar download por `<a download>`. Isso evita o bloqueio de popup e funciona mesmo se o navegador não renderizar o PDF inline.
3. Mostrar `toast.error` claro caso o `fetch` falhe (ex.: arquivo realmente não existe no storage).
4. Para o caminho on-the-fly (sem `pdf_url`), manter `generatePdfBlob` mas usar a mesma estratégia de `<a>` ao invés de `window.open` puro.

### Pseudocódigo do novo `handleDownload`

```text
if c.pdf_url:
  url = createSignedUrl(c.pdf_url, 3600)
  blob = await fetch(url).then(r => r.blob())
else:
  blob = generatePdfBlob(...)

objUrl = URL.createObjectURL(blob)
a = document.createElement("a")
a.href = objUrl
a.target = "_blank"
a.rel = "noopener"
a.download = `contrato-${cliente_nome}-${id}.pdf`
a.click()
setTimeout(() => URL.revokeObjectURL(objUrl), 60000)
```

## Validação

- Criar/abrir contrato existente → o PDF abre em nova aba **ou** baixa direto, sem token expirando.
- Para contratos sem `pdf_url` (apenas rascunho), continua gerando on-the-fly.

Nenhuma alteração de banco/edge function necessária — apenas frontend.
