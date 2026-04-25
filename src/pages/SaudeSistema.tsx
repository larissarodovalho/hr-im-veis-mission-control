import EmptyState from "@/components/EmptyState";

export default function SaudeSistema() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Saúde do Sistema</h2>
      <EmptyState
        title="Monitoramento aguardando integração"
        description="Quando conectarmos os checadores reais (VPS, APIs, integrações), o status aparecerá aqui."
      />
    </div>
  );
}
