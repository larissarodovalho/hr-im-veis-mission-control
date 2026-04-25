import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, BarChart3, Shield } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";

export default function Reports() {
  const { isAdmin, isGestor, loading: roleLoading } = useRole();
  const can = isAdmin || isGestor;
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (can) load(); }, [can]);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: leads }, { data: reunioes }, { data: ligacoes }] = await Promise.all([
      supabase.from("profiles").select("user_id, nome"),
      supabase.from("leads").select("corretor_id, etapa_funil"),
      supabase.from("reunioes").select("corretor_id, status"),
      supabase.from("ligacoes").select("corretor_id, resultado"),
    ]);
    const map = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => {
      map.set(p.user_id, { user_id: p.user_id, name: p.nome || "Sem nome", leads: 0, reunioes: 0, ligacoes: 0, conversoes: 0 });
    });
    (leads ?? []).forEach((l: any) => {
      if (!l.corretor_id) return;
      const s = map.get(l.corretor_id); if (!s) return;
      s.leads++;
      if (l.etapa_funil === "Fechamento") s.conversoes++;
    });
    (reunioes ?? []).forEach((m: any) => {
      if (!m.corretor_id) return;
      const s = map.get(m.corretor_id); if (s) s.reunioes++;
    });
    (ligacoes ?? []).forEach((c: any) => {
      if (!c.corretor_id) return;
      const s = map.get(c.corretor_id); if (s) s.ligacoes++;
    });
    setStats([...map.values()].sort((a, b) => b.leads - a.leads));
    setLoading(false);
  };

  if (roleLoading) return <div className="p-4 md:p-8 text-muted-foreground">Carregando…</div>;
  if (!can) return <div className="p-4 md:p-8"><Card className="p-6 text-center"><Shield className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><p>Apenas administradores acessam relatórios.</p></Card></div>;

  const exportLeads = async () => {
    const { data, error } = await supabase.from("leads").select("*");
    if (error) return toast.error(error.message);
    const csv = Papa.unparse(data ?? []);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data?.length ?? 0} leads exportados`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance da equipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <FileSpreadsheet className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold">Exportar leads</h3>
          <p className="text-sm text-muted-foreground mb-4">Baixe a base completa em CSV.</p>
          <Button onClick={exportLeads}><Download className="h-4 w-4 mr-2" /> Baixar leads.csv</Button>
        </Card>
        <Card className="p-6">
          <BarChart3 className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold">Performance da equipe</h3>
          <p className="text-sm text-muted-foreground mb-4">Resumo por corretor.</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Performance por corretor</h2>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Corretor</TableHead><TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Reuniões</TableHead><TableHead className="text-right">Ligações</TableHead>
              <TableHead className="text-right">Conversões</TableHead><TableHead className="text-right">Taxa</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {stats.map(s => (
                <TableRow key={s.user_id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.leads}</TableCell>
                  <TableCell className="text-right">{s.reunioes}</TableCell>
                  <TableCell className="text-right">{s.ligacoes}</TableCell>
                  <TableCell className="text-right">{s.conversoes}</TableCell>
                  <TableCell className="text-right font-semibold">{s.leads ? ((s.conversoes / s.leads) * 100).toFixed(1) : "0.0"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
