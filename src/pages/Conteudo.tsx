import EmptyState from "@/components/EmptyState";

export default function Conteudo() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Conteúdo</h2>
      <EmptyState title="Sem pautas cadastradas" description="As pautas e posts aparecerão aqui quando forem criados." />
    </div>
  );
}
