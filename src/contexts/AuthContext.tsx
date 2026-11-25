import type React from "react";
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hasActiveProfile, isInactiveUserError } from "@/lib/userStatus";
import { toast } from "sonner";

export type AppRole = "admin" | "gestor" | "corretor" | "marketing" | "secretaria";

interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  cargo: string | null;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isMarketing: boolean;
  isMarketingOnly: boolean;
  isSecretariaOnly: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Reaproveita o mesmo contexto entre recargas a quente para não "perder" o login
// das telas já montadas (erro "useAuth must be used within AuthProvider").
const g = globalThis as unknown as { __hrAuthContext?: React.Context<AuthContextType | undefined> };
const AuthContext = g.__hrAuthContext ?? (g.__hrAuthContext = createContext<AuthContextType | undefined>(undefined));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const activeUserId = useRef<string | null>(null);
  const endingAccess = useRef(false);

  const endInactiveAccess = useCallback(async () => {
    if (endingAccess.current) return;
    endingAccess.current = true;
    activeUserId.current = null;
    setProfile(null);
    setRoles([]);
    setUser(null);
    setSession(null);
    toast.error("Seu acesso ao CRM foi desativado. Entre em contato com um administrador.");
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      endingAccess.current = false;
    }
  }, []);

  const loadUserData = useCallback(async (uid: string) => {
    const [{ data: prof, error: profileError }, { data: rs, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    if (activeUserId.current !== uid || endingAccess.current) return;
    if (prof?.ativo === false || isInactiveUserError(profileError) || isInactiveUserError(roleError)) {
      await endInactiveAccess();
      return;
    }
    if (profileError || roleError) return;
    setProfile(prof as Profile | null);
    setRoles((rs ?? []).map((r: any) => r.role as AppRole));
  }, [endInactiveAccess]);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      activeUserId.current = sess?.user.id ?? null;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer para evitar deadlock no callback
        setTimeout(() => {
          if (mounted) loadUserData(sess.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!mounted) return;
      activeUserId.current = sess?.user.id ?? null;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        await loadUserData(sess.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;
    let subscribedOnce = false;
    const refresh = () => { void loadUserData(uid); };
    // Data-free per-user doorbell remains readable after deactivation to close this session.
    const channel = supabase.channel(`auth:user:${uid}`, { config: { private: true } })
      .on("broadcast", { event: "status_changed" }, refresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (subscribedOnce) refresh();
          subscribedOnce = true;
        }
      });
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id, loadUserData]);


  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  const signOut = async () => {
    activeUserId.current = null;
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, roles, loading,
        isAdmin: hasActiveProfile(profile) && roles.includes("admin"),
        isGestor: hasActiveProfile(profile) && (roles.includes("gestor") || roles.includes("admin")),
        isMarketing: roles.includes("marketing"),
        isMarketingOnly:
          roles.includes("marketing") &&
          !roles.includes("admin") &&
          !roles.includes("gestor") &&
          !roles.includes("corretor"),
        isSecretariaOnly:
          roles.includes("secretaria") &&
          !roles.includes("admin") &&
          !roles.includes("gestor") &&
          !roles.includes("corretor") &&
          !roles.includes("marketing"),
        signOut, refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
