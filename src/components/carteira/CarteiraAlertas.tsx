import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarClock, CalendarX, Briefcase } from "lucide-react";
import { AlertasCorretor } from "@/hooks/useCarteira";

interface Props {
  dados: AlertasCorretor | null;
  filtro?: string | null;
  onFiltrar?: (f: "atrasadas" | "acao_vencida" | "prazo_hoje" | null) => void;
}

export default function CarteiraAlertas({ dados, filtro, onFiltrar }: Props) {
  if (!dados || dados.total_ativas === 0) return null;

  const itens = [
    {
      key: "atrasadas" as const,
      label: "Atrasadas",
      valor: dados.atrasadas,
      icon: AlertTriangle,
      tom: "text-rose-600",
      dica: "Prazo do primeiro contato vencido",
    },
    {
      key: "acao_vencida" as const,
      label: "Ações vencidas",
      valor: dados.acao_vencida,
      icon: CalendarX,
      tom: "text-amber-600",
      dica: "Retorno agendado que já passou",
    },
    {
      key: "prazo_hoje" as const,
      label: "Vencem hoje",
      valor: dados.prazo_hoje,
      icon: CalendarClock,
      tom: "text-sky-600",
      dica: "Primeiro contato com prazo para hoje",
    },
  ];

  const temAlerta = dados.atrasadas > 0 || dados.acao_vencida > 0 || dados.prazo_hoje > 0;

  return (
    <Card className={temAlerta ? "border-amber-500/40 bg-amber-500/5" : undefined}>
      <CardContent className="p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
          <Briefcase className="h-3.5 w-3.5" /> {dados.total_ativas} conta(s) na carteira
        </span>
        {itens.map((i) => (
          <Button
            key={i.key}
            size="sm"
            variant={filtro === i.key ? "default" : "outline"}
            className="h-8 text-xs"
            title={i.dica}
            onClick={() => onFiltrar?.(filtro === i.key ? null : i.key)}
          >
            <i.icon className={`h-3.5 w-3.5 mr-1 ${filtro === i.key ? "" : i.tom}`} />
            {i.label}: {i.valor}
          </Button>
        ))}
        {dados.sem_proxima_acao > 0 && (
          <span className="text-xs text-muted-foreground">
            {dados.sem_proxima_acao} sem próxima ação agendada
          </span>
        )}
      </CardContent>
    </Card>
  );
}
