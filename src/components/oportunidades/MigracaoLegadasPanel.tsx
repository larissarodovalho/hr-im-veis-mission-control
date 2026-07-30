import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, ChevronDown, ChevronUp, Database } from "lucide-react";
import { etapaLabel } from "@/lib/contasFunil";

const ETAPAS_AUTO = ["visita", "proposta", "fechado"];
const ETAPAS_MANUAL = ["captacao_imovel", "reuniao", "permuta", "perdido"];

const ACAO_SUGERIDA: Record<string, string> = {
  visita: "Migrar → Visita agendada",
  proposta: "Migrar → Proposta",
  fechado: "Migrar → Ganha + vincular fechamento",
  captacao_imovel: "Manual — segue no fluxo de Captação",
  reuniao: "Manual — analisar contexto (diagnóstico ou captação)",
  permuta: "Manual — permuta é condição, não etapa",
  perdido: "Manual — permanece Oportunidade futura",
};

/**
 * Relatório prévio das contas em etapas comerciais legadas + migração idempotente
 * (Visita, Proposta e Fechado). Reunião, Captação, Permuta e Oportunidade futura
 * ficam listadas para decisão manual — nunca migradas automaticamente.
 */
export default function MigracaoLegadasPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: contas } = await supabase
      .from("contas")
      .select("id,nome,categoria,etapa_funil,responsavel_id,created_at")
      .in("etapa_funil", [...ETAPAS_AUTO, ...ETAPAS_MANUAL])
      .order("etapa_funil");
    const ids = (contas ?? []).map((c: any) => c.id);
    let comOp = new Set<string>();
    if (ids.length) {
      const { data: ops } = await supabase.from("oportunidades").select("conta_id").in("conta_id", ids);
      comOp = new Set((ops ?? []).map((o: any) => o.conta_id));
    }
    const { data: profiles } = await supabase.from("profiles").select("user_id,nome");
    const pMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => { if (p.user_id) pMap[p.user_id] = p.nome || "—"; });
    setRows((contas ?? []).map((c: any) => ({ ...c, temOportunidade: comOp.has(c.id), responsavel: pMap[c.responsavel_id] ?? "—" })));
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const migrar = async () => {
    setRunning(true);
    const { data, error } = await supabase.rpc("migrar_contas_legadas_oportunidades");
    setRunning(false);
    if (error) return toast.error(error.message);
    const n = (data ?? []).length;
    toast.success(n ? `${n} oportunidade(s) criada(s) a partir das etapas legadas` : "Nada a migrar — já está tudo migrado");
    load();
  };

  const migraveis = rows.filter((r) => ETAPAS_AUTO.includes(r.etapa_funil) && !r.temOportunidade);

  return (
    <Card className="p-4 space-y-3">
      <button className="w-full flex items-center justify-between text-left" onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2 text-sm font-medium">
          <Database className="h-4 w-4 text-primary" /> Migração das etapas comerciais legadas de Contas
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <span>
              Migração automática apenas para <strong>Visita</strong>, <strong>Proposta</strong> e <strong>Fechado</strong>
              (idempotente: não duplica oportunidades nem fechamentos). Reunião, Captação/Imóvel, Permuta e
              Oportunidade futura exigem análise manual e nunca são migradas sozinhas.
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {rows.length} conta(s) em etapas legadas · {migraveis.length} pronta(s) para migração
                </p>
                <Button size="sm" onClick={migrar} disabled={running || migraveis.length === 0}>
                  {running ? "Migrando…" : `Migrar legados (${migraveis.length})`}
                </Button>
              </div>
              <div className="border rounded-md overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conta</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Etapa legada</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Oportunidade</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.nome}</TableCell>
                        <TableCell className="capitalize">{r.categoria ?? "—"}</TableCell>
                        <TableCell>{etapaLabel(r.etapa_funil)}</TableCell>
                        <TableCell>{r.responsavel}</TableCell>
                        <TableCell>
                          {r.temOportunidade
                            ? <Badge variant="secondary" className="text-[10px]">Já possui</Badge>
                            : <Badge variant="outline" className="text-[10px]">Não</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ACAO_SUGERIDA[r.etapa_funil] ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma conta em etapa legada</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
