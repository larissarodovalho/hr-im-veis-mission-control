import jsPDF from "jspdf";
import letterheadHeader from "@/assets/contratos/letterhead-header.png";
import letterheadFooter from "@/assets/contratos/letterhead-footer.png";

// Cache de DataURLs do papel timbrado
const imageCache: Record<string, { dataUrl: string; w: number; h: number }> = {};

async function loadImage(src: string) {
  if (imageCache[src]) return imageCache[src];
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  imageCache[src] = { dataUrl, w: img.naturalWidth, h: img.naturalHeight };
  return imageCache[src];
}

export type ContratoVars = Record<string, string | number | boolean | null | undefined>;

/**
 * Renderiza template com suporte a:
 *   {{var}}            -> valor de vars.var
 *   {{#if cond}}...{{/if}}
 *   {{#if cond}}...{{else}}...{{/if}}
 * Condicional verdadeiro = valor truthy e diferente de "" ou 0.
 */
export function renderTemplate(tpl: string, vars: ContratoVars): string {
  const isTruthy = (k: string) => {
    const v = vars[k];
    if (v === undefined || v === null) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    return String(v).trim() !== "";
  };

  // Processa {{#if x}}...{{else}}...{{/if}} de forma recursiva (suporta blocos aninhados simples)
  const ifRe = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
  let out = tpl;
  // até 5 passadas para resolver aninhamentos
  for (let i = 0; i < 5; i++) {
    let changed = false;
    out = out.replace(ifRe, (_m, key, ifBlock, elseBlock = "") => {
      changed = true;
      return isTruthy(key) ? ifBlock : elseBlock;
    });
    if (!changed) break;
  }

  // Variáveis simples
  out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    const v = vars[k];
    if (v === undefined || v === null || v === "") return `__${k}__`;
    return String(v);
  });

  return out;
}

export function formatCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumberBR(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return "";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateBR(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR");
  }
  // suporta tanto ISO (AAAA-MM-DD) quanto brasileiro (DD/MM/AAAA)
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (iso.test(d)) {
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("pt-BR");
  }
  if (br.test(d)) {
    const [, dd, mm, yyyy] = d.match(br)!;
    const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("pt-BR");
  }
  return "";
}

export function formatDateLong(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  let dt: Date | null = null;
  if (iso.test(d)) dt = new Date(d + "T00:00:00");
  if (br.test(d)) {
    const [, dd, mm, yyyy] = d.match(br)!;
    dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }
  if (!dt || isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Máscara de data enquanto digita: 22121980 → 22/12/1980 */
export function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ---------- Números por extenso (pt-BR) ----------
const UN = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CEM = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function abaixoMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), d = Math.floor((n % 100) / 10), u = n % 10;
  const parts: string[] = [];
  if (c) parts.push(CEM[c]);
  const resto = n % 100;
  if (resto) {
    if (parts.length) parts.push("e");
    if (resto < 20) parts.push(UN[resto]);
    else {
      parts.push(DEZ[d]);
      if (u) parts.push("e", UN[u]);
    }
  }
  return parts.join(" ");
}

export function numeroPorExtenso(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zero";
  if (n < 1000) return abaixoMil(n);
  if (n < 1_000_000) {
    const mil = Math.floor(n / 1000), r = n % 1000;
    const milStr = mil === 1 ? "mil" : `${abaixoMil(mil)} mil`;
    if (!r) return milStr;
    return `${milStr}${r < 100 || r % 100 === 0 ? " e " : ", "}${abaixoMil(r)}`;
  }
  if (n < 1_000_000_000) {
    const mi = Math.floor(n / 1_000_000), r = n % 1_000_000;
    const miStr = mi === 1 ? "um milhão" : `${abaixoMil(mi)} milhões`;
    if (!r) return miStr;
    return `${miStr} e ${numeroPorExtenso(r)}`;
  }
  return String(n);
}

export function valorPorExtenso(valor: number): string {
  if (!isFinite(valor)) return "";
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  const reaisStr = inteiro === 1 ? "um real" : `${numeroPorExtenso(inteiro)} reais`;
  if (!centavos) return reaisStr;
  const centavosStr = centavos === 1 ? "um centavo" : `${numeroPorExtenso(centavos)} centavos`;
  return `${reaisStr} e ${centavosStr}`;
}

// ---------- PDF ----------
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
      if (y > pageH - margin) { doc.addPage(); y = margin; }
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
