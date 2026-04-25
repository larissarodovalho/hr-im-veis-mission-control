import EmptyState from "@/components/EmptyState";

export default function Operacional() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Operacional</h2>
      <EmptyState
        title="Operacional aguardando dados"
        description="Tarefas, status dos agentes e logs reais aparecerão aqui assim que forem registrados."
      />
    </div>
  );
}
