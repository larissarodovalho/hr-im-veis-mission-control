import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Schedule() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const ahead = new Date(today); ahead.setDate(ahead.getDate() + 90);
      const [r, v] = await Promise.all([
        supabase.from("reunioes").select("id, agendada_para, local, status, leads(nome)").gte("agendada_para", today.toISOString()).lt("agendada_para", ahead.toISOString()),
        supabase.from("visitas").select("id, data_visita, status, leads(nome), imoveis(titulo)").gte("data_visita", today.toISOString()).lt("data_visita", ahead.toISOString()),
      ]);
      const events = [
        ...((r.data ?? []).map((m: any) => ({ id: m.id, kind: "Reunião", date: m.agendada_para, name: m.leads?.nome, info: m.local, status: m.status }))),
        ...((v.data ?? []).map((m: any) => ({ id: m.id, kind: "Visita", date: m.data_visita, name: m.leads?.nome, info: m.imoveis?.titulo, status: m.status }))),
      ].sort((a, b) => +new Date(a.date) - +new Date(b.date));
      setItems(events);
    })();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">Próximos compromissos da equipe.</p>
      </div>
      <Card className="p-4 md:p-6">
        <div className="space-y-2 max-h-[36rem] overflow-auto">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum compromisso futuro.</p>}
          {items.map(m => (
            <div key={m.kind + m.id} className="rounded-md border p-3 text-sm flex items-start justify-between">
              <div>
                <div className="font-medium">{format(new Date(m.date), "Pp", { locale: ptBR })}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.kind === "Reunião" ? "🤝" : "📍"} {m.kind} · {m.name || "—"}{m.info && ` · ${m.info}`}</div>
              </div>
              <Badge variant="outline">{m.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
