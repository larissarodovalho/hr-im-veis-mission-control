## Contexto
A API oficial do WhatsApp não entrega a foto real do contato. A lista hoje já mostra um círculo com iniciais, mas todos usam a mesma cor (`bg-gradient-primary`), ficando difícil distinguir contatos visualmente.

## Alteração
Trocar o avatar de cor única por **avatar com iniciais e cor gerada a partir do nome** — cada contato fica com uma cor consistente própria, mantendo a paleta do site.

### Arquivos
1. **`src/pages/WhatsApp.tsx`** (linha ~286 — lista de conversas, e no header da conversa ativa se existir avatar lá)
   - Substituir `bg-gradient-primary text-primary-foreground` por estilo inline `backgroundColor` derivado do `displayName`.
   - Manter tamanho (`h-9 w-9`), forma redonda e iniciais via `initials()`.

2. **Helper novo** (inline no arquivo ou em `src/lib/utils.ts`):
   - `colorFromName(name: string)` → hash simples do nome → seleciona um HSL de uma paleta curada de ~10 tons (sóbrios, condizentes com o tema do CRM, sem neon).
   - Texto sempre branco (`text-white`) para contraste garantido.

## Escopo
- Só visual, sem mudanças de banco nem de webhook.
- Aplicar também no header da conversa ativa se houver um avatar lá, para consistência (verificar linhas ~310+).
- Não mexer em outras telas (Leads, Contas) — só WhatsApp.
