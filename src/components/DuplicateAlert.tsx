import { AlertTriangle, Building2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { DuplicateMatch } from "@/lib/duplicates";
import { Button } from "@/components/ui/button";

interface Props {
  matches: DuplicateMatch[];
  onIgnore?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export default function DuplicateAlert({ matches, onIgnore, onCancel, showActions }: Props) {
  if (!matches.length) return null;
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" />
        Possível duplicidade encontrada
      </div>
      <ul className="space-y-1 text-sm">
        {matches.map((m) => {
          const Icon = m.table === "leads" ? User : Building2;
          const path = m.table === "leads" ? `/app/leads/${m.id}` : `/app/contas/${m.id}`;
          const by = m.matchedBy
            .map((b) => (b === "email" ? "e-mail" : b === "telefone" ? "telefone" : "documento"))
            .join(" + ");
          return (
            <li key={`${m.table}:${m.id}`} className="flex items-start gap-2">
              <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <Link to={path} className="font-medium hover:underline" target="_blank">
                  {m.nome}
                </Link>
                <span className="text-xs text-muted-foreground ml-2">
                  ({m.table === "leads" ? "Lead" : "Conta"} · {by})
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {showActions && (
        <div className="flex gap-2 pt-1">
          {onCancel && (
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {onIgnore && (
            <Button size="sm" variant="secondary" onClick={onIgnore}>
              Cadastrar mesmo assim
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
