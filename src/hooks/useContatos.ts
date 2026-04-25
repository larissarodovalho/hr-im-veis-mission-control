import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ContatoDB {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  tipo: string;
  origem: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  observacoes: string | null;
  tags: string[] | null;
  responsavel_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useContatos() {
  const { user } = useAuth();
  const [contatos, setContatos] = useState<ContatoDB[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contatos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar contatos: " + error.message);
    setContatos((data as ContatoDB[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch();
    const ch = supabase
      .channel("contatos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contatos" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetch]);

  const createContato = async (input: Partial<ContatoDB>) => {
    if (!user) return { error: "Não autenticado" };
    const payload = { ...input, created_by: user.id, responsavel_id: input.responsavel_id ?? user.id };
    const { data, error } = await supabase.from("contatos").insert(payload as any).select().single();
    if (error) { toast.error("Erro ao criar: " + error.message); return { error }; }
    toast.success("Contato criado");
    return { data };
  };

  const updateContato = async (id: string, patch: Partial<ContatoDB>) => {
    const { data, error } = await supabase.from("contatos").update(patch).eq("id", id).select().single();
    if (error) { toast.error("Erro ao atualizar: " + error.message); return { error }; }
    return { data };
  };

  const deleteContato = async (id: string) => {
    const { error } = await supabase.from("contatos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return { error }; }
    toast.success("Contato removido");
    return {};
  };

  return { contatos, loading, createContato, updateContato, deleteContato, refetch: fetch };
}
