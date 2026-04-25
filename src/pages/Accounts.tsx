import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, ArrowRight, Trash2, Plus, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import NovaContaDialog from "@/components/contas/NovaContaDialog";
import ImportarContasDialog from "@/components/contas/ImportarContasDialog";

export default function Accounts() {
  const { isAdmin, isGestor } = useRole();
  const canDelete = isAdmin || isGestor;
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contas").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAccounts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = accounts.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.nome.toLowerCase().includes(s) || (a.email?.toLowerCase().includes(s) ?? false) || (a.telefone?.includes(search) ?? false);
  });

  const remove = async (id: string, name: string) => {
    const { error } = await supabase.from("contas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Conta "${name}" excluída`);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> Contas
          </h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {accounts.length} clientes convertidos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="pl-8 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Importar Excel
          </Button>
          <Button onClick={() => setNovaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova conta
          </Button>
        </div>
      </header>

      <NovaContaDialog open={novaOpen} onOpenChange={setNovaOpen} onCreated={load} />
      <ImportarContasDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cliente</th><th className="p-3">Tipo</th><th className="p-3">Contato</th>
                <th className="p-3">Convertido em</th><th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Nenhuma conta. Converta um lead.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="p-3"><Link to={`/app/contas/${a.id}`} className="font-medium hover:underline">{a.nome}</Link></td>
                  <td className="p-3"><Badge variant="secondary">{a.tipo}</Badge></td>
                  <td className="p-3 text-muted-foreground text-xs">{a.telefone || a.email || "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/app/contas/${a.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button></Link>
                      {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(a.id, a.nome)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
