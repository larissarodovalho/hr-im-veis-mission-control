import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Calendar, Phone, MapPin, ExternalLink, Camera } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Item = {
  id: string;
  kind: "reuniao" | "ligacao" | "visita" | "captacao";
  when: string;
  status?: string | null;
  subtitle?: string | null;
  notes?: string | null;
};

const META = {
  reuniao: { label: "Reunião", icon: Calendar, color: "bg-violet-500/15 text-violet-700 border-violet-500/30", path: "/crm/reunioes" },
  ligacao: { label: "Ligação", icon: Phone, color: "bg-blue-500/15 text-blue-700 border-blue-500/30", path: "/crm/ligacoes" },
  visita: { label: "Visita", icon: MapPin, color: "bg-teal-500/15 text-teal-700 border-teal-500/30", path: "/crm/visitas" },
  captacao: { label: "Captação", icon: Sprout, color: "bg-amber-500/15 text-amber-700 border-amber-500/30", path: "/crm/imoveis" },
} as const;

export default function ContaAgendamentosList({ contaId }: { contaId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: reunioes }, { data: ligacoes }, { data: visitas }, { data: captacoes }] = await Promise.all([
      supabase.from("reunioes").select("id, agendada_para, duracao_min, tipo, local, link, status, notas").eq("conta_id", contaId),
      supabase.from("ligacoes").select("id, data, duracao_seg, resultado, notas").eq("conta_id", contaId),
      supabase.from("visitas").select("id, data_visita, status, observacoes").eq("conta_id", contaId),
      supabase.from("captacoes_imovel").select("id, data_agendada, estagio, observacoes").eq("conta_id", contaId).not("data_agendada", "is", null),
    ]);

    const all: Item[] = [
      ...((reunioes as any[]) ?? []).map((r) => ({
        id: r.id,
        kind: "reuniao" as const,
        when: r.agendada_para,
        status: r.status,
        subtitle: [r.tipo, r.duracao_min ? `${r.duracao_min} min` : null, r.local, r.link].filter(Boolean).join(" • ") || null,
        notes: r.notas,
      })),
      ...((ligacoes as any[]) ?? []).map((l) => ({
        id: l.id,
        kind: "ligacao" as const,
        when: l.data,
        status: l.resultado,
        subtitle: l.duracao_seg ? `${Math.round(l.duracao_seg / 60)} min` : null,
        notes: l.notas,
      })),
      ...((visitas as any[]) ?? []).map((v) => ({
        id: v.id,
        kind: "visita" as const,
        when: v.data_visita,
        status: v.status,
        subtitle: null,
        notes: v.observacoes,
      })),
      ...((captacoes as any[]) ?? []).map((c) => ({
        id: c.id,
        kind: "captacao" as const,
        when: c.data_agendada,
        status: c.estagio,
        subtitle: null,
        notes: c.observacoes,
      })),
    ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    setItems(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`conta-agenda-${contaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reunioes", filter: `conta_id=eq.${contaId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ligacoes", filter: `conta_id=eq.${contaId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "visitas", filter: `conta_id=eq.${contaId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "captacoes_imovel", filter: `conta_id=eq.${contaId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId]);

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <CalendarClock className="h-5 w-5" /> Agendamentos
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum agendamento ainda. Use os botões acima para criar.</p>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-4">
          {items.map((it) => {
            const meta = META[it.kind];
            const Icon = meta.icon;
            const isFuture = new Date(it.when).getTime() > Date.now();
            return (
              <li key={`${it.kind}-${it.id}`} className="ml-4">
                <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                    <span className="text-sm font-medium">
                      {format(new Date(it.when), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {isFuture && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Futuro</Badge>}
                    {it.status && <Badge variant="secondary">{it.status}</Badge>}
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={meta.path}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir</Link>
                  </Button>
                </div>
                {it.subtitle && <p className="text-xs text-muted-foreground mt-1">{it.subtitle}</p>}
                {it.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{it.notes}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
