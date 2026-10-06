import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Baixa o arquivo pelo cliente do app e abre como blob local.
 * Evita navegar para o domínio do storage (bloqueado por extensões: ERR_BLOCKED_BY_CLIENT).
 */
export async function abrirArquivoStorage(bucket: string, path: string, nome?: string) {
  // Abre a aba já no clique para não ser barrada como pop-up
  const win = window.open("", "_blank");
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    win?.close();
    toast.error("Não foi possível abrir o arquivo. Ele pode ter sido removido.");
    return;
  }
  const isPdf = path.toLowerCase().endsWith(".pdf");
  const blob = isPdf && data.type !== "application/pdf" ? new Blob([data], { type: "application/pdf" }) : data;
  const url = URL.createObjectURL(blob);
  if (win) {
    win.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = nome || path.split("/").pop() || "arquivo";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
