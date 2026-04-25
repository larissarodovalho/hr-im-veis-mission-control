import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export default function EmptyState({
  title = "Sem dados ainda",
  description = "Os dados reais aparecerão aqui assim que forem cadastrados ou integrados.",
  icon,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="mb-4 text-muted-foreground">
          {icon ?? <Inbox className="h-10 w-10" />}
        </div>
        <h3 className="font-semibold text-base mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}
