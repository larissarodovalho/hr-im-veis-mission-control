import EmptyState from "@/components/EmptyState";

export default function TrafegoPago() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Tráfego Pago</h2>
      <EmptyState title="Aguardando integração" description="Conecte Meta Ads e Google Ads para ver dados reais aqui." />
    </div>
  );
}
