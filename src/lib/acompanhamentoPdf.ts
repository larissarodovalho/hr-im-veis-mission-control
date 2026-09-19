import jsPDF from "jspdf";
import logoHR from "@/assets/brand/hr-imoveis-logo.png";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { etapaLabel } from "@/lib/contasFunil";

export type GrupoAcompanhamento = "falha_processo" | "desfecho_cliente" | "em_jogo";

export const GRUPOS_ACOMPANHAMENTO: Array<{ titulo: string; texto: string }> = [
  { titulo: "Falha de processo", texto: "A conta exige correção na rotina interna de atendimento, como ausência de contato ou CRM sem atualização." },
  { titulo: "Desfecho do cliente", texto: "O atendimento teve um encerramento relacionado à resposta, ao interesse ou ao perfil do cliente." },
  { titulo: "Em jogo", texto: "A conta continua ativa no ciclo comercial ou está avançando para uma oportunidade." },
];

export const CLASSIFICACOES_ACOMPANHAMENTO: Array<{ id: string; label: string; grupo: GrupoAcompanhamento; texto: string }> = [
  { id: "falta_followup", label: "Falta de follow-up", grupo: "falha_processo", texto: "O último contato ultrapassou o prazo máximo definido para a análise." },
  { id: "crm_desatualizado", label: "CRM desatualizado", grupo: "falha_processo", texto: "A conta não possui registros suficientes de atendimento para demonstrar sua evolução." },
  { id: "sem_retorno", label: "Sem retorno", grupo: "desfecho_cliente", texto: "O corretor realizou tentativas, mas o cliente não respondeu." },
  { id: "sem_interesse", label: "Sem interesse", grupo: "desfecho_cliente", texto: "O cliente informou que não deseja seguir com o atendimento." },
  { id: "desqualificado", label: "Desqualificado", grupo: "desfecho_cliente", texto: "O contato não atende aos critérios para continuar no funil comercial." },
  { id: "encerrado", label: "Encerrado", grupo: "desfecho_cliente", texto: "O atendimento foi finalizado por outro motivo registrado no CRM." },
  { id: "virando_oportunidade", label: "Virando oportunidade", grupo: "em_jogo", texto: "A conta avançou ou está avançando para uma oportunidade de negócio." },
  { id: "ciclo_andamento", label: "Ciclo em andamento", grupo: "em_jogo", texto: "O atendimento permanece ativo e dentro do prazo esperado entre contatos." },
];

export const TERMOS_ACOMPANHAMENTO: Array<{ titulo: string; texto: string }> = [
  { titulo: "Período analisado", texto: "Intervalo escolhido no topo da página. Os indicadores consideram os registros desse período." },
  { titulo: "Prazo máximo entre contatos (dias)", texto: "Quantidade máxima de dias aceita entre um contato e o seguinte. Ao ultrapassá-la, uma conta ativa pode ser diagnosticada como falta de follow-up." },
  { titulo: "Diagnóstico", texto: "Leitura automática do CRM com base em interações, tarefas, etapa do funil e motivo de encerramento." },
  { titulo: "Triagem", texto: "Etapa inicial em que o lead é avaliado antes de seguir para a carteira de um corretor." },
  { titulo: "Conta em carteira", texto: "Cliente que passou da triagem e está sob responsabilidade de um profissional." },
  { titulo: "Oportunidade", texto: "Conta que avançou para uma negociação comercial ativa." },
  { titulo: "Travados por follow-up", texto: "Contas cujo atendimento ultrapassou o prazo máximo definido sem novo contato registrado." },
  { titulo: "Proporção travada", texto: "Percentual da carteira do corretor classificado como falha de processo." },
  { titulo: "Dias médios parado", texto: "Média de dias sem contato entre as contas classificadas como falha de processo." },
  { titulo: "Taxa de incidência", texto: "Em cada caixinha, mostra quantas contas receberam aquela classificação e qual percentual representam dentro da carteira do respectivo corretor." },
];

interface LinhaCorretorPdf {
  corretor_nome: string;
  total: number;
  falha_processo: number;
  desfecho_cliente: number;
  em_jogo: number;
  falta_followup: number;
  crm_desatualizado: number;
  dias_medios_travadas: number | null;
}

interface ContaPdf {
  nome: string;
  corretor_nome: string;
  classificacao: string;
  grupo: GrupoAcompanhamento;
  observacao: string | null;
  manual: boolean;
  etapa_funil: string | null;
  interacoes: number;
  ultima_interacao: string | null;
  dias_sem_contato: number;
}

export interface AcompanhamentoPdfDados {
  prazo_dias: number;
  entrada: {
    leads: number;
    desclassificados: number;
    perdidos_pos_triagem: number;
    contas: number;
    oportunidades: number;
    origens: Array<{ origem: string; total: number }>;
  };
  totais: {
    contas: number;
    falha_processo: number;
    desfecho_cliente: number;
    em_jogo: number;
    falta_followup: number;
    dias_medios_travadas: number | null;
  };
  corretores: LinhaCorretorPdf[];
}

interface GerarPdfParams {
  dados: AcompanhamentoPdfDados;
  contas: ContaPdf[];
  periodo: string;
  filtroCorretor: string;
  filtroClassificacao: string;
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const INK: [number, number, number] = [38, 38, 36];
const MUTED: [number, number, number] = [105, 103, 99];
const LINE: [number, number, number] = [220, 218, 214];
const SOFT: [number, number, number] = [247, 246, 243];
const RED: [number, number, number] = [171, 54, 54];

const percentual = (parte: number, total: number) => total ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";
const classificacaoLabel = (id: string) => CLASSIFICACOES_ACOMPANHAMENTO.find((item) => item.id === id)?.label ?? id;

async function carregarLogo(): Promise<string | null> {
  try {
    const response = await fetch(logoHR);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPdfAcompanhamento({ dados, contas, periodo, filtroCorretor, filtroClassificacao }: GerarPdfParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await carregarLogo();
  let y = 18;

  const novaPagina = () => {
    doc.addPage();
    y = 18;
  };

  const garantir = (altura: number) => {
    if (y + altura > PAGE_H - 18) novaPagina();
  };

  const tituloSecao = (numero: string, titulo: string, subtitulo?: string) => {
    garantir(subtitulo ? 23 : 17);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(numero.toUpperCase(), MARGIN, y);
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(...INK);
    doc.text(titulo, MARGIN, y);
    y += 5;
    if (subtitulo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(subtitulo, MARGIN, y);
      y += 6;
    } else y += 3;
  };

  const texto = (conteudo: string, largura = CONTENT_W, tamanho = 9, cor = MUTED) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(conteudo, largura) as string[];
    garantir(linhas.length * 4.2 + 2);
    doc.text(linhas, MARGIN, y, { lineHeightFactor: 1.35 });
    y += linhas.length * 4.2 + 2;
  };

  const tabela = (headers: string[], rows: string[][], widths: number[]) => {
    const headerH = 8;
    const desenharHeader = () => {
      garantir(headerH + 5);
      doc.setFillColor(...INK);
      doc.rect(MARGIN, y, CONTENT_W, headerH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      let x = MARGIN + 2;
      headers.forEach((header, index) => {
        doc.text(doc.splitTextToSize(header, widths[index] - 4)[0], x, y + 5.1);
        x += widths[index];
      });
      y += headerH;
    };
    desenharHeader();
    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, index) => doc.splitTextToSize(String(cell ?? "—"), widths[index] - 4) as string[]);
      const rowH = Math.max(8, Math.max(...cells.map((cell) => cell.length)) * 3.5 + 3);
      if (y + rowH > PAGE_H - 18) {
        novaPagina();
        desenharHeader();
      }
      if (rowIndex % 2 === 0) {
        doc.setFillColor(...SOFT);
        doc.rect(MARGIN, y, CONTENT_W, rowH, "F");
      }
      doc.setDrawColor(...LINE);
      doc.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...INK);
      let x = MARGIN + 2;
      cells.forEach((cell, index) => {
        doc.text(cell, x, y + 4.5, { lineHeightFactor: 1.25 });
        x += widths[index];
      });
      y += rowH;
    });
    y += 6;
  };

  if (logo) doc.addImage(logo, "PNG", MARGIN, 12, 20, 23, undefined, "FAST");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("HR IMÓVEIS · RELATÓRIO GERENCIAL", logo ? 39 : MARGIN, 18);
  doc.setFontSize(21);
  doc.setTextColor(...INK);
  doc.text("Acompanhamento dos corretores", logo ? 39 : MARGIN, 27);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Período: ${periodo}  ·  Gerado em ${fmtDateTime(new Date())}`, logo ? 39 : MARGIN, 34);
  y = 45;
  doc.setFillColor(...SOFT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 24, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Prazo máximo entre contatos: ${dados.prazo_dias} dias`, MARGIN + 6, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Filtro de corretor: ${filtroCorretor}  ·  Classificação: ${filtroClassificacao}`, MARGIN + 6, y + 14);
  doc.text(`${contas.length} contas no detalhamento exportado`, MARGIN + 6, y + 20);
  y += 33;

  const e = dados.entrada;
  const t = dados.totais;
  const passaram = e.leads - e.desclassificados;
  tituloSecao("01 · Entrada", "Para onde foram os leads");
  tabela(
    ["Leads no período", "Passaram da triagem", "Viraram oportunidade", "Travados por follow-up"],
    [[String(e.leads), `${percentual(passaram, e.leads)} · ${passaram}`, `${percentual(e.oportunidades, e.leads)} · ${e.oportunidades}`, `${percentual(t.falta_followup, e.leads)} · ${t.falta_followup}`]],
    [45.5, 45.5, 45.5, 45.5],
  );
  texto(`Origem: ${e.origens.map((origem) => `${origem.origem} (${origem.total})`).join(" · ") || "sem dados"}. Contas em carteira: ${e.contas}. Perdidos após a triagem: ${e.perdidos_pos_triagem}.`, CONTENT_W, 8.5);
  y += 4;

  tituloSecao("02 · Retrato por corretor", "Quanto de cada carteira travou por processo");
  tabela(
    ["Corretor", "Contas", "Travadas", "Falha de processo", "Desfecho cliente", "Em jogo", "Dias parado"],
    dados.corretores.map((corretor) => [
      corretor.corretor_nome,
      String(corretor.total),
      `${corretor.falha_processo} · ${percentual(corretor.falha_processo, corretor.total)}`,
      String(corretor.falha_processo),
      String(corretor.desfecho_cliente),
      String(corretor.em_jogo),
      corretor.dias_medios_travadas == null ? "—" : String(corretor.dias_medios_travadas),
    ]),
    [39, 18, 29, 27, 27, 20, 22],
  );

  tituloSecao("03 · Taxa de incidência", "Cada problema, lado a lado", "Percentual calculado sobre a carteira de cada corretor.");
  CLASSIFICACOES_ACOMPANHAMENTO.forEach((classificacao) => {
    garantir(13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(classificacao.label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const incidencias = dados.corretores.map((corretor) => {
      const qtd = Number((corretor as unknown as Record<string, string | number | null>)[classificacao.id] ?? 0);
      return `${corretor.corretor_nome}: ${percentual(qtd, corretor.total)} (${qtd})`;
    });
    const linhas = doc.splitTextToSize(incidencias.join("  ·  ") || "Sem contas no período.", CONTENT_W) as string[];
    doc.text(linhas, MARGIN, y + 4, { lineHeightFactor: 1.3 });
    y += 6 + linhas.length * 3.5;
  });
  y += 3;

  const piorCorretor = [...dados.corretores].sort((a, b) => b.falha_processo / (b.total || 1) - a.falha_processo / (a.total || 1))[0];
  tituloSecao("04 · O que fazer", "Três leituras");
  texto(`1. Onde o funil falha — ${percentual(passaram, e.leads)} dos leads passaram da triagem e ${e.perdidos_pos_triagem} foram descartados depois disso. O problema aparece depois que o lead chega ao corretor, não na origem.`, CONTENT_W, 8.5, INK);
  texto(`2. É do escritório ou de um corretor? — Falta de follow-up soma ${t.falta_followup} contas. ${piorCorretor ? `A maior incidência é de ${piorCorretor.corretor_nome} (${percentual(piorCorretor.falha_processo, piorCorretor.total)}), mas as demais carteiras também devem ser acompanhadas.` : "Não há contas classificadas no período."}`, CONTENT_W, 8.5, INK);
  texto(`3. Prazo é o sintoma comum — As contas travadas estão, em média, ${t.dias_medios_travadas ?? "—"} dias sem contato, com prazo máximo configurado em ${dados.prazo_dias} dias.`, CONTENT_W, 8.5, INK);
  y += 3;

  tituloSecao("05 · Conta a conta", "Detalhamento exportado", `${contas.length} contas · filtros: ${filtroCorretor} / ${filtroClassificacao}`);
  tabela(
    ["Cliente", "Corretor", "Classificação", "Etapa", "Interações", "Dias sem contato", "Observação"],
    contas.map((conta) => [
      conta.nome,
      conta.corretor_nome,
      `${classificacaoLabel(conta.classificacao)}${conta.manual ? " (manual)" : ""}`,
      etapaLabel(conta.etapa_funil ?? "a_contatar"),
      String(conta.interacoes),
      String(conta.dias_sem_contato),
      conta.observacao ?? `Último contato: ${fmtDate(conta.ultima_interacao)}`,
    ]),
    [34, 27, 31, 25, 16, 18, 31],
  );

  novaPagina();
  tituloSecao("Legenda", "Entenda este relatório", "Referência para interpretar os números e diagnósticos.");
  const glossario = (itens: Array<{ titulo: string; texto: string }>) => {
    itens.forEach((item) => {
      const linhas = doc.splitTextToSize(item.texto, CONTENT_W - 5) as string[];
      garantir(7 + linhas.length * 3.7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(item.titulo, MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(linhas, MARGIN, y + 4, { lineHeightFactor: 1.3 });
      y += 6 + linhas.length * 3.7;
    });
  };
  glossario(TERMOS_ACOMPANHAMENTO);
  y += 3;
  tituloSecao("Grupos", "Como os diagnósticos são agrupados");
  glossario(GRUPOS_ACOMPANHAMENTO);
  novaPagina();
  tituloSecao("Classificações", "O que significa cada caixinha");
  glossario(CLASSIFICACOES_ACOMPANHAMENTO.map(({ label, texto: descricao }) => ({ titulo: label, texto: descricao })));
  garantir(18);
  doc.setFillColor(...SOFT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize("A classificação é calculada a partir dos registros do CRM. Admin e gestor podem reclassificar uma conta manualmente; nesse caso, a classificação manual prevalece.", CONTENT_W - 10), MARGIN + 5, y + 6, { lineHeightFactor: 1.3 });

  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(...LINE);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`HR Imóveis · Acompanhamento · ${periodo}`, MARGIN, PAGE_H - 7);
    doc.text(`${pagina}/${totalPaginas}`, PAGE_W - MARGIN, PAGE_H - 7, { align: "right" });
    if (pagina === 1) {
      doc.setDrawColor(...RED);
      doc.setLineWidth(0.8);
      doc.line(MARGIN, 39, PAGE_W - MARGIN, 39);
    }
  }

  const slug = periodo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  doc.save(`acompanhamento-corretores-${slug}.pdf`);
}