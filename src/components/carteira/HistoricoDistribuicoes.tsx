import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fmtDateTime } from "@/lib/datetime";

interface Operacao {
  id: string; nome: string; modo: string; status: string; gestor_id: string | null;
  total_definido: number | null; total_selecionado: number | null;
  geracoes_automaticas: number | null; ajustes_manuais: number | null;
  filtros: Record<string, unknown> | null; confirmada_em: string | null; created_at: string;
}
interface Lote {
  id: string; operacao_id: string; nome: string; corretor_id: string; modo: string;
  status: string; quantidade_definida: number; quantidade_inicial: number | null;
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho", em_revisao: "Em revisão", confirmada: "Confirmada", cancelada: "Cancelada",
};

const resumoFiltros = (f: Record<string, any> | null) => {
  if (!f) return "Sem filtros";
  const partes: string[] = [];
  const arr = (k: string, label: string) => {
    if (Array.isArray(f[k]) && f[k].length) partes.push(`${label}: ${f[k].join(", ")}`);
  };
  arr("categoria", "Categoria"); arr("etapa_funil", "Etapa"); arr("origem", "Origem");
  arr("temperatura", "Temperatura"); arr("tags", "Tags");
  if (f.cidade) partes.push(`Cidade: ${f.cidade}`);
  if (f.interesse) partes.push(`Interesse: ${f.interesse}`);
  if (f.sem_contato_dias) partes.push(`Sem contato há ${f.sem_contato_dias} dias`);
  if (f.sem_oportunidade_ativa) partes.push("Sem oportunidade ativa");
  return partes.length ? partes.join(" · ") : "Sem filtros";
};

export default function HistoricoDistribuicoes({ profiles }: { profiles: Record<string, string> }) {
  const [ops, setOps] = useState<Operacao[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [aberta, setAberta] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("carteira_operacoes" as any)
        .select("id, nome, modo, status, gestor_id, total_definido, total_selecionado, geracoes_automaticas, ajustes_manuais, filtros, confirmada_em, created_at")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("carteira_lotes" as any)
        .select("id, operacao_id, nome, corretor_id, modo, status, quantidade_definida, quantidade_inicial")
        .order("numero"),
    ]).then(([o, l]) => {
      setOps(((o.data ?? []) as unknown) as Operacao[]);
      setLotes(((l.data ?? []) as unknown) as Lote[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <Card className="p-6 text-muted-foreground">Carregando histórico…</Card>;
  if (!ops.length) return <Card className="p-8 text-center text-muted-foreground">Nenhuma distribuição registrada ainda.</Card>;

  return (
    <Card className="p-4 md:p-6">
      <h2 className="font-semibold mb-3">Histórico de distribuições</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Operação</TableHead><TableHead>Gestor</TableHead><TableHead>Situação</TableHead>
              <TableHead>Definido</TableHead><TableHead>Distribuído</TableHead>
              <TableHead>Ajustes</TableHead><TableHead>Criada em</TableHead><TableHead>Confirmada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ops.map((o) => {
              const meus = lotes.filter((l) => l.operacao_id === o.id);
              const open = aberta === o.id;
              return (
                <>
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setAberta(open ? null : o.id)}>
                    <TableCell>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell>{o.gestor_id ? profiles[o.gestor_id] ?? "—" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "confirmada" ? "default" : "secondary"}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{o.total_definido ?? 0}</TableCell>
                    <TableCell>{o.total_selecionado ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.geracoes_automaticas ?? 0} geração(ões) · {o.ajustes_manuais ?? 0} manual(is)
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.confirmada_em ? fmtDateTime(o.confirmada_em) : "—"}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow key={`${o.id}-det`}>
                      <TableCell colSpan={9} className="bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Filtros usados:</strong> {resumoFiltros(o.filtros as any)}
                        </p>
                        {meus.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhum lote nesta operação.</p>
                        ) : (
                          <div className="space-y-1">
                            {meus.map((l) => (
                              <div key={l.id} className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-medium">{l.nome}</span>
                                <Badge variant="outline">{profiles[l.corretor_id] ?? "Corretor"}</Badge>
                                <span className="text-muted-foreground">
                                  {l.quantidade_inicial ?? 0}/{l.quantidade_definida} contas · modo {l.modo} · {l.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
