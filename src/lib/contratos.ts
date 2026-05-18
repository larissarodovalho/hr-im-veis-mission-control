import jsPDF from "jspdf";

export type ContratoVars = Record<string, string | number | null | undefined>;

export function renderTemplate(tpl: string, vars: ContratoVars): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === null || v === undefined || v === "" ? `__${k}__` : String(v);
  });
}

export function formatCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(d: string | Date | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("pt-BR");
}

export function generatePdfBlob(title: string, content: string): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(title, maxW);
  doc.text(titleLines, pageW / 2, margin, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  let y = margin + titleLines.length * 16 + 16;

  const paragraphs = content.split(/\n/);
  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para.length ? para : " ", maxW);
    for (const line of lines) {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    }
    y += 4;
  }

  return doc.output("blob");
}

export const CONTRATO_STATUS: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  gerado: { label: "Gerado", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  enviado_assinatura: { label: "Enviado p/ assinatura", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  assinado: { label: "Assinado", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  cancelado: { label: "Cancelado", color: "bg-red-500/15 text-red-700 dark:text-red-300" },
  expirado: { label: "Expirado", color: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300" },
};
