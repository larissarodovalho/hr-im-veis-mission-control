import { Link } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ETAPAS, EtapaFunil } from "@/lib/contasFunil";
import { Handshake, Target } from "lucide-react";

type Account = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  is_partner: boolean | null;
  interesse: string | null;
  etapa_funil: string | null;
};

type Property = { conta_id: string; valor_negocio: number | null };

interface Props {
  accounts: Account[];
  propsByAccount: Record<string, Property[]>;
  onMoveStage: (contaId: string, etapa: EtapaFunil) => void;
}

const fmt = (v: number) =>
  v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";

function ContaCard({ a, total }: { a: Account; total: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: a.id });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors space-y-1.5 touch-none"
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/app/contas/${a.id}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-medium text-sm hover:underline truncate flex-1"
        >
          {a.nome}
        </Link>
        {a.is_partner && (
          <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px] shrink-0">
            <Handshake className="h-3 w-3 mr-1" /> Parceiro
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground truncate">{a.telefone || a.email || "—"}</div>
      {a.interesse && (
        <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
          <Target className="h-3 w-3 mr-1" /> {a.interesse}
        </Badge>
      )}
      {total > 0 && <div className="text-xs font-medium">{fmt(total)}</div>}
    </Card>
  );
}

function Column({
  etapa,
  label,
  color,
  children,
  count,
}: {
  etapa: EtapaFunil;
  label: string;
  color: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <div className="flex-1 min-w-[260px] flex flex-col">
      <div className={`px-3 py-2 rounded-t-md border ${color} flex items-center justify-between`}>
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="outline" className="text-[10px]">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 bg-muted/20 border border-t-0 rounded-b-md min-h-[calc(100vh-260px)] overflow-y-auto transition-colors ${
          isOver ? "bg-primary/5 border-primary/40" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ContasKanban({ accounts, propsByAccount, onMoveStage }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const over = e.over?.id;
    if (!over) return;
    const novaEtapa = String(over) as EtapaFunil;
    const conta = accounts.find((a) => a.id === id);
    if (!conta || conta.etapa_funil === novaEtapa) return;
    onMoveStage(id, novaEtapa);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ETAPAS.map((et) => {
          const cards = accounts.filter((a) => (a.etapa_funil ?? "a_contatar") === et.id);
          return (
            <Column key={et.id} etapa={et.id} label={et.label} color={et.color} count={cards.length}>
              {cards.map((a) => {
                const total = (propsByAccount[a.id] ?? []).reduce((s, p) => s + (p.valor_negocio ?? 0), 0);
                return <ContaCard key={a.id} a={a} total={total} />;
              })}
              {cards.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">Vazio</div>
              )}
            </Column>
          );
        })}
      </div>
    </DndContext>
  );
}
