import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MetaAdMapping {
  id: string;
  ad_id: string;
  imovel_id: string;
  nome_anuncio: string | null;
  ativo: boolean;
  created_at: string;
  imovel?: { codigo: string | null; titulo: string; valor: number | null; fotos: string[] | null } | null;
}

export interface MetaAdReferral {
  id: string;
  ad_id: string | null;
  title: string | null;
  body: string | null;
  source_url: string | null;
  thumbnail_url: string | null;
  conversation_id: string | null;
  lead_id: string | null;
  imovel_id_resolvido: string | null;
  created_at: string;
}

export function useMetaAdsMapping() {
  const { user } = useAuth();
  const [mappings, setMappings] = useState<MetaAdMapping[]>([]);
  const [referrals, setReferrals] = useState<MetaAdReferral[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [m, r] = await Promise.all([
      supabase
        .from("meta_ads_imoveis")
        .select("*, imovel:imoveis(codigo, titulo, valor, fotos)")
        .order("created_at", { ascending: false }),
      supabase
        .from("meta_ads_referrals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (m.error) toast.error("Erro ao carregar mapeamentos: " + m.error.message);
    if (r.error) toast.error("Erro ao carregar referrals: " + r.error.message);
    setMappings((m.data as any) ?? []);
    setReferrals((r.data as any) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, fetchAll]);

  const createMapping = async (input: { ad_id: string; imovel_id: string; nome_anuncio?: string | null }) => {
    if (!user) return { error: "Não autenticado" };
    const { data, error } = await supabase
      .from("meta_ads_imoveis")
      .insert({ ...input, created_by: user.id })
      .select("*, imovel:imoveis(codigo, titulo, valor, fotos)")
      .single();
    if (error) { toast.error("Erro ao salvar: " + error.message); return { error }; }
    toast.success("Anúncio vinculado ao imóvel");
    await fetchAll();
    return { data };
  };

  const updateMapping = async (id: string, patch: { ad_id?: string; imovel_id?: string; nome_anuncio?: string | null; ativo?: boolean }) => {
    const { data, error } = await supabase.from("meta_ads_imoveis").update(patch).eq("id", id).select().single();
    if (error) { toast.error("Erro ao atualizar: " + error.message); return { error }; }
    await fetchAll();
    return { data };
  };

  const deleteMapping = async (id: string) => {
    const { error } = await supabase.from("meta_ads_imoveis").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return { error }; }
    toast.success("Vínculo removido");
    await fetchAll();
    return {};
  };

  return { mappings, referrals, loading, createMapping, updateMapping, deleteMapping, refetch: fetchAll };
}
