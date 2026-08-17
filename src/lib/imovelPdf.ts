// PDF de apresentação do imóvel — A4 paisagem, layout minimalista com a identidade HR Imóveis.
// Usa somente dados públicos (fotos selecionadas, descrição pública, condições, regra de valor/localização).
import jsPDF from "jspdf";
import logoHR from "@/assets/brand/hr-imoveis-logo.png";
import { imagemOtimizada, IMG_GALERIA } from "@/lib/imagemOtimizada";
import { supabase } from "@/integrations/supabase/client";

export interface ApresentacaoConfigPdf {
  fotos_publicas?: string[] | null;
  descricao_publica?: string | null;
  condicoes_comerciais_publicas?: string | null;
  exibir_valor_padrao?: boolean | null;
  localizacao_padrao?: "bairro_cidade" | "cidade" | "oculto" | null;
  video_url?: string | null;
}

export interface CorretorPdf {
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
}

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 16;

// Paleta do CRM
const PRETO: [number, number, number] = [43, 42, 41];
const CINZA: [number, number, number] = [122, 120, 117];
const CINZA_CLARO: [number, number, number] = [226, 224, 220];
const AREIA: [number, number, number] = [248, 247, 245];

/** Carrega a imagem e devolve um JPEG já recortado no formato pedido (cover) com cantos arredondados. */
async function imagemRecortada(
  url: string,
  larguraMm: number,
  alturaMm: number,
  raioMm = 3,
): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = imagemOtimizada(url, IMG_GALERIA);
    });
    const px = 8; // ~200 dpi
    const cw = Math.round(larguraMm * px);
    const ch = Math.round(alturaMm * px);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, ch);

    const r = Math.max(0, raioMm * px);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(cw - r, 0);
    ctx.quadraticCurveTo(cw, 0, cw, r);
    ctx.lineTo(cw, ch - r);
    ctx.quadraticCurveTo(cw, ch, cw - r, ch);
    ctx.lineTo(r, ch);
    ctx.quadraticCurveTo(0, ch, 0, ch - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();

    // cover
    const escala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * escala;
    const dh = img.naturalHeight * escala;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

type ImagemCarregada = { dataUrl: string; w: number; h: number };

async function dataUrlSimples(src: string): Promise<ImagemCarregada | null> {
  try {
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
    return { dataUrl: canvas.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}


const brl = (v: any) =>
  v === null || v === undefined || isNaN(Number(v))
    ? ""
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function slug(s: string) {
  return (s || "imovel")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function carregarConfigApresentacao(imovelId: string): Promise<ApresentacaoConfigPdf> {
  const { data } = await supabase
    .from("imovel_apresentacao_config")
    .select("*")
    .eq("imovel_id", imovelId)
    .maybeSingle();
  return (data as any) ?? {};
}

export async function gerarPdfApresentacao(
  imovel: any,
  cfg: ApresentacaoConfigPdf,
  corretor?: CorretorPdf,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  const fotos = (cfg.fotos_publicas?.length ? cfg.fotos_publicas : imovel.fotos ?? []) as string[];
  const descricao = (cfg.descricao_publica || imovel.descricao || "").trim();
  const condicoes = (cfg.condicoes_comerciais_publicas || "").trim();
  const exibirValor = cfg.exibir_valor_padrao !== false;
  const modoLocal = cfg.localizacao_padrao ?? "bairro_cidade";

  const cidadeUf = [imovel.cidade, imovel.estado].filter(Boolean).join("/");
  const localizacao =
    modoLocal === "oculto" ? "" : modoLocal === "cidade" ? cidadeUf : [imovel.bairro, cidadeUf].filter(Boolean).join(" · ");

  const logo = await dataUrlSimples(logoHR);

  const rodape = (pagina: number, total: number, esquerda = MARGIN) => {
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.2);
    doc.line(esquerda, PAGE_H - 13, PAGE_W - MARGIN, PAGE_H - 13);
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("HR IMÓVEIS · hrimoveis.com", esquerda, PAGE_H - 8);
    const ref = imovel.codigo ? `REF ${imovel.codigo}` : "";
    if (ref) doc.text(ref, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
    doc.text(`${pagina}/${total}`, (esquerda + PAGE_W - MARGIN) / 2, PAGE_H - 8, { align: "center" });
  };

  const temGaleria = fotos.length > 1;
  const totalPaginas = 2 + (temGaleria ? 1 : 0);

  // ---------------------------------------------------------------- PÁGINA 1 — CAPA
  const capaW = 170;
  const capa = fotos[0] ? await imagemRecortada(fotos[0], capaW, PAGE_H, 0) : null;
  if (capa) {
    doc.addImage(capa, "JPEG", 0, 0, capaW, PAGE_H);
  } else {
    doc.setFillColor(...AREIA);
    doc.rect(0, 0, capaW, PAGE_H, "F");
  }

  const px = capaW + 16; // início do painel
  const pw = PAGE_W - px - MARGIN;

  if (logo) doc.addImage(logo, "PNG", px, 18, 34, 34 * 0.28, undefined, "FAST");

  doc.setFontSize(7);
  doc.setTextColor(...CINZA);
  doc.text("APRESENTAÇÃO DE IMÓVEL", px, 46, { charSpace: 0.9 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(21);
  doc.setTextColor(...PRETO);
  const titulo = doc.splitTextToSize(String(imovel.titulo || "Imóvel"), pw);
  doc.text(titulo.slice(0, 4), px, 60);

  let y = 60 + Math.min(titulo.length, 4) * 8.6;

  if (localizacao) {
    doc.setFontSize(9.5);
    doc.setTextColor(...CINZA);
    doc.text(doc.splitTextToSize(localizacao, pw).slice(0, 2), px, y + 2);
    y += 10;
  }

  doc.setDrawColor(...CINZA_CLARO);
  doc.setLineWidth(0.3);
  doc.line(px, y + 4, px + pw, y + 4);
  y += 16;

  if (exibirValor && imovel.valor) {
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("VALOR", px, y - 4, { charSpace: 0.8 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...PRETO);
    doc.text(brl(imovel.valor), px, y + 6);
    doc.setFont("helvetica", "normal");
    y += 18;
  }

  const chips: string[] = [];
  if (imovel.quartos) chips.push(`${imovel.quartos} quartos`);
  if (imovel.suites) chips.push(`${imovel.suites} suítes`);
  if (imovel.vagas) chips.push(`${imovel.vagas} vagas`);
  const area = imovel.area_util || imovel.area_construida || imovel.area_total;
  if (area) chips.push(`${area} m²`);
  if (imovel.tipo) chips.unshift(String(imovel.tipo));

  doc.setFontSize(8.5);
  let cx = px;
  let cy = y;
  chips.forEach((c) => {
    const w = doc.getTextWidth(c) + 8;
    if (cx + w > px + pw) {
      cx = px;
      cy += 11;
    }
    doc.setFillColor(...AREIA);
    doc.setDrawColor(...CINZA_CLARO);
    doc.roundedRect(cx, cy - 5.5, w, 8.5, 4.2, 4.2, "FD");
    doc.setTextColor(...PRETO);
    doc.text(c, cx + 4, cy, { baseline: "middle" });
    cx += w + 4;
  });

  const contatoCapa = [corretor?.nome, corretor?.telefone].filter(Boolean).join("  ·  ");
  if (contatoCapa) {
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("SEU CORRETOR", px, PAGE_H - 32, { charSpace: 0.8 });
    doc.setFontSize(10);
    doc.setTextColor(...PRETO);
    doc.text(doc.splitTextToSize(contatoCapa, pw)[0], px, PAGE_H - 24);
  }

  rodape(1, totalPaginas, px);

  // ---------------------------------------------------------------- PÁGINA 2 — GALERIA
  if (temGaleria) {
    doc.addPage();
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("GALERIA", MARGIN, 20, { charSpace: 0.9 });
    doc.setFontSize(11);
    doc.setTextColor(...PRETO);
    doc.text(doc.splitTextToSize(String(imovel.titulo || ""), 200)[0], MARGIN, 28);
    if (logo) doc.addImage(logo, "PNG", PAGE_W - MARGIN - 28, 16, 28, 28 * 0.28, undefined, "FAST");

    const cols = 3;
    const gap = 5;
    const gw = (PAGE_W - MARGIN * 2 - gap * (cols - 1)) / cols;
    const gh = 71;
    const selecionadas = fotos.slice(1, 7);
    for (let i = 0; i < selecionadas.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const gx = MARGIN + col * (gw + gap);
      const gy = 38 + row * (gh + gap);
      const dataUrl = await imagemRecortada(selecionadas[i], gw, gh, 2.5);
      if (dataUrl) doc.addImage(dataUrl, "JPEG", gx, gy, gw, gh);
    }
    rodape(2, totalPaginas);
  }

  // ---------------------------------------------------------------- PÁGINA FINAL — DETALHES
  doc.addPage();
  const colW = (PAGE_W - MARGIN * 2 - 14) / 2;
  const colDir = MARGIN + colW + 14;

  if (logo) doc.addImage(logo, "PNG", PAGE_W - MARGIN - 28, 16, 28, 28 * 0.28, undefined, "FAST");

  // painel da descrição — altura acompanha o texto
  doc.setFontSize(10);
  const linhasDesc = descricao
    ? doc.splitTextToSize(descricao, colW - 20).slice(0, 20)
    : ["Fale com o corretor para mais detalhes."];
  const alturaPainel = Math.max(70, 34 + linhasDesc.length * 6.2);
  doc.setFillColor(...AREIA);
  doc.roundedRect(MARGIN, 16, colW, alturaPainel, 3, 3, "F");

  doc.setFontSize(7);
  doc.setTextColor(...CINZA);
  doc.text("SOBRE O IMÓVEL", MARGIN + 10, 30, { charSpace: 0.9 });

  doc.setFontSize(10);
  doc.setTextColor(descricao ? PRETO[0] : CINZA[0], descricao ? PRETO[1] : CINZA[1], descricao ? PRETO[2] : CINZA[2]);
  doc.text(linhasDesc, MARGIN + 10, 42, { lineHeightFactor: 1.6 });

  let dy = 36;
  if (condicoes) {
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("CONDIÇÕES COMERCIAIS", colDir, dy - 6, { charSpace: 0.9 });
    doc.setFontSize(10);
    doc.setTextColor(...PRETO);
    const linhas = doc.splitTextToSize(condicoes, colW).slice(0, 12);
    doc.text(linhas, colDir, dy, { lineHeightFactor: 1.6 });
    dy += linhas.length * 5.6 + 14;
  }

  const specs: Array<[string, string]> = [];
  if (imovel.tipo) specs.push(["Tipo", String(imovel.tipo)]);
  if (localizacao) specs.push(["Localização", localizacao]);
  if (imovel.quartos) specs.push(["Quartos", String(imovel.quartos)]);
  if (imovel.suites) specs.push(["Suítes", String(imovel.suites)]);
  if (imovel.vagas) specs.push(["Vagas", String(imovel.vagas)]);
  if (imovel.area_util) specs.push(["Área útil", `${imovel.area_util} m²`]);
  if (imovel.area_total) specs.push(["Área total", `${imovel.area_total} m²`]);
  if (exibirValor && imovel.valor) specs.push(["Valor", brl(imovel.valor)]);

  if (specs.length) {
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    doc.text("CARACTERÍSTICAS", colDir, dy - 6, { charSpace: 0.9 });
    doc.setFontSize(9);
    specs.slice(0, 8).forEach(([k, v], i) => {
      const ly = dy + i * 8;
      doc.setTextColor(...CINZA);
      doc.text(k, colDir, ly);
      doc.setTextColor(...PRETO);
      doc.text(doc.splitTextToSize(v, colW - 45)[0], colDir + colW, ly, { align: "right" });
      doc.setDrawColor(...CINZA_CLARO);
      doc.setLineWidth(0.15);
      doc.line(colDir, ly + 2.6, colDir + colW, ly + 2.6);
    });
  }

  // Faixa de contato
  const faixaY = PAGE_H - 42;
  doc.setFillColor(...PRETO);
  doc.roundedRect(MARGIN, faixaY, PAGE_W - MARGIN * 2, 22, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("FALE COM O CORRETOR", MARGIN + 10, faixaY + 8, { charSpace: 0.8 });
  doc.setFontSize(11);
  const contato = [corretor?.nome, corretor?.telefone].filter(Boolean).join("  ·  ");
  doc.text(doc.splitTextToSize(contato || "HR Imóveis", colW)[0], MARGIN + 10, faixaY + 16);
  doc.setFontSize(9);
  doc.text("HR Imóveis · hrimoveis.com", PAGE_W - MARGIN - 10, faixaY + 16, { align: "right" });

  rodape(totalPaginas, totalPaginas);

  doc.save(`apresentacao-${slug(imovel.codigo || imovel.titulo)}.pdf`);
}
