import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, User as UserIcon } from "lucide-react";

export default function Users() {
  const { isAdmin, loading: roleLoading } = useRole();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, nome, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role); byUser.set(r.user_id, arr);
    });
    setRows((profiles ?? []).map((p: any) => ({ ...p, roles: byUser.get(p.user_id) ?? [] })));
    setLoading(false);
  };

  if (roleLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  if (!isAdmin) return <div className="p-8"><Card className="p-6 text-center"><Shield className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><p>Apenas administradores.</p></Card></div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Equipe e permissões.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Equipe ({rows.length})</h2>
        {loading ? <p className="text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Papéis</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.user_id}>
                  <TableCell className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" />{r.nome || "Sem nome"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {r.roles.map((role: string) => <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
