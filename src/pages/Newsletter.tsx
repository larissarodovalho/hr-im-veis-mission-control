import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Subscriber = {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  status: string;
  created_at: string;
};

export default function Newsletter() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar inscritos");
      setItems([]);
    } else {
      setItems((data ?? []) as Subscriber[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.email.toLowerCase().includes(q) ||
        (i.nome ?? "").toLowerCase().includes(q) ||
        (i.telefone ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const exportCsv = () => {
    const header = ["Nome", "Email", "Telefone", "Status", "Data de inscrição"];
    const rows = filtered.map((i) => [
      i.nome ?? "",
      i.email,
      i.telefone ?? "",
      i.status,
      format(new Date(i.created_at), "dd/MM/yyyy HH:mm"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" /> Newsletter
          </h1>
          <p className="text-sm text-muted-foreground">
            Inscritos do site recebendo informações do mercado imobiliário.
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total de inscritos</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Ativos</p>
          <p className="text-2xl font-bold">
            {items.filter((i) => i.status === "active").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          <p className="text-2xl font-bold">
            {
              items.filter(
                (i) =>
                  new Date(i.created_at).getTime() >
                  Date.now() - 30 * 24 * 60 * 60 * 1000,
              ).length
            }
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Inscrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum inscrito encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{i.nome || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{i.email}</TableCell>
                  <TableCell className="font-mono text-sm">{i.telefone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === "active" ? "default" : "secondary"}>
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(i.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
