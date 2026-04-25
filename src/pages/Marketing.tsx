import EmptyState from "@/components/EmptyState";

export default function Marketing() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Marketing</h2>
      <EmptyState
        title="Marketing aguardando integração"
        description="Quando conectarmos Meta Ads, Google Ads e redes sociais, os dados reais aparecerão aqui."
      />
    </div>
  );
}
