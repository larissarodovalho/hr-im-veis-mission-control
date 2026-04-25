import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  date: Date;
  title: string;
  lead_id?: string | null;
  status?: string | null;
  description?: string | null;
};

interface EventsCalendarProps {
  events: EventItem[];
  title?: string;
}

export function EventsCalendar({ events, title = "Calendário" }: EventsCalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const eventDays = useMemo(() => events.map((e) => e.date), [events]);
  const dayEvents = useMemo(
    () => (selected ? events.filter((e) => isSameDay(e.date, selected)) : []),
    [events, selected],
  );

  return (
    <Card className="p-4 md:p-6">
      <h2 className="font-display text-lg md:text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        <div className="flex justify-center md:justify-start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={ptBR}
            modifiers={{ hasEvent: eventDays }}
            modifiersClassNames={{
              hasEvent:
                "relative font-semibold text-primary after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
            }}
            className={cn("p-3 pointer-events-auto rounded-md border")}
          />
        </div>
        <div className="space-y-2 min-w-0">
          <div className="text-sm text-muted-foreground">
            {selected ? format(selected, "PPPP", { locale: ptBR }) : "Selecione um dia"}
          </div>
          {dayEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md">
              Nenhum evento neste dia.
            </div>
          ) : (
            <ul className="space-y-2">
              {dayEvents
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((ev) => (
                  <li key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-card">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {format(ev.date, "HH:mm", { locale: ptBR })} —{" "}
                        {ev.lead_id ? (
                          <Link to={`/app/leads/${ev.lead_id}`} className="hover:underline">
                            {ev.title}
                          </Link>
                        ) : (
                          <span>{ev.title}</span>
                        )}
                      </div>
                      {ev.description && (
                        <div className="text-xs text-muted-foreground break-words mt-0.5">{ev.description}</div>
                      )}
                    </div>
                    {ev.status && (
                      <Badge variant={ev.status === "pendente" ? "destructive" : "outline"} className="shrink-0">
                        {ev.status}
                      </Badge>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
