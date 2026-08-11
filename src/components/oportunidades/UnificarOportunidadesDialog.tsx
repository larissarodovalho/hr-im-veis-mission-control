import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Merge, Loader2, CheckCircle2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ESTAGIOS, isEstagioFinal } from "@/lib/oportunidadesFunil";

type Row = {
  grupo_id: string;
  grupo_tipo: string;
  cliente_nome: string;
  oportunidade_id: string;
  titulo: string | null;
  estagio: string | null;
  corretor_id: string | null;
  valor_alvo: number | null;
  created_at: string;
  n_interacoes: number;
  n_visitas: number;
  n_propostas: number;
};

const ordemEstagio = (e?: string | null) => {
  const i = ESTAGIOS.findIndex((x) => x.key === (e ?? "nova"));
  return i < 0 ? 0 : i;
};

const estagioLabel = (e?: string | null) => ESTAGIOS.find((x) => x.key === (e ?? "nova"))?.label ?? (e ?? "—");

/** Sugestão de principal: mais avançada no funil (ignorando finais) e, em empate, mais recente */
const sugerirPrincipal = (rows: Row[]) =>
  [...rows].sort((a, b) => {
    const fa = isEstagioFinal(a.estagio) ? 1 : 0;
    const fb = isEstagioFinal(b.estagio) ? 1 : 0;
    if (fa !== fb) return fa - fb;
    const de = ordemEstagio(b.estagio) - ordemEstagio(a.estagio);
    if (de !== 0) return de;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0]?.oportunidade_id;

export default function UnificarOportunidadesDialog({
  open,
  onOpenChange,
  corretores,
  onUnified,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  corretores: Record<string, string>;
  onUnified: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [principal, setPrincipal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("oportunidades_duplicadas");
    if (error) toast.error("Erro ao buscar duplicidades: " + error.message);
    const list = (data ?? []) as Row[];
    setRows(list);
    const grupos: Record<string, Row[]> = {};
    list.forEach((r) => { (grupos[r.grupo_id] = grupos[r.grupo_id] ?? []).push(r); });
    const sel: Record<string, string> = {};
    Object.entries(grupos).forEach(([g, rs]) => { sel[g] = sugerirPrincipal(rs)!; });
    setPrincipal(sel);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const grupos = useMemo(() => {
    const g: Record<string, Row[]> = {};
    rows.forEach((r) => { (g[r.grupo_id] = g[r.grupo_id] ?? []).push(r); });
    return Object.entries(g);
  }, [rows]);

  const unificar = async (grupoId: string, rs: Row[]) => {
    const main = principal[grupoId];
    if (!main) return;
    const outras = rs.filter((r) => r.oportunidade_id !== main);
    setSaving(grupoId);
    for (const o of outras) {
      const { error } = await (supabase as any).rpc("oportunidades_unificar", {
        _principal: main,
        _duplicada: o.oportunidade_id,
      });
      if (error) {
        toast.error("Erro ao unificar: " + error.message);
        setSaving(null);
        return;
      }
    }
    setSaving(null);
    toast.success("Oportunidades unificadas — histórico preservado.");
    await load();
    onUnified();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Merge className="h-4 w-4" /> Unificar oportunidades duplicadas</DialogTitle>
          <DialogDescription>
            Escolha a oportunidade principal de cada grupo. Todo o histórico (interações, tarefas, visitas,
            reuniões, ligações, propostas e imóveis) das demais será transferido para ela.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma duplicidade encontrada.</p>
        ) : (
          <div className="space-y-5">
            {grupos.map(([gid, rs]) => (
              <div key={gid} className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{rs[0].cliente_nome}</p>
                  <Badge variant="outline" className="text-[10px]">{rs.length} oportunidades</Badge>
                  <Badge variant="secondary" className="text-[10px]">{rs[0].grupo_tipo === "conta" ? "Conta" : "Lead"}</Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {rs.map((r) => {
                    const isMain = principal[gid] === r.oportunidade_id;
                    return (
                      <Card
                        key={r.oportunidade_id}
                        onClick={() => setPrincipal((p) => ({ ...p, [gid]: r.oportunidade_id }))}
                        className={cn(
                          "p-3 cursor-pointer transition-colors",
                          isMain ? "border-primary ring-1 ring-primary/40" : "hover:border-primary/40 opacity-80"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight line-clamp-2">{r.titulo || "Sem título"}</p>
                          {isMain ? (
                            <Badge className="text-[10px] shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Principal</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] shrink-0">Será mesclada</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 space-y-0.5">
                          <p>Etapa: <span className="text-foreground">{estagioLabel(r.estagio)}</span></p>
                          <p>Resp.: {r.corretor_id ? corretores[r.corretor_id] ?? "—" : "—"}</p>
                          {r.valor_alvo != null && <p>{formatBRL(r.valor_alvo)}</p>}
                          <p>Criada em {new Date(r.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Cuiaba" })}</p>
                          <p>{r.n_interacoes} interações · {r.n_visitas} visitas · {r.n_propostas} propostas</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" disabled={saving === gid} onClick={() => unificar(gid, rs)}>
                    {saving === gid ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Merge className="h-4 w-4 mr-1" />}
                    Unificar grupo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
