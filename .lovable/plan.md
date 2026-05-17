## Problemas

1. **Não dá para editar** um imóvel cadastrado no CRM (não existe diálogo de edição nem ação de editar nos cards de `/crm/imoveis`).
2. **O imóvel não aparece no site público** (`/imoveis` e `/imovel/:id`) porque essas páginas usam um array fixo vazio (`IMOVEIS_SITE: any[] = []`) e nunca consultam a tabela `imoveis` do banco.

## O que será feito

### 1. Editar imóvel no CRM (`/crm/imoveis`)

- Criar `src/components/imoveis/EditarImovelDialog.tsx` reaproveitando os campos do `NovoImovelDialog` (título, tipo, finalidade, status, valores, áreas, cômodos, endereço, características, destaque).
- Pré-carrega os dados do imóvel selecionado e salva via `update` na tabela `imoveis`.
- Gestão de fotos no edit:
  - Lista as fotos atuais com botão de remover (apaga a URL do array e o arquivo do bucket `imoveis`).
  - Permite adicionar novas fotos (passam pela mesma `applyWatermark` antes do upload).
  - Permite reordenar arrastando, opcional — manteremos só remover/adicionar para simplicidade.
- No `Imoveis.tsx`: cada card ganha um botão "Editar" (ícone lápis) que abre o diálogo. Após salvar, recarrega a lista.

### 2. Mostrar imóveis do CRM no site público

- `src/pages/site/ImoveisPage.tsx`: substituir o array fixo por um `useEffect` que faz `supabase.from("imoveis").select("*").eq("status","Disponível").order("created_at",{ascending:false})` e mapeia cada registro para o formato esperado pelo card:
  - `id`, `nome` ← `titulo`
  - `codigo` ← curto baseado no id (ex: `HR-` + primeiros 6 chars)
  - `endereco` ← `{ bairro, condominio: complemento||"", cidade, estado }`
  - `valor`, `tipo`, `quartos`, `banheiros`, `vagas`, `status`, `descricao`
  - `area` ← `area_util || area_total` formatado em m²
  - `imagem` ← primeira URL de `fotos` (fallback para a imagem mock atual quando vazio)
- Trocar `getImageForImovel(im.id, im.tipo)` por `im.imagem || fallbackMock(im.tipo)`.
- `src/pages/site/ImovelDetalhePage.tsx`: mesma migração — busca pelo `id` no banco, monta galeria a partir de `fotos[]` (com fallback). Mantém o layout atual.
- A RLS pública já permite `SELECT` em imóveis com `status = 'Disponível'`, então não precisa de migração.

## Fora de escopo

- Reordenação de fotos por drag-and-drop.
- Reaplicar marca d'água em fotos antigas.
- Filtros novos no site.
