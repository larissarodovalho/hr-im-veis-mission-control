import EmptyState from "@/components/EmptyState";

export default function RedesSociais() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Redes Sociais</h2>
      <EmptyState title="Aguardando integração" description="Conecte os perfis para ver métricas reais aqui." />
    </div>
  );
}
