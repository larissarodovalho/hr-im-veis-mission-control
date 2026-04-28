# Replicar layout de Configurações da Brazil Lands

Hoje a página `/app/configuracoes` do CRM HR usa abas (Empresa, WhatsApp, Integrações & IA, Notificações, Sistema). Na Brazil Lands é uma **página única scrollável** com cards na ordem do screenshot. Vou alinhar visualmente.

## Nova ordem da página (top → bottom)

1. **Backup & Recuperação de dados** *(novo card)*
   - Sub-cards: "Lixeira (até 30 dias)" → link para `/app/lixeira`
   - "Auditoria (histórico completo)" → link para `/app/auditoria`
   - "Backup automático do banco" (texto informativo sobre Lovable Cloud → Backups)
   - Caixa de dica sobre permissões (apenas admin pode excluir definitivamente).

2. **Webhook de captação de leads** *(já existe na aba, vai virar card no topo)*
   - URL `https://...supabase.co/functions/v1/lead-webhook` com botão copiar.
   - Exemplo de JSON: `full_name`, `phone`, `email`, `source`, `interest`, `region`, `notes`.

3. **WhatsApp (Evolution API / Z-API)** *(novo card de instruções, igual Brazil Lands)*
   - URL do webhook `whatsapp-webhook` com botão copiar.
   - Caixa verde com "Próximos passos" (pedir ao Lovable para configurar credenciais, fornecer URL/API key/instância, colar webhook).

4. **Status / QR Code / Webhook ativo / Testar envio** *(mantém o `WhatsAppConnection` que já existe)*
   - Status da instância (🟢/🔴) + Reiniciar / Desconectar
   - Gerar QR Code com polling
   - Configurar webhook na Evolution
   - Testar envio

5. **IA conversacional** *(card simples)*
   - Texto: "A IA atende leads no chat público (`/captura`) e no WhatsApp quando o toggle está ativo."
   - Badge com modelo `google/gemini-3-flash-preview` via Lovable AI.

6. **Landing de captura**
   - URL `https://.../captura` com botão copiar.

7. **Configurações avançadas (abas no rodapé)**
   - Mantém Empresa / Notificações / Sistema em `Tabs` no final, para não perder funcionalidades já existentes.

## Detalhes técnicos

Arquivo único alterado: `src/pages/ConfiguracoesPage.tsx`.

- Remover `Tabs` no topo; substituir por sequência vertical de `Card`s.
- Criar 5 componentes internos: `BackupRecuperacao`, `WebhookCaptacao`, `WhatsAppEvolutionInfo`, `IAConversacional`, `LandingCaptura`.
- Reaproveitar `WhatsAppConnection` já existente (status + QR + teste de envio).
- Importar ícones extras do `lucide-react`: `ShieldCheck`, `History`, `Trash2`, `HardDrive`.
- Importar `Link` do `react-router-dom` para os atalhos de Lixeira/Auditoria.
- Manter as funcionalidades de Empresa, Notificações e Sistema dentro de `Tabs` no final da página.

## Fora do escopo deste passo

- Criar a Edge Function `lead-webhook` (apenas mostramos a URL — se ainda não existir, peça depois "ativar webhook de captação de leads").
- Criar a página pública `/captura` (apenas mostramos a URL).
- Configurar credenciais reais da Evolution/Z-API (depende de você fornecer URL, API key e nome da instância).
