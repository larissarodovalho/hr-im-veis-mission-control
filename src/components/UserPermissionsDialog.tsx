import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { MENU_ITEMS, defaultForRole, MenuKey } from "@/hooks/useMenuAccess";

type Target = { user_id: string; nome: string | null; email: string | null; roles: AppRole[] };

export function UserPermissionsDialog({
  target,
  onClose,
}: {
  target: Target | null;
  onClose: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    supabase
      .from("user_menu_access")
      .select("menu_key, allowed")
      .eq("user_id", target.user_id)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        (data ?? []).forEach((r: any) => (map[r.menu_key] = r.allowed));
        setOverrides(map);
        setLoading(false);
      });
  }, [target?.user_id]);

  if (!target) return null;

  const effective = (key: MenuKey) =>
    key in overrides ? overrides[key] : defaultForRole(key, target.roles);

  async function toggle(key: MenuKey, value: boolean) {
    if (!target) return;
    setSaving(key);
    const { error } = await supabase
      .from("user_menu_access")
      .upsert(
        { user_id: target.user_id, menu_key: key, allowed: value },
        { onConflict: "user_id,menu_key" }
      );
    setSaving(null);
    if (error) return toast.error(error.message);
    setOverrides((o) => ({ ...o, [key]: value }));
  }

  async function restoreDefaults() {
    if (!target) return;
    if (!confirm("Remover todas as personalizações e voltar ao padrão do papel?")) return;
    const { error } = await supabase.from("user_menu_access").delete().eq("user_id", target.user_id);
    if (error) return toast.error(error.message);
    setOverrides({});
    toast.success("Permissões restauradas ao padrão");
  }

  const groups = ["CRM", "Administração", "Pessoal"] as const;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões de acesso ao menu</DialogTitle>
          <DialogDescription>
            {target.nome ?? target.email} — libere ou bloqueie itens do menu lateral. Itens não
            configurados seguem o padrão do papel.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group} className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  {group}
                </div>
                <div className="space-y-1 border rounded-md divide-y">
                  {MENU_ITEMS.filter((m) => m.group === group).map((item) => {
                    const value = effective(item.key);
                    const isOverride = item.key in overrides;
                    return (
                      <div key={item.key} className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex flex-col">
                          <Label className="text-sm font-medium">{item.label}</Label>
                          <span className="text-[11px] text-muted-foreground">
                            {isOverride ? "Personalizado" : "Padrão do papel"}
                            {(item.key === "usuarios" || item.key === "configuracoes") &&
                              " · só admins acessam"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {value ? "Liberado" : "Bloqueado"}
                          </span>
                          <Switch
                            checked={value}
                            disabled={saving === item.key || target.user_id === currentUser?.id}
                            onCheckedChange={(v) => toggle(item.key, v)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={restoreDefaults} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão do papel
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
