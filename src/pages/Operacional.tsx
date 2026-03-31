import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kanbanTasks, agentStatus, activityLog } from "@/data/mockData";
import { CheckCircle, Clock, AlertTriangle, CircleDot } from "lucide-react";

const columns = ["A fazer", "Em andamento", "Feito"] as const;
const columnIcons = { "A fazer": Clock, "Em andamento": CircleDot, "Feito": CheckCircle };
const prioridadeColors = {
  Alta: "bg-destructive/10 text-destructive border-destructive/20",
  Média: "bg-accent/20 text-accent-foreground border-accent/30",
  Baixa: "bg-muted text-muted-foreground border-border",
};

export default function Operacional() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Operacional</h2>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const Icon = columnIcons[col];
          const tasks = kanbanTasks.filter((t) => t.status === col);
          return (
            <div key={col} className="kanban-column">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{col}</h3>
                <Badge variant="secondary" className="text-xs ml-auto">{tasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className={`rounded-lg border p-3 bg-card ${prioridadeColors[task.prioridade]}`}>
                    <p className="text-sm font-medium">{task.titulo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{task.responsavel}</span>
                      <Badge variant="outline" className="text-[10px]">{task.prioridade}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agentStatus.map((agent) => (
              <div key={agent.nome} className="flex items-start gap-3 p-4 rounded-lg border">
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${agent.status === "online" ? "bg-emerald-500" : agent.status === "offline" ? "bg-destructive" : "bg-amber-500"}`} />
                <div>
                  <p className="font-medium text-sm">{agent.nome}</p>
                  <p className="text-xs text-muted-foreground">{agent.detalhes}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Última atividade: {agent.ultimaAtividade}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log de Atividade</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {activityLog.map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-emerald-500" : log.status === "warning" ? "bg-amber-500" : "bg-destructive"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{log.descricao}</p>
                  <p className="text-[10px] text-muted-foreground">{log.tipo} · {log.data}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
