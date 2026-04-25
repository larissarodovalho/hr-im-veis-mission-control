import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InteracaoDB {
  id: string;
  lead_id: string | null;
  conta_id: string | null;
  tipo: "ligacao" | "mensagem" | "visita" | "reuniao" | "email" | "nota";
  resultado: string | null;
  descricao: string | null;
  proxima_acao: string | null;
  agendado_para: string | null;
  created_by: string | null;
  created_at: string;
}

export function useInteracoes(opts: { leadId?: string; contaId?: string }) {
  const { user } = useAuth();
  const { leadId, contaId } = opts;
  const [items, setItems] = useState<InteracaoDB[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!leadId && !contaId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from("interacoes" as any).select("*").order("created_at", { ascending: false });
    if (leadId) q = q.eq("lead_id", leadId);
    if (contaId) q = q.eq("conta_id", contaId);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar interações: " + error.message);
    setItems(((data ?? []) as unknown) as InteracaoDB[]);
    setLoading(false);
  }, [leadId, contaId]);

  useEffect(() => {
    if (!user) return;
    fetch();
    const ch = supabase
      .channel(`interacoes-${leadId ?? contaId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "interacoes" }, () => fetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetch, leadId, contaId]);

  const create = async (input: Partial<InteracaoDB>) => {
    if (!user) return { error: "Não autenticado" };
    const payload = {
      ...input,
      lead_id: leadId ?? input.lead_id ?? null,
      conta_id: contaId ?? input.conta_id ?? null,
      created_by: user.id,
    };
    const { data, error } = await supabase
      .from("interacoes" as any)
      .insert(payload as any)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao registrar: " + error.message);
      return { error };
    }
    toast.success("Interação registrada");
    return { data };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("interacoes" as any).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return { error };
    }
    return {};
  };

  return { items, loading, create, remove, refetch: fetch };
}
