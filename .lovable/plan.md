## Objetivo

A partir de agora, toda foto de imóvel enviada terá **2 versões salvas**:
- a versão pública **com marca d'água** (como já acontece hoje)
- a versão **original sem marca d'água**, guardada em local privado

Adicionar botão para baixar a versão sem marca d'água, quando disponível.

## Mudanças

### 1. Storage
- Criar bucket privado `imoveis-originais` (só acessível via signed URL, autenticado).
- As fotos com marca d'água continuam no bucket público `imoveis` (sem alteração).

### 2. Upload (NovoImovelDialog, EditarImovelDialog, NovaVendaDialog)
- Ao subir uma nova foto: enviar o arquivo **original** para `imoveis-originais/<imovel_id>/<nome>` e a versão com marca para `imoveis/...` como hoje.
- Usar o **mesmo nome de arquivo** nos dois buckets para casar original ↔ com marca.

### 3. Botão "Baixar originais (sem marca)"
No EditarImovelDialog, ao lado de "Reaplicar marca d'água":
- Lista as fotos atuais e, para cada uma, tenta achar a correspondente em `imoveis-originais`.
- Se encontrar 1+: baixa em um **.zip** (usando `jszip`) contendo apenas as originais disponíveis.
- Se não encontrar nenhuma (fotos antigas): mostra toast explicando que originais não existem para fotos enviadas antes desta atualização.
- Botão fica desabilitado durante o download.

### 4. Fotos antigas
Não há como recuperar — ficam apenas com marca d'água. O botão simplesmente avisa quando não houver original disponível.

## Detalhes técnicos

- Bucket `imoveis-originais`: privado, RLS em `storage.objects` permitindo `SELECT/INSERT/DELETE` para usuários autenticados (mesma política do bucket atual de imóveis).
- Match original ↔ pública: derivar o path do original a partir da URL pública atual (mesmo basename, prefixo do bucket trocado).
- Dependência nova: `jszip` para empacotar o download.
- Sem alteração no schema do banco — o vínculo é só pelo nome de arquivo no storage.
