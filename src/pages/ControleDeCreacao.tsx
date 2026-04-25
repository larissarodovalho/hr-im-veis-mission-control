import EmptyState from "@/components/EmptyState";

export default function ControleDeCreacao() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Controle de Criação</h2>
      <EmptyState
        title="Sem dados ainda"
        description="Os indicadores de criação aparecerão aqui quando houver dados reais cadastrados."
      />
    </div>
  );
}
