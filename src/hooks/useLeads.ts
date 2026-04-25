import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LeadDB {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  status: string;
  etapa_funil: string;
  qualificacao: string | null;
  valor_estimado: number | null;
  imovel_interesse: string | null;
  observacoes: string | null;
  tags: string[] | null;
  corretor_id: string | null;
  data_entrada: string;
  ultima_interacao: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadDB[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("data_entrada", { ascending: false });
    if (error) toast.error("Erro ao carregar leads: " + error.message);
    setLeads((data as LeadDB[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchLeads();
    const ch = supabase
      .channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchLeads]);

  const createLead = async (input: Partial<LeadDB>) => {
    if (!user) return { error: "Não autenticado" };
    const payload = { ...input, created_by: user.id, corretor_id: input.corretor_id ?? user.id };
    const { data, error } = await supabase.from("leads").insert(payload as any).select().single();
    if (error) { toast.error("Erro ao criar: " + error.message); return { error }; }
    toast.success("Lead criado");
    return { data };
  };

  const updateLead = async (id: string, patch: Partial<LeadDB>) => {
    const { data, error } = await supabase.from("leads").update(patch).eq("id", id).select().single();
    if (error) { toast.error("Erro ao atualizar: " + error.message); return { error }; }
    return { data };
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return { error }; }
    toast.success("Lead removido");
    return {};
  };

  return { leads, loading, createLead, updateLead, deleteLead, refetch: fetchLeads };
}
