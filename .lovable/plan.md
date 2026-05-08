## Plano — Cores de status nas Reuniões

**Arquivo:** `src/pages/Meetings.tsx`

### Cores no badge de Status (coluna Status)
Trocar o `<Badge variant="outline">` por badges coloridos por status:
- **agendada** → vermelho (`bg-danger/15 text-danger border-danger/30`) — sinaliza que precisa de aprovação
- **confirmada** → verde (`bg-success/15 text-success border-success/30`)
- **realizada** → verde sólido / muted (`bg-success text-success-foreground`)
- **cancelada** → cinza (`bg-muted text-muted-foreground`)
- **no_show** → laranja/aviso (`bg-warning/15 text-warning border-warning/30`)

### Botão "Aprovar" (coluna Ações)
Quando o status for **agendada**, deixar o botão verde para indicar a ação positiva:
- `className="bg-success text-success-foreground hover:bg-success/90"` (sem `variant="outline"`)
- Continua aparecendo só quando `status !== "confirmada" && status !== "realizada"`

Mudança puramente visual, usando os tokens semânticos já existentes (`success`, `danger`, `warning`, `muted`).