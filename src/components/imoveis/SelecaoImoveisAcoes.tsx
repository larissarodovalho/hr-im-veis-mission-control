// Barra flutuante de seleção múltipla de imóveis (link temporário de seleção).
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, X, ListChecks } from "lucide-react";

interface Props {
  quantidade: number;
  maximo: number;
  onLimpar: () => void;
  onCriar: () => void;
  onSair: () => void;
}

export default function SelecaoImoveisAcoes({ quantidade, maximo, onLimpar, onCriar, onSair }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="mx-auto mb-4 w-[min(680px,94vw)] pointer-events-auto rounded-xl border bg-card/95 backdrop-blur shadow-lg p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <ListChecks className="h-4 w-4 text-primary" />
          <span className="font-medium">Seleção de imóveis</span>
          <Badge variant="secondary" className="text-[10px]">
            {quantidade}/{maximo}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Marque os imóveis nos cards para montar um único link.
        </span>
        <div className="ml-auto flex items-center gap-2">
          {quantidade > 0 && (
            <Button size="sm" variant="ghost" onClick={onLimpar}>Limpar</Button>
          )}
          <Button size="sm" variant="outline" onClick={onSair}>
            <X className="h-3.5 w-3.5 mr-1" /> Sair
          </Button>
          <Button size="sm" disabled={quantidade === 0} onClick={onCriar}>
            <Link2 className="h-3.5 w-3.5 mr-1" /> Criar link da seleção
          </Button>
        </div>
      </div>
    </div>
  );
}
