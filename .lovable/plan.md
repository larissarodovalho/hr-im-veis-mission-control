
## Plano — Ajustes na tabela de Reuniões

**Arquivo:** `src/pages/Meetings.tsx`

### 1. Nome do lead clicável (visualmente)
O nome já é um `<Link>` para `/app/leads/:id`, mas está discreto. Vou:
- Deixar com `text-primary underline-offset-2 hover:underline` para ficar óbvio que é clicável.
- Manter o `e.stopPropagation()` para não abrir o modal de edição ao clicar no nome.

### 2. Coluna "Local" mostrando o tipo
Hoje a coluna mostra só `local || link || "—"`. Vou trocar por:
- Um badge com o tipo (**Presencial** 🏠 / **Videochamada** 💻 / **Ligação** 📞) usando `m.tipo`.
- Abaixo (ou ao lado), o detalhe: endereço quando presencial, ou o link clicável quando videochamada/ligação.
- Renomear o cabeçalho para **"Tipo / Local"** para refletir melhor o conteúdo.

### Observações
- Sem mudanças de schema — `tipo` já existe em `reunioes` (`presencial` | `videochamada` | `ligacao`).
- Sem mudanças no formulário "Nova reunião" (já tem campos local/link; o tipo é editado no modal de edição).
- Mudança puramente visual/frontend.
