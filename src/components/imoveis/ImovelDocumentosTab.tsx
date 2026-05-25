import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, FileText, Trash2, ExternalLink } from "lucide-react";

interface DocRow {
  id: string;
  nome: string;
  storage_path: string;
  tamanho_bytes: number | null;
  created_at: string;
}

interface Props {
  imovelId: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

function fmtSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImovelDocumentosTab({ imovelId }: Props) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("imovel_documentos")
      .select("*")
      .eq("imovel_id", imovelId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDocs((data as DocRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (imovelId) load();
  }, [imovelId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    let ok = 0;
    for (const f of Array.from(files)) {
      if (f.type !== "application/pdf") {
        toast.error(`${f.name}: apenas PDF é permitido`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: máximo 10 MB`);
        continue;
      }
      const safe = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${imovelId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("imoveis-docs")
        .upload(path, f, { contentType: "application/pdf", upsert: false });
      if (upErr) {
        toast.error(`${f.name}: ${upErr.message}`);
        continue;
      }
      const { error: insErr } = await supabase.from("imovel_documentos").insert({
        imovel_id: imovelId,
        nome: f.name,
        storage_path: path,
        tamanho_bytes: f.size,
        mime_type: "application/pdf",
        created_by: uid,
      });
      if (insErr) {
        toast.error(`${f.name}: ${insErr.message}`);
        await supabase.storage.from("imoveis-docs").remove([path]);
        continue;
      }
      ok++;
    }
    setUploading(false);
    if (ok) toast.success(`${ok} documento(s) enviado(s)`);
    load();
  };

  const abrir = async (d: DocRow) => {
    const { data, error } = await supabase.storage
      .from("imoveis-docs")
      .createSignedUrl(d.storage_path, 3600);
    if (error || !data) return toast.error(error?.message || "Falha ao gerar link");
    window.open(data.signedUrl, "_blank");
  };

  const remover = async (d: DocRow) => {
    if (!confirm(`Remover "${d.nome}"?`)) return;
    const { error } = await supabase.from("imovel_documentos").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    await supabase.storage.from("imoveis-docs").remove([d.storage_path]);
    toast.success("Documento removido");
    load();
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          {uploading ? "Enviando..." : "Anexar PDFs (máx. 10 MB cada)"}
        </span>
        <input
          type="file"
          multiple
          accept="application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum documento anexado.
        </p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 border border-border rounded-lg p-3 hover:bg-muted/40 transition"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtSize(d.tamanho_bytes)} •{" "}
                  {new Date(d.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => abrir(d)}>
                <ExternalLink className="h-3 w-3 mr-1" /> Abrir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remover(d)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
