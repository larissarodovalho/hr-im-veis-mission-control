import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MetaLeadForm {
  id: string;
  page_id: string;
  form_id: string;
  form_nome: string;
  tags: string[] | null;
  corretor_responsavel_id: string | null;
  etapa_funil_inicial: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetaLeadFormInput {
  page_id: string;
  form_id: string;
  form_nome: string;
  tags?: string[] | null;
  corretor_responsavel_id?: string | null;
  etapa_funil_inicial?: string;
  ativo?: boolean;
}

export function useMetaLeadForms() {
  const { user } = useAuth();
  const [forms, setForms] = useState<MetaLeadForm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("meta_lead_forms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar formulários: " + error.message);
    setForms((data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, fetchAll]);

  const create = async (input: MetaLeadFormInput) => {
    if (!user) return { error: "Não autenticado" };
    const { error } = await supabase
      .from("meta_lead_forms")
      .insert({ ...input, created_by: user.id });
    if (error) { toast.error("Erro ao salvar: " + error.message); return { error }; }
    toast.success("Formulário mapeado");
    await fetchAll();
    return {};
  };

  const update = async (id: string, patch: Partial<MetaLeadFormInput>) => {
    const { error } = await supabase.from("meta_lead_forms").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar: " + error.message); return { error }; }
    toast.success("Atualizado");
    await fetchAll();
    return {};
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("meta_lead_forms").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return { error }; }
    toast.success("Removido");
    await fetchAll();
    return {};
  };

  return { forms, loading, create, update, remove, refetch: fetchAll };
}
