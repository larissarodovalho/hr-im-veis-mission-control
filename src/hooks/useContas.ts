import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ContaDB {
  id: string;
  nome: string;
  tipo: "PF" | "PJ";
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
  tags: string[] | null;
  lead_id_origem: string | null;
  responsavel_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useContas() {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaDB[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contas" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar contas: " + error.message);
    setContas(((data ?? []) as unknown) as ContaDB[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch();
    const ch = supabase
      .channel("contas-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contas" }, () => fetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetch]);

  const createConta = async (input: Partial<ContaDB>) => {
    if (!user) return { error: "Não autenticado" };
    const payload = { ...input, created_by: user.id, responsavel_id: input.responsavel_id ?? user.id };
    const { data, error } = await supabase
      .from("contas" as any)
      .insert(payload as any)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      return { error };
    }
    toast.success("Conta criada");
    return { data };
  };

  const updateConta = async (id: string, patch: Partial<ContaDB>) => {
    const { data, error } = await supabase
      .from("contas" as any)
      .update(patch as any)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return { error };
    }
    return { data };
  };

  const deleteConta = async (id: string) => {
    const { error } = await supabase.from("contas" as any).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return { error };
    }
    toast.success("Conta removida");
    return {};
  };

  return { contas, loading, createConta, updateConta, deleteConta, refetch: fetch };
}
