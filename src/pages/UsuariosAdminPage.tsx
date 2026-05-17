import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, UserPlus, KeyRound, Trash2, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";

type UiRole = AppRole | "gestor_corretor";

const ROLE_LABELS: Record<UiRole, string> = {
  admin: "Admin",
  gestor: "Gestor",
  corretor: "Corretor",
  gestor_corretor: "Gestor + Corretor",
};

type Row = {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  ativo: boolean;
  created_at: string;
  role: UiRole;
};

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p + "!2";
}

export default function UsuariosAdminPage() {
  const { isAdmin, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", cargo: "",
    role: "corretor" as UiRole, password: genPassword(),
  });

  const [resetTarget, setResetTarget] = useState<Row | null>(null);
  const [newPass, setNewPass] = useState("");

  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", email: "", telefone: "", cargo: "", role: "corretor" as UiRole });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser = new Map<string, Set<AppRole>>();
    (roles ?? []).forEach((r: any) => {
      if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
      rolesByUser.get(r.user_id)!.add(r.role);
    });
    const resolve = (set: Set<AppRole> | undefined): UiRole => {
      if (!set) return "corretor";
      if (set.has("admin")) return "admin";
      if (set.has("gestor") && set.has("corretor")) return "gestor_corretor";
      if (set.has("gestor")) return "gestor";
      return "corretor";
    };
    setRows(((profs ?? []) as any[]).map((p) => ({ ...p, role: resolve(rolesByUser.get(p.user_id)) })));
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Apenas administradores podem gerenciar usuários.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function callAdmin(body: any) {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error("Sessão expirada");
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body, headers: { Authorization: `Bearer ${token}` },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || form.password.length < 8) {
      return toast.error("Preencha nome, email e senha (mín. 8 caracteres)");
    }
    setBusy(true);
    try {
      await callAdmin({ action: "create", ...form });
      toast.success(`Usuário criado! E-mail de boas-vindas enviado para ${form.email}`);
      navigator.clipboard?.writeText(`${form.email} / ${form.password}`).catch(() => {});
      setOpenCreate(false);
      setForm({ nome: "", email: "", telefone: "", cargo: "", role: "corretor", password: genPassword() });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBusy(false); }
  }

  async function handleRoleChange(r: Row, role: AppRole) {
    setBusy(true);
    try {
      await callAdmin({ action: "update_role", user_id: r.user_id, role });
      toast.success(`Papel alterado para ${role}`);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function handleDelete(r: Row) {
    if (r.user_id === user?.id) return toast.error("Você não pode remover a si mesmo");
    if (!confirm(`Remover ${r.nome ?? r.email}? Esta ação é permanente.`)) return;
    setBusy(true);
    try {
      await callAdmin({ action: "delete", user_id: r.user_id });
      toast.success("Usuário removido");
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function handleReset() {
    if (!resetTarget || newPass.length < 8) return toast.error("Senha mín. 8 caracteres");
    setBusy(true);
    try {
      await callAdmin({ action: "reset_password", user_id: resetTarget.user_id, password: newPass });
      toast.success("Senha redefinida");
      navigator.clipboard?.writeText(`${resetTarget.email} / ${newPass}`).catch(() => {});
      setResetTarget(null); setNewPass("");
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  function openEdit(r: Row) {
    setEditTarget(r);
    setEditForm({
      nome: r.nome ?? "", email: r.email ?? "",
      telefone: r.telefone ?? "", cargo: r.cargo ?? "", role: r.role,
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.nome.trim() || !editForm.email.trim()) return toast.error("Nome e email obrigatórios");
    setBusy(true);
    try {
      await callAdmin({ action: "update_profile", user_id: editTarget.user_id, ...editForm });
      toast.success("Usuário atualizado");
      setEditTarget(null);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie quem tem acesso ao CRM</p>
        </div>
        <Dialog open={openCreate} onOpenChange={(o) => { setOpenCreate(o); if (o) setForm((f) => ({ ...f, password: genPassword() })); }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4" /> Novo usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar usuário</DialogTitle>
              <DialogDescription>O acesso será criado com a senha temporária abaixo. Compartilhe com o usuário.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Corretor, Diretor..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Papel *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="corretor">Corretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Senha temporária *</Label>
                  <div className="flex gap-1">
                    <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, password: genPassword() })} title="Gerar nova"><KeyRound className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard?.writeText(form.password); toast.success("Senha copiada"); }} title="Copiar"><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
                <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar usuário"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-medium">{r.nome ?? "—"}{r.user_id === user?.id && <Badge variant="secondary" className="ml-2 text-[10px]">você</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.cargo ?? "—"}</TableCell>
                    <TableCell>
                      <Select value={r.role} onValueChange={(v) => handleRoleChange(r, v as AppRole)} disabled={busy || r.user_id === user?.id}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="corretor">Corretor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setResetTarget(r); setNewPass(genPassword()); }} title="Redefinir senha">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} disabled={r.user_id === user?.id} title="Remover">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>Nova senha para {resetTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            <Button variant="outline" size="icon" onClick={() => setNewPass(genPassword())}><KeyRound className="h-4 w-4" /></Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancelar</Button>
            <Button onClick={handleReset} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>Atualize dados e papel de {editTarget?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome completo *</Label>
                <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} required />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Email *</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={editForm.cargo} onChange={(e) => setEditForm({ ...editForm, cargo: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Papel *</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v as AppRole })}
                  disabled={editTarget?.user_id === user?.id}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
