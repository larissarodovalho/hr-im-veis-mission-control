import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Calendar, MessageCircle, Mail, MapPin, Star, StickyNote, Trash2, Send, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";

type Interacao = {
  id: string;
  tipo: string;
  descricao: string | null;
  created_at: string;
  created_by: string | null;
};

const TIPOS = [
  { value: "Reunião", icon: Calendar, color: "bg-violet-500/15 text-violet-700 border-violet-500/30" },
  { value: "Ligação", icon: Phone, color: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  { value: "WhatsApp", icon: MessageCircle, color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  { value: "Email", icon: Mail, color: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  { value: "Visita", icon: MapPin, color: "bg-teal-500/15 text-teal-700 border-teal-500/30" },
  { value: "Interesse", icon: Star, color: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { value: "Nota", icon: StickyNote, color: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
];

const tipoMeta = (t: string) => TIPOS.find((x) => x.value === t) ?? TIPOS[TIPOS.length - 1];

export default function ContaInteracoesTimeline({ contaId }: { contaId: string }) {
  const { isAdmin, isGestor } = useRole();
  const [items, setItems] = useState<Interacao[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [tipo, setTipo] = useState("Reunião");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data }, { data: profs }, { data: { user } }] = await Promise.all([
      supabase
        .from("interacoes")
        .select("id, tipo, descricao, created_at, created_by")
        .eq("conta_id", contaId)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, nome"),
      supabase.auth.getUser(),
    ]);
    setItems((data as Interacao[]) ?? []);
    const map: Record<string, string> = {};
    ((profs as any) ?? []).forEach((p: any) => { if (p.user_id) map[p.user_id] = p.nome || "—"; });
    setAuthorMap(map);
    setUserId(user?.id ?? null);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`interacoes-conta-${contaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "interacoes", filter: `conta_id=eq.${contaId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId]);

  const registrar = async () => {
    if (!descricao.trim()) return toast.error("Descreva a interação");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return toast.error("Faça login novamente"); }
    const { error } = await supabase.from("interacoes").insert({
      conta_id: contaId,
      tipo,
      descricao: descricao.trim(),
      created_by: user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Interação registrada");
    setDescricao("");
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta interação?")) return;
    const { error } = await supabase.from("interacoes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <History className="h-5 w-5" /> Histórico de interações
      </h3>

      <div className="border rounded-md p-3 space-y-3 bg-muted/20">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
        </div>
        <Textarea
          rows={3}
          placeholder="Descreva a reunião, ligação, interesse demonstrado, próximos passos…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={registrar} disabled={saving}>
            <Send className="h-4 w-4 mr-1" /> {saving ? "Salvando…" : "Registrar"}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma interação registrada ainda.</p>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-4">
          {items.map((it) => {
            const meta = tipoMeta(it.tipo);
            const Icon = meta.icon;
            const autor = it.created_by ? (authorMap[it.created_by] ?? "—") : "—";
            const canDelete = isAdmin || isGestor || it.created_by === userId;
            return (
              <li key={it.id} className="ml-4">
                <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={meta.color}>{it.tipo}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(it.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">• {autor}</span>
                  </div>
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => excluir(it.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {it.descricao && (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{it.descricao}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
