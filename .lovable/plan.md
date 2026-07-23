## Objetivo

Remover o botão flutuante verde do WhatsApp em todo o site público e substituí-lo por um botão que abre um formulário de contato. Ao enviar, cria um novo lead na aba Leads com identificação clara de origem "Formulário Site".

## Mudanças

### 1. `src/components/site/SiteLayout.tsx`
- Remover o `<a>` flutuante do WhatsApp (ícone verde).
- Adicionar um novo botão flutuante (mesma posição, cor neutra alinhada ao tema dark do site) que abre um Dialog com o formulário.
- Componente do formulário renderizado dentro do próprio layout para ficar disponível em todas as páginas.

### 2. Novo componente `src/components/site/ContactFormDialog.tsx`
- Dialog do shadcn com campos: **Nome**, **Telefone**, **E-mail**, **Mensagem**.
- Validação com zod (obrigatórios, limites de tamanho, e-mail válido, telefone só dígitos).
- Ao enviar, insert em `public.leads` via `supabase.from('leads').insert(...)` com:
  - `nome`, `telefone`, `email`, `observacoes` (mensagem)
  - `origem`: `"Formulário Site"`
  - `status`: `"novo"`
  - `etapa_funil`: primeira etapa do funil (`"novo"`)
  - `tags`: `["site"]`
- Toast de sucesso/erro (sonner).
- Sem envio de e-mail (conforme resposta).

### 3. RLS de `leads` para insert anônimo
- Adicionar política que permita `INSERT` para role `anon` **apenas** com `origem = 'Formulário Site'` e `created_by IS NULL`, para o formulário público funcionar sem login. Sem `GRANT INSERT` a anon a política não vale — incluir o grant.
- Manter todas as políticas SELECT/UPDATE/DELETE existentes intactas.

### 4. Limpeza
- Remover import `MessageCircle` e `createWhatsAppUrl` do `SiteLayout.tsx` se não usados em outro lugar do arquivo.
- Não alterar `src/lib/whatsapp.ts` nem outros CTAs (Contato page, etc.) — escopo limitado ao botão flutuante conforme resposta.

## Identificação do lead

Na aba **Leads** do CRM, o lead aparecerá com:
- Campo **Origem** = `Formulário Site` (visível nos cards do Kanban e no detalhe).
- Tag `site` para filtro rápido.

## Fora de escopo
- CTAs de WhatsApp em outras páginas (Contato, Home, Detalhe do imóvel).
- Envio de notificação por e-mail aos corretores.
