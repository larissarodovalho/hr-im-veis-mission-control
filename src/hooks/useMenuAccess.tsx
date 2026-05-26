import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";

export type MenuKey =
  | "dashboard"
  | "leads"
  | "contas"
  | "imoveis"
  | "whatsapp"
  | "reunioes"
  | "ligacoes"
  | "visitas"
  | "agenda"
  | "tarefas"
  | "documentos"
  | "contratos"
  | "relatorios"
  | "newsletter"
  | "usuarios"
  | "configuracoes"
  | "minha-conta";

export const MENU_ITEMS: { key: MenuKey; label: string; group: "CRM" | "Administração" | "Pessoal" }[] = [
  { key: "dashboard", label: "Dashboard", group: "CRM" },
  { key: "leads", label: "Leads", group: "CRM" },
  { key: "contas", label: "Contas", group: "CRM" },
  { key: "imoveis", label: "Imóveis", group: "CRM" },
  { key: "whatsapp", label: "WhatsApp", group: "CRM" },
  { key: "reunioes", label: "Reuniões", group: "CRM" },
  { key: "ligacoes", label: "Ligações", group: "CRM" },
  { key: "visitas", label: "Visitas", group: "CRM" },
  { key: "agenda", label: "Agenda", group: "CRM" },
  { key: "tarefas", label: "Tarefas", group: "CRM" },
  { key: "documentos", label: "Documentos", group: "CRM" },
  { key: "contratos", label: "Contratos", group: "CRM" },
  { key: "relatorios", label: "Relatórios", group: "Administração" },
  { key: "newsletter", label: "Newsletter", group: "Administração" },
  { key: "usuarios", label: "Usuários", group: "Administração" },
  { key: "configuracoes", label: "Configurações", group: "Administração" },
  { key: "minha-conta", label: "Minha conta", group: "Pessoal" },
];

/** Default visibility for a role (mirrors AppLayout's previous logic). */
export function defaultForRole(key: MenuKey, roles: AppRole[]): boolean {
  const isAdmin = roles.includes("admin");
  const isGestor = roles.includes("gestor") || isAdmin;
  const hasCorretor = roles.includes("corretor");
  const hasMarketing = roles.includes("marketing");
  const hasSecretaria = roles.includes("secretaria");

  const marketingOnly = hasMarketing && !isAdmin && !roles.includes("gestor") && !hasCorretor;
  const secretariaOnly =
    hasSecretaria && !isAdmin && !roles.includes("gestor") && !hasCorretor && !hasMarketing;

  if (secretariaOnly) return key === "agenda" || key === "minha-conta";
  if (marketingOnly) return key === "imoveis" || key === "agenda" || key === "minha-conta";

  // Admin/gestor see everything
  if (isAdmin || isGestor) return true;

  // Corretor / other staff: base nav + minha-conta, no admin section
  if (key === "relatorios" || key === "newsletter" || key === "usuarios" || key === "configuracoes") {
    return false;
  }
  return true;
}

export function useMenuAccess() {
  const { user, roles, loading: authLoading } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setOverrides({});
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_menu_access")
      .select("menu_key, allowed")
      .eq("user_id", user.id);
    const map: Record<string, boolean> = {};
    (data ?? []).forEach((r: any) => {
      map[r.menu_key] = r.allowed;
    });
    setOverrides(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const canAccess = useCallback(
    (key: MenuKey): boolean => {
      if (key in overrides) return overrides[key];
      return defaultForRole(key, roles);
    },
    [overrides, roles]
  );

  return { canAccess, loading: loading || authLoading, refresh: load };
}
