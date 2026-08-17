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
  creci?: string | null;
}

/** CRECI jurídico da HR Imóveis (mesmo exibido no site). */
export const CRECI_HR = "CRECI J 18.050";

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

  /** Desenha a logo mantendo a proporção original do arquivo. */
  const desenharLogo = (x: number, y: number, altura: number, align: "left" | "right" = "left") => {
    if (!logo) return { w: 0, h: 0 };
    const largura = altura * (logo.w / logo.h);
    const px0 = align === "right" ? x - largura : x;
    doc.addImage(logo.dataUrl, "PNG", px0, y, largura, altura, undefined, "FAST");
    return { w: largura, h: altura };
  };

  const kicker = (texto: string, x: number, y: number, align: "left" | "right" = "left") => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...CINZA);
    doc.text(texto, x, y, { charSpace: 0.9, align });
    doc.setFont("helvetica", "normal");
  };

  const rodape = (pagina: number, total: number, esquerda = MARGIN) => {
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.2);
    doc.line(esquerda, PAGE_H - 13, PAGE_W - MARGIN, PAGE_H - 13);
    doc.setFontSize(7);
    doc.setTextColor(...CINZA);
    const estreito = esquerda > MARGIN;
    doc.text(
      estreito ? `HR IMÓVEIS · ${CRECI_HR}` : `HR IMÓVEIS · ${CRECI_HR} · hrimoveis.com`,
      esquerda,
      PAGE_H - 8,
    );
    const ref = imovel.codigo ? `REF ${imovel.codigo}` : "";
    if (ref) doc.text(ref, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
    if (!estreito) doc.text(`${pagina}/${total}`, (esquerda + PAGE_W - MARGIN) / 2, PAGE_H - 8, { align: "center" });
  };

  const temGaleria = fotos.length > 1;
  const totalPaginas = 2 + (temGaleria ? 1 : 0);

  // ---------------------------------------------------------------- PÁGINA 1 — CAPA
  const capaW = 165;
  const capa = fotos[0] ? await imagemRecortada(fotos[0], capaW, PAGE_H, 0) : null;
  if (capa) {
    doc.addImage(capa, "JPEG", 0, 0, capaW, PAGE_H);
  } else {
    doc.setFillColor(...AREIA);
    doc.rect(0, 0, capaW, PAGE_H, "F");
  }

  // Degradê suave na borda direita da foto para transitar até o painel
  try {
    const GState = (doc as any).GState;
    if (capa && GState) {
      const faixas = 14;
      for (let i = 0; i < faixas; i++) {
        (doc as any).setGState(new GState({ opacity: 0.06 + (i / faixas) * 0.9 }));
        doc.setFillColor(255, 255, 255);
        doc.rect(capaW - 26 + i * (26 / faixas), 0, 26 / faixas + 0.2, PAGE_H, "F");
      }
      (doc as any).setGState(new GState({ opacity: 1 }));
    }
  } catch { /* degradê é opcional */ }

  const px = capaW + 14;
  const pw = PAGE_W - px - MARGIN;

  desenharLogo(px, 15, 15);
  doc.setFontSize(7);
  doc.setTextColor(...CINZA);
  doc.text(CRECI_HR, px, 36);

  kicker("APRESENTAÇÃO DE IMÓVEL", px, 47);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...PRETO);
  const titulo = doc.splitTextToSize(String(imovel.titulo || "Imóvel"), pw).slice(0, 4);
  doc.text(titulo, px, 58, { lineHeightFactor: 1.25 });
  doc.setFont("helvetica", "normal");

  let y = 58 + titulo.length * 8.2;

  if (localizacao) {
    doc.setFontSize(9.5);
    doc.setTextColor(...CINZA);
    const loc = doc.splitTextToSize(localizacao, pw).slice(0, 2);
    doc.text(loc, px, y + 1, { lineHeightFactor: 1.4 });
    y += loc.length * 5.4 + 3;
  }

  doc.setDrawColor(...CINZA_CLARO);
  doc.setLineWidth(0.3);
  doc.line(px, y + 5, px + pw, y + 5);
  y += 13;

  if (exibirValor && imovel.valor) {
    doc.setFillColor(...AREIA);
    doc.roundedRect(px, y, pw, 22, 2.5, 2.5, "F");
    kicker("VALOR", px + 7, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...PRETO);
    doc.text(brl(imovel.valor), px + 7, y + 17);
    doc.setFont("helvetica", "normal");
    y += 30;
  }

  const chips: string[] = [];
  if (imovel.tipo) chips.push(String(imovel.tipo));
  if (imovel.quartos) chips.push(`${imovel.quartos} quartos`);
  if (imovel.suites) chips.push(`${imovel.suites} suítes`);
  if (imovel.vagas) chips.push(`${imovel.vagas} vagas`);
  const area = imovel.area_util || imovel.area_construida || imovel.area_total;
  if (area) chips.push(`${area} m²`);

  doc.setFontSize(8.2);
  let cx = px;
  let cy = y;
  chips.forEach((c) => {
    const w = doc.getTextWidth(c) + 9;
    if (cx + w > px + pw) {
      cx = px;
      cy += 11;
    }
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, cy, w, 9, 4.5, 4.5, "FD");
    doc.setTextColor(...PRETO);
    doc.text(c, cx + 4.5, cy + 4.6, { baseline: "middle" });
    cx += w + 4;
  });
  y = chips.length ? cy + 15 : y;

  // Cartão do corretor
  const cardH = 26;
  const cardY = Math.max(y, PAGE_H - 22 - cardH);
  doc.setDrawColor(...CINZA_CLARO);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(px, cardY, pw, cardH, 2.5, 2.5, "FD");
  kicker("SEU CORRETOR", px + 7, cardY + 8);
  doc.setFontSize(10.5);
  doc.setTextColor(...PRETO);
  const nomeCorretor = [corretor?.nome, corretor?.creci].filter(Boolean).join("  ·  ") || "HR Imóveis";
  doc.text(doc.splitTextToSize(nomeCorretor, pw - 14)[0], px + 7, cardY + 15);
  const contatoLinha = [corretor?.telefone, corretor?.email].filter(Boolean).join("  ·  ");
  if (contatoLinha) {
    doc.setFontSize(8.5);
    doc.setTextColor(...CINZA);
    doc.text(doc.splitTextToSize(contatoLinha, pw - 14)[0], px + 7, cardY + 21.5);
  }

  rodape(1, totalPaginas, px);

  // ---------------------------------------------------------------- PÁGINA 2 — GALERIA
  if (temGaleria) {
    doc.addPage();
    kicker("GALERIA", MARGIN, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PRETO);
    doc.text(doc.splitTextToSize(String(imovel.titulo || ""), 180)[0], MARGIN, 28);
    doc.setFont("helvetica", "normal");
    desenharLogo(PAGE_W - MARGIN, 14, 13, "right");

    const gap = 5;
    const totalW = PAGE_W - MARGIN * 2;
    const topY = 38;
    const heroW = 160;
    const heroH = 100;
    const lateralW = totalW - heroW - gap;
    const lateralH = (heroH - gap) / 2;
    const baseH = 48;
    const baseW = (totalW - gap * 2) / 3;

    const restantes = fotos.slice(1, 7);
    const slots: Array<{ x: number; y: number; w: number; h: number }> = [
      { x: MARGIN, y: topY, w: heroW, h: heroH },
      { x: MARGIN + heroW + gap, y: topY, w: lateralW, h: lateralH },
      { x: MARGIN + heroW + gap, y: topY + lateralH + gap, w: lateralW, h: lateralH },
      { x: MARGIN, y: topY + heroH + gap, w: baseW, h: baseH },
      { x: MARGIN + baseW + gap, y: topY + heroH + gap, w: baseW, h: baseH },
      { x: MARGIN + (baseW + gap) * 2, y: topY + heroH + gap, w: baseW, h: baseH },
    ];

    for (let i = 0; i < restantes.length; i++) {
      const s = slots[i];
      const dataUrl = await imagemRecortada(restantes[i], s.w, s.h, 2.5);
      if (dataUrl) doc.addImage(dataUrl, "JPEG", s.x, s.y, s.w, s.h);
    }
    rodape(2, totalPaginas);
  }

  // ---------------------------------------------------------------- PÁGINA FINAL — DETALHES
  doc.addPage();
  const colW = (PAGE_W - MARGIN * 2 - 14) / 2;
  const colDir = MARGIN + colW + 14;

  kicker("DETALHES DO IMÓVEL", MARGIN, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PRETO);
  doc.text(doc.splitTextToSize(String(imovel.titulo || ""), colW + 20)[0], MARGIN, 28);
  doc.setFont("helvetica", "normal");
  desenharLogo(PAGE_W - MARGIN, 14, 13, "right");

  const topoConteudo = 38;
  const limiteInferior = PAGE_H - 52;

  // Coluna esquerda — descrição
  doc.setFontSize(9.5);
  const maxLinhasDesc = Math.floor((limiteInferior - topoConteudo - 22) / 5.6);
  const linhasDesc = descricao
    ? doc.splitTextToSize(descricao, colW - 16).slice(0, maxLinhasDesc)
    : ["Fale com o corretor para mais detalhes."];
  const alturaPainel = Math.min(limiteInferior - topoConteudo, 26 + linhasDesc.length * 5.6);
  doc.setFillColor(...AREIA);
  doc.roundedRect(MARGIN, topoConteudo, colW, alturaPainel, 3, 3, "F");
  kicker("SOBRE O IMÓVEL", MARGIN + 8, topoConteudo + 10);
  doc.setFontSize(9.5);
  doc.setTextColor(descricao ? PRETO[0] : CINZA[0], descricao ? PRETO[1] : CINZA[1], descricao ? PRETO[2] : CINZA[2]);
  doc.text(linhasDesc, MARGIN + 8, topoConteudo + 18, { lineHeightFactor: 1.5 });

  // Coluna direita
  let dy = topoConteudo;
  const tituloSecao = (texto: string, yy: number) => {
    kicker(texto, colDir, yy);
    doc.setDrawColor(...CINZA_CLARO);
    doc.setLineWidth(0.3);
    doc.line(colDir, yy + 3, colDir + colW, yy + 3);
  };

  if (condicoes) {
    tituloSecao("CONDIÇÕES COMERCIAIS", dy + 6);
    doc.setFontSize(9.5);
    doc.setTextColor(...PRETO);
    const linhas = doc.splitTextToSize(condicoes, colW).slice(0, 8);
    doc.text(linhas, colDir, dy + 15, { lineHeightFactor: 1.5 });
    dy += 15 + linhas.length * 5.4 + 10;
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
    tituloSecao("CARACTERÍSTICAS", dy + 6);
    const linhaH = 8.4;
    const maxSpecs = Math.max(0, Math.floor((limiteInferior - (dy + 13)) / linhaH));
    doc.setFontSize(9);
    specs.slice(0, Math.min(8, maxSpecs)).forEach(([k, v], i) => {
      const ly = dy + 13 + i * linhaH;
      if (i % 2 === 0) {
        doc.setFillColor(...AREIA);
        doc.rect(colDir - 2, ly - 1, colW + 4, linhaH, "F");
      }
      doc.setTextColor(...CINZA);
      doc.text(k, colDir, ly + 4.4);
      doc.setTextColor(...PRETO);
      doc.text(doc.splitTextToSize(v, colW - 45)[0], colDir + colW, ly + 4.4, { align: "right" });
    });
  }

  // Faixa de contato
  const faixaH = 26;
  const faixaY = PAGE_H - 20 - faixaH;
  doc.setFillColor(...PRETO);
  doc.roundedRect(MARGIN, faixaY, PAGE_W - MARGIN * 2, faixaH, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  kickerBranco(doc, "FALE COM O CORRETOR", MARGIN + 10, faixaY + 9);
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(corretor?.nome || "HR Imóveis", colW)[0], MARGIN + 10, faixaY + 18);
  const contatoDir = [corretor?.telefone, corretor?.email].filter(Boolean).join("  ·  ");
  if (contatoDir) {
    doc.setFontSize(9);
    doc.text(contatoDir, MARGIN + 95, faixaY + 18);
  }
  doc.setFontSize(9);
  doc.text("HR Imóveis · hrimoveis.com", PAGE_W - MARGIN - 10, faixaY + 12, { align: "right" });
  doc.setFontSize(8);
  doc.text(CRECI_HR, PAGE_W - MARGIN - 10, faixaY + 19, { align: "right" });

  rodape(totalPaginas, totalPaginas);

  doc.save(`apresentacao-${slug(imovel.codigo || imovel.titulo)}.pdf`);
}

function kickerBranco(doc: jsPDF, texto: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text(texto, x, y, { charSpace: 0.9 });
  doc.setFont("helvetica", "normal");
}
