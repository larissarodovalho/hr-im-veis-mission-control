import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, ExternalLink, Trash2, Plus, CalendarRange, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { fetchSharedCalendar, type SharedCalendarSettings } from "@/lib/siteSettings";

type Member = { id: string; email: string; role: "reader" | "writer" | "owner" };
type TeamUser = { user_id: string; nome: string; email: string };

export default function SharedCalendarCard() {
  const [settings, setSettings] = useState<SharedCalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [selected, setSelected] = useState<Record<string, "reader" | "writer">>({});

  const load = async () => {
    setLoading(true);
    const s = await fetchSharedCalendar();
    setSettings(s);
    if (s) await loadMembers();
    setLoading(false);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase.functions.invoke("gcal-shared-calendar", { body: { action: "list_members" } });
    if (error || (data as any)?.error) return;
    setMembers((data as any).members ?? []);
  };

  useEffect(() => { load(); }, []);

  const createCalendar = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gcal-shared-calendar", { body: { action: "create" } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Agenda compartilhada criada!");
      await load();
    } catch (e: any) { toast.error(e.message || "Erro ao criar agenda"); }
    finally { setBusy(false); }
  };

  const togglePushPersonal = async (checked: boolean) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("gcal-shared-calendar", {
        body: { action: "update_push_flag", push_to_personal: checked },
      });
      if (error) throw error;
      setSettings((s) => s ? { ...s, push_to_personal: checked } : s);
      toast.success("Configuração salva");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const openInviteDialog = async () => {
    const { data } = await supabase.from("profiles").select("user_id, nome, email").eq("ativo", true).order("nome");
    const list = ((data as any[]) ?? []).filter((u) => u.email);
    setUsers(list);
    setSelected({});
    setDialogOpen(true);
  };

  const inviteSelected = async () => {
    const toInvite = Object.entries(selected).map(([email, role]) => ({ email, role }));
    if (!toInvite.length) { toast.error("Selecione ao menos um usuário"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gcal-shared-calendar", {
        body: { action: "add_members", members: toInvite },
      });
      if (error) throw error;
      const results = (data as any).results ?? [];
      const ok = results.filter((r: any) => r.ok).length;
      const fail = results.length - ok;
      toast.success(`${ok} convite(s) enviado(s)${fail ? `, ${fail} falha(s)` : ""}`);
      setDialogOpen(false);
      await loadMembers();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const removeMember = async (m: Member) => {
    if (!confirm(`Remover ${m.email} da agenda compartilhada?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("gcal-shared-calendar", {
        body: { action: "remove_member", ruleId: m.id },
      });
      if (error) throw error;
      toast.success("Membro removido");
      await loadMembers();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const backfill = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("gcal-shared-calendar", { body: { action: "backfill" } });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      let msg = `${d.synced} evento(s) enviado(s) para a agenda compartilhada`;
      if (d.failed) msg += `, ${d.failed} falha(s)`;
      if (d.remaining) msg += `. ${d.remaining} restante(s) — clique novamente.`;
      toast.success(msg);
    } catch (e: any) { toast.error(e.message || "Erro ao sincronizar"); }
    finally { setBusy(false); }
  };

  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" /> Agenda compartilhada da equipe
          {settings && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>}
        </CardTitle>
        <CardDescription>
          Uma agenda Google única em que todos os compromissos do CRM aparecem. Convide membros para que eles vejam tudo no celular.
        </CardDescription>
      </CardHeader>
        <CardDescription>
          Uma agenda Google única em que todos os compromissos do CRM aparecem. Convide membros para que eles vejam tudo no celular.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !settings ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Primeiro conecte sua conta Google acima, depois crie a agenda compartilhada. Ela ficará dentro do seu Google e você poderá convidar a equipe.
            </p>
            <Button onClick={createCalendar} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar agenda compartilhada
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Duplicar na agenda pessoal do responsável</Label>
                <p className="text-xs text-muted-foreground">
                  Se ligado, cada evento aparece também na agenda Google pessoal de quem é responsável pelo compromisso.
                </p>
              </div>
              <Switch checked={settings.push_to_personal} onCheckedChange={togglePushPersonal} disabled={busy} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openInviteDialog} disabled={busy}>
                <Users className="h-4 w-4 mr-1" /> Convidar membros
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`https://calendar.google.com/calendar/u/0?cid=${btoa(settings.google_calendar_id)}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir no Google Calendar
                </a>
              </Button>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Membros atuais ({members.length})</p>
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum membro convidado ainda.</p>
              ) : (
                <div className="space-y-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div>
                        <span>{m.email}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {m.role === "owner" ? "Dono" : m.role === "writer" ? "Editar" : "Ver"}
                        </Badge>
                      </div>
                      {m.role !== "owner" && (
                        <Button size="sm" variant="ghost" onClick={() => removeMember(m)} disabled={busy}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Convidar membros para a agenda</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário ativo encontrado.</p>}
            {users.map((u) => {
              const already = memberEmails.has(u.email.toLowerCase());
              const isSelected = selected[u.email] !== undefined;
              return (
                <div key={u.user_id} className="flex items-center gap-3 rounded-md border p-2">
                  <Checkbox
                    checked={isSelected}
                    disabled={already}
                    onCheckedChange={(c) => {
                      setSelected((s) => {
                        const next = { ...s };
                        if (c) next[u.email] = "reader"; else delete next[u.email];
                        return next;
                      });
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {already ? (
                    <Badge variant="outline" className="text-xs">Já é membro</Badge>
                  ) : (
                    <Select
                      value={selected[u.email] ?? "reader"}
                      onValueChange={(v) => setSelected((s) => ({ ...s, [u.email]: v as "reader" | "writer" }))}
                      disabled={!isSelected}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reader">Ver</SelectItem>
                        <SelectItem value="writer">Editar</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={inviteSelected} disabled={busy || Object.keys(selected).length === 0}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enviar convites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
