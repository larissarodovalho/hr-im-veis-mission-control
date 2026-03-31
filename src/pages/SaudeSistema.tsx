import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemHealth } from "@/data/mockData";
import { Server, Monitor, Brain, Database, Facebook, Chrome } from "lucide-react";

const iconMap: Record<string, typeof Server> = {
  "VPS (Servidor)": Server,
  "Mac (Produção)": Monitor,
  "API Anthropic": Brain,
  "Salesforce": Database,
  "Meta Ads API": Facebook,
  "Google Ads API": Chrome,
};

const statusBadge = {
  online: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", label: "🟢 Online" },
  offline: { bg: "bg-red-50 border-red-200", dot: "bg-destructive", label: "🔴 Offline" },
  degraded: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", label: "⚠️ Degradado" },
};

export default function SaudeSistema() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Saúde do Sistema</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.map((system) => {
          const Icon = iconMap[system.nome] || Server;
          const badge = statusBadge[system.status];
          return (
            <Card key={system.nome} className={`${badge.bg} border`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">{system.nome}</h3>
                  </div>
                  <span className="text-xs">{badge.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{system.detalhe}</p>
                <p className="text-[10px] text-muted-foreground">Última checagem: {system.ultimaChecagem}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
