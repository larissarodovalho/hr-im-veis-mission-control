import EmptyState from "@/components/EmptyState";

export default function VisaoGeral() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Visão Geral</h2>
      <EmptyState
        title="Visão Geral aguardando dados"
        description="Quando houver leads, vendas, campanhas e atividades reais cadastradas, os indicadores aparecerão aqui."
      />
    </div>
  );
}
