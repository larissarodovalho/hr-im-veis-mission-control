## Escopo

Adicionar ação de **remover inscrito** na página `/crm/newsletter`, restrita a admin/gestor. O disparo de e-mail em massa fica de fora desta entrega (decisão do usuário).

## Mudanças

### 1. Banco (migration)
Adicionar policy de DELETE em `newsletter_subscribers`:
- `"Admins and gestores can delete newsletter subscribers"` → `DELETE` para role `authenticated` com `USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'))`.

(Hoje só existem policies de SELECT staff e INSERT público.)

### 2. UI — `src/pages/Newsletter.tsx`
- Adicionar coluna "Ações" na tabela com botão ícone de lixeira (`Trash2` do lucide-react), visível só se `isAdmin || isGestor` (via `useAuth`).
- Ao clicar, abrir `AlertDialog` de confirmação ("Remover {email} da newsletter? Esta ação não pode ser desfeita.").
- Confirmar → `supabase.from('newsletter_subscribers').delete().eq('id', id)`, toast de sucesso/erro, recarregar lista (`load()`).
- Estado local `deletingId` para desabilitar o botão durante a request.

### 3. Sobre disparo de e-mail
Não será implementado nesta task. Quando quiser ativar, o caminho recomendado é conectar **Brevo** (ou Resend/Mailgun) — a infra nativa do Lovable só permite e-mails transacionais (1 ação → 1 destinatário), não newsletter em massa.

## Fora de escopo
- Envio de e-mail para a lista.
- Edição de inscrito.
- Soft-delete (vamos usar DELETE definitivo, já que existe o status `unsubscribed` se preferir mais tarde virar soft).
