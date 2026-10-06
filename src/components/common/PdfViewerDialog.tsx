import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bucket: string;
  path: string | null;
  title?: string;
  fileName?: string;
}

/** Mostra o PDF dentro do CRM (canvas), sem abrir nova aba — evita bloqueio de extensões. */
export function PdfViewerDialog({ open, onOpenChange, bucket, path, title = "Documento", fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "erro">("idle");

  useEffect(() => {
    if (!open || !path) return;
    let cancel = false;
    setStatus("loading");
    setBlob(null);
    (async () => {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (cancel) return;
      if (error || !data) { setStatus("erro"); return; }
      setBlob(data);
      try {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await data.arrayBuffer()) }).promise;
        const el = containerRef.current;
        if (!el || cancel) return;
        el.innerHTML = "";
        const largura = el.clientWidth || 800;
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (largura / base.width) * (window.devicePixelRatio || 1);
          const vp = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = "100%";
          canvas.className = "mb-3 rounded border bg-background shadow-sm";
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp, canvas } as any).promise;
          if (cancel) return;
        }
        setStatus("ok");
      } catch {
        if (!cancel) setStatus("erro");
      }
    })();
    return () => { cancel = true; };
  }, [open, path, bucket]);

  const baixar = () => {
    if (!blob) return;
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || path?.split("/").pop() || "documento.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
          <DialogTitle>{title}</DialogTitle>
          <Button size="sm" variant="outline" onClick={baixar} disabled={!blob}>
            <Download className="h-4 w-4 mr-1" /> Baixar PDF
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-muted/40 rounded p-3">
          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando documento…
            </div>
          )}
          {status === "erro" && (
            <p className="py-10 text-center text-sm text-destructive">
              Não foi possível abrir o arquivo. Ele pode ter sido removido.
            </p>
          )}
          <div ref={containerRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
