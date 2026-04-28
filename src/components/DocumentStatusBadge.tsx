import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  draft: { label: "Rascunho", variant: "outline" },
  sent: { label: "Aguardando", variant: "secondary" },
  partially_signed: { label: "Parcial", variant: "secondary", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  signed: { label: "Assinado", variant: "default", className: "bg-primary text-primary-foreground" },
  refused: { label: "Recusado", variant: "destructive" },
  expired: { label: "Expirado", variant: "outline", className: "text-muted-foreground" },
  canceled: { label: "Cancelado", variant: "outline", className: "text-muted-foreground" },
  pending: { label: "Pendente", variant: "outline" },
  viewed: { label: "Visualizado", variant: "secondary" },
};

export default function DocumentStatusBadge({ status }: { status: string }) {
  const m = map[status] || { label: status, variant: "outline" as const };
  return <Badge variant={m.variant} className={m.className}>{m.label}</Badge>;
}
