import jsPDF from "jspdf";
import logoHR from "@/assets/brand/hr-imoveis-logo.png";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { etapaLabel } from "@/lib/contasFunil";

export type GrupoAcompanhamento = "falha_processo" | "desfecho_cliente" | "em_jogo" | "revisao";

export const GRUPOS_ACOMPANHAMENTO: Array<{ titulo: string; texto: string }> = [
  { titulo: "Falha de processo", texto: "A conta exige correção na rotina interna de atendimento, como ausência de contato ou CRM sem atualização." },
  { titulo: "Desfecho do cliente", texto: "O atendimento teve um encerramento relacionado à resposta, ao interesse ou ao perfil do cliente." },
  { titulo: "Em jogo", texto: "A conta continua ativa no ciclo comercial ou está avançando para uma oportunidade." },
  { titulo: "Revisão", texto: "A conta permanece em uma etapa antiga do CRM e precisa ser revisada pela gestão, sem alteração automática." },
];

export const CLASSIFICACOES_ACOMPANHAMENTO: Array<{ id: string; label: string; grupo: GrupoAcompanhamento; texto: string }> = [
  { id: "falta_followup", label: "Falta de follow-up", grupo: "falha_processo", texto: "O último contato ultrapassou o prazo máximo definido para a análise." },
  { id: "crm_desatualizado", label: "CRM desatualizado", grupo: "falha_processo", texto: "Indica uma conta exigível sem registro suficiente dentro do prazo. A verificação é feita a cada dia útil e os resultados são somados por semana; atualizado e desatualizado fecham 100% da base exigível." },
  { id: "sem_retorno", label: "Sem retorno", grupo: "desfecho_cliente", texto: "O corretor realizou tentativas, mas o cliente não respondeu." },
  { id: "sem_interesse", label: "Sem interesse", grupo: "desfecho_cliente", texto: "O cliente informou que não deseja seguir com o atendimento." },
  { id: "desqualificado", label: "Desqualificado", grupo: "desfecho_cliente", texto: "O contato não atende aos critérios para continuar no funil comercial." },
  { id: "encerrado", label: "Encerrado", grupo: "desfecho_cliente", texto: "O atendimento foi finalizado por outro motivo registrado no CRM." },
  { id: "virando_oportunidade", label: "Oportunidade criada", grupo: "em_jogo", texto: "Existe uma Oportunidade realmente vinculada a esta conta." },
  { id: "oportunidade_futura", label: "Oportunidade futura", grupo: "em_jogo", texto: "A conta foi reservada para uma oportunidade futura, mas ainda não possui Oportunidade criada." },
  { id: "ciclo_andamento", label: "Ciclo em andamento", grupo: "em_jogo", texto: "O atendimento permanece ativo e dentro do prazo esperado entre contatos." },
  { id: "etapa_antiga", label: "Etapa antiga — revisar", grupo: "revisao", texto: "A conta está em uma etapa antiga preservada no histórico e não foi migrada automaticamente." },
];

export const TERMOS_ACOMPANHAMENTO: Array<{ titulo: string; texto: string }> = [
  { titulo: "Período analisado", texto: "Intervalo escolhido no topo da página, no fuso de Cuiabá. A incidência considera somente os dias úteis já decorridos, agrupados por semana." },
  { titulo: "Semana útil", texto: "Bloco de segunda a sexta dentro do período. Semanas parciais no início e no fim entram com os dias que existem." },
  { titulo: "Conta-semana exigível", texto: "Soma, dentro da semana, das contas que em cada dia útil precisavam de contato ou atualização por prazo, tarefa ou próxima ação. A mesma conta pode ser contada em mais de um dia da semana." },
  { titulo: "Prazo máximo entre contatos (dias)", texto: "Quantidade máxima de dias aceita entre um contato e o seguinte. Ao ultrapassá-la, uma conta ativa pode ser diagnosticada como falta de follow-up." },
  { titulo: "Diagnóstico", texto: "Leitura automática do CRM com base em interações, tarefas, etapa do funil e motivo de encerramento." },
  { titulo: "Triagem", texto: "Etapa inicial em que o lead é avaliado antes de seguir para a carteira de um corretor." },
  { titulo: "Conta em carteira", texto: "Cliente que passou da triagem e está sob responsabilidade de um profissional." },
  { titulo: "Oportunidade criada", texto: "Negociação registrada e realmente vinculada a uma conta. Ela é atribuída ao corretor da própria Oportunidade." },
  { titulo: "Oportunidade futura", texto: "Intenção comercial registrada na conta, ainda sem uma Oportunidade criada." },
  { titulo: "Divergência de responsável", texto: "A Oportunidade está com um corretor diferente do responsável atual da Conta. A informação é auditada sem reatribuição automática." },
  { titulo: "Travados por follow-up", texto: "Contas cujo atendimento ultrapassou o prazo máximo definido sem novo contato registrado." },
  { titulo: "Proporção travada", texto: "Percentual da carteira do corretor classificado como falha de processo." },
  { titulo: "Dias médios parado", texto: "Média de dias sem contato entre as contas classificadas como falha de processo." },
  { titulo: "Taxa de incidência", texto: "Em cada caixinha, mostra quantas ocorrências exigíveis receberam aquela classificação e qual percentual representam no período. A evolução é exibida por semana e, em CRM, verde e vermelho fecham 100% da base exigível." },
  { titulo: "Base HR Imóveis", texto: "Contas que pertenciam originalmente à base da gestão da HR Imóveis, mesmo que depois tenham sido distribuídas a um corretor." },
  { titulo: "Marketing", texto: "Contas e leads captados pelos canais de marketing da HR Imóveis." },
  { titulo: "Carteira própria do corretor", texto: "Contas cujo dono original é o próprio corretor, independentemente de quem seja o responsável atual." },
];

interface LinhaCorretorPdf {
  corretor_nome: string;
  total: number;
  falha_processo: number;
  desfecho_cliente: number;
  em_jogo: number;
  revisao: number;
  oportunidades_conduzidas: number;
  falta_followup: number;
  crm_desatualizado: number;
  dias_medios_travadas: number | null;
}

interface LinhaDiariaCorretorPdf {
  responsavel_id: string | null;
  corretor_nome: string;
  conta_dias_exigiveis: number;
  contas_exigiveis: number;
  crm_atualizado: number;
  crm_desatualizado: number;
  falta_followup: number;
  sem_retorno: number;
  sem_interesse: number;
  desqualificado: number;
  encerrado: number;
  virando_oportunidade: number;
  oportunidade_futura: number;
  etapa_antiga: number;
  ciclo_andamento: number;
}

type SerieDiariaPdf = Omit<LinhaDiariaCorretorPdf, "contas_exigiveis" | "historico_nao_determinavel"> & { dia: string };

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
  qtd_oportunidades?: number;
  qtd_divergencias?: number;
  divergencias_responsabilidade?: string | null;
}

interface DivergenciaPdf {
  cliente: string;
  responsavel_conta: string;
  corretor_oportunidade: string;
  estagio: string;
  ativa: boolean;
}

export interface AcompanhamentoPdfDados {
  prazo_dias: number;
  entrada: {
    leads: number;
    desclassificados: number;
    leads_com_conta: number;
    leads_com_oportunidade: number;
    leads_sem_vinculo: number;
    contas_trabalhadas: number;
    oportunidades_conduzidas: number;
    origens: Array<{ origem: string; total: number }>;
  };
  totais: {
    contas: number;
    falha_processo: number;
    desfecho_cliente: number;
    em_jogo: number;
    revisao: number;
    oportunidade_futura: number;
    etapa_antiga: number;
    sem_responsavel_valido: number;
    falta_followup: number;
    dias_medios_travadas: number | null;
  };
  corretores: LinhaCorretorPdf[];
  operacao: { contas_com_interacao: number; interacoes: number; tarefas: number; movimentacoes: number; oportunidades_conduzidas: number };
  divergencias: DivergenciaPdf[];
}

interface GerarPdfParams {
  dados: AcompanhamentoPdfDados;
  dadosDiarios?: {
    dias_uteis: number;
    conta_dias_exigiveis: number;
    corretores: LinhaDiariaCorretorPdf[];
    serie: SerieDiariaPdf[];
  };
  contas: ContaPdf[];
  periodo: string;
  filtroCorretor: string;
  filtroClassificacao: string;
  filtroOrigens: string;
}

interface GerarPdfSelecionadosParams {
  contas: ContaPdf[];
  periodo: string;
  filtroOrigens: string;
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
const GREEN: [number, number, number] = [39, 119, 79];

const percentual = (parte: number, total: number) => total ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}%` : "0,0%";
export const calcularStatusCrm = (total: number, desatualizado: number) => {
  const totalSeguro = Math.max(0, total);
  const desatualizadoSeguro = Math.min(totalSeguro, Math.max(0, desatualizado));
  const atualizado = totalSeguro - desatualizadoSeguro;
  return {
    atualizado,
    desatualizado: desatualizadoSeguro,
    percentualAtualizado: totalSeguro ? (atualizado / totalSeguro) * 100 : 0,
    percentualDesatualizado: totalSeguro ? (desatualizadoSeguro / totalSeguro) * 100 : 0,
  };
};
const classificacaoLabel = (id: string) => CLASSIFICACOES_ACOMPANHAMENTO.find((item) => item.id === id)?.label ?? id;

const CAMPOS_SEMANA = [
  "conta_dias_exigiveis",
  "crm_atualizado",
  "crm_desatualizado",
  "falta_followup",
  "sem_retorno",
  "sem_interesse",
  "desqualificado",
  "encerrado",
  "virando_oportunidade",
  "oportunidade_futura",
  "etapa_antiga",
  "ciclo_andamento",
] as const;

export interface PontoSemanal {
  semana_inicio: string;
  semana_fim: string;
  dias: number;
  responsavel_id: string | null;
  corretor_nome: string;
  conta_dias_exigiveis: number;
  crm_atualizado: number;
  crm_desatualizado: number;
  falta_followup: number;
  sem_retorno: number;
  sem_interesse: number;
  desqualificado: number;
  encerrado: number;
  virando_oportunidade: number;
  oportunidade_futura: number;
  etapa_antiga: number;
  ciclo_andamento: number;
}

const somarDias = (dia: string, quantidade: number) => {
  const data = new Date(`${dia}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + quantidade);
  return data.toISOString().slice(0, 10);
};

/** Segunda-feira (ISO) da semana de um dia no formato YYYY-MM-DD. */
export const inicioDaSemana = (dia: string) => {
  const data = new Date(`${dia}T00:00:00Z`);
  const isoDow = data.getUTCDay() === 0 ? 7 : data.getUTCDay();
  return somarDias(dia, 1 - isoDow);
};

/** Agrupa a série apurada por dia útil em blocos semanais (segunda a sexta). */
export function agruparSeriePorSemana<T extends { dia: string; responsavel_id: string | null; corretor_nome: string }>(
  serie: T[]
): PontoSemanal[] {
  const mapa = new Map<string, PontoSemanal & { _dias: Set<string> }>();
  for (const ponto of serie) {
    const semana = inicioDaSemana(ponto.dia);
    const chave = `${semana}|${ponto.responsavel_id ?? "sem"}`;
    let atual = mapa.get(chave);
    if (!atual) {
      atual = {
        semana_inicio: semana,
        semana_fim: semana,
        dias: 0,
        responsavel_id: ponto.responsavel_id,
        corretor_nome: ponto.corretor_nome,
        conta_dias_exigiveis: 0,
        crm_atualizado: 0,
        crm_desatualizado: 0,
        falta_followup: 0,
        sem_retorno: 0,
        sem_interesse: 0,
        desqualificado: 0,
        encerrado: 0,
        virando_oportunidade: 0,
        oportunidade_futura: 0,
        etapa_antiga: 0,
        ciclo_andamento: 0,
        _dias: new Set<string>(),
      };
      mapa.set(chave, atual);
    }
    const registro = ponto as unknown as Record<string, number | undefined>;
    for (const campo of CAMPOS_SEMANA) atual[campo] += Number(registro[campo] ?? 0);
    atual._dias.add(ponto.dia);
    if (ponto.dia > atual.semana_fim) atual.semana_fim = ponto.dia;
  }
  return Array.from(mapa.values())
    .map(({ _dias, ...resto }) => ({ ...resto, dias: _dias.size }))
    .sort((a, b) => a.semana_inicio.localeCompare(b.semana_inicio) || a.corretor_nome.localeCompare(b.corretor_nome));
}

/** Quantidade de semanas do período que tiveram ao menos um dia útil apurado. */
export const contarSemanasUteis = (serie: Array<{ dia: string }>) =>
  new Set(serie.map((ponto) => inicioDaSemana(ponto.dia))).size;

const ddmm = (dia: string) => dia.slice(5).split("-").reverse().join("/");

/** Rótulo curto da semana, ex.: "01/09 a 05/09". */
export const rotuloSemana = (ponto: { semana_inicio: string; semana_fim: string }) =>
  `${ddmm(ponto.semana_inicio)} a ${ddmm(ponto.semana_fim)}`;

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

export async function gerarPdfAcompanhamento({ dados, dadosDiarios, contas, periodo, filtroCorretor, filtroClassificacao, filtroOrigens }: GerarPdfParams) {
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
  doc.roundedRect(MARGIN, y, CONTENT_W, 29, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Prazo máximo entre contatos: ${dados.prazo_dias} dias`, MARGIN + 6, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Filtro de corretor: ${filtroCorretor}  ·  Classificação: ${filtroClassificacao}`, MARGIN + 6, y + 14);
  doc.text(`Origem da carteira: ${filtroOrigens}`, MARGIN + 6, y + 20);
  doc.text(`${contas.length} contas no detalhamento exportado`, MARGIN + 6, y + 26);
  y += 38;

  const e = dados.entrada;
  const t = dados.totais;
  tituloSecao("01 · Entrada", "Entrada do Marketing e vínculos comprovados");
  tabela(
    ["Leads no período", "Com Conta vinculada", "Com Oportunidade vinculada", "Sem vínculo de Conta"],
    [[String(e.leads), `${percentual(e.leads_com_conta, e.leads)} · ${e.leads_com_conta}`, `${percentual(e.leads_com_oportunidade, e.leads)} · ${e.leads_com_oportunidade}`, `${percentual(e.leads_sem_vinculo, e.leads)} · ${e.leads_sem_vinculo}`]],
    [45.5, 45.5, 45.5, 45.5],
  );
  texto(`Origem: ${e.origens.map((origem) => `${origem.origem} (${origem.total})`).join(" · ") || "sem dados"}. Os vínculos são reais; Contas e Oportunidades do trabalho no período são medidos separadamente.`, CONTENT_W, 8.5);
  y += 4;

  tituloSecao("Atividade no período", "Trabalho registrado no CRM");
  tabela(
    ["Contas trabalhadas", "Contas com interação", "Interações", "Tarefas", "Movimentações", "Oportunidades conduzidas"],
    [[String(e.contas_trabalhadas), String(dados.operacao.contas_com_interacao), String(dados.operacao.interacoes), String(dados.operacao.tarefas), String(dados.operacao.movimentacoes), String(dados.operacao.oportunidades_conduzidas)]],
    [31, 31, 30, 30, 30, 30],
  );

  tituloSecao("02 · Retrato por corretor", "Quanto de cada carteira travou por processo");
  tabela(
    ["Corretor", "Contas", "Oportunidades", "Travadas", "Desfecho", "Em jogo", "Revisão"],
    dados.corretores.map((corretor) => [
      corretor.corretor_nome,
      String(corretor.total),
      String(corretor.oportunidades_conduzidas),
      `${corretor.falha_processo} · ${percentual(corretor.falha_processo, corretor.total)}`,
      String(corretor.desfecho_cliente),
      String(corretor.em_jogo),
      String(corretor.revisao),
    ]),
    [40, 22, 26, 27, 24, 21, 22],
  );

  const corretoresIncidencia = dadosDiarios?.corretores ?? [];
  const serieSemanal = agruparSeriePorSemana(dadosDiarios?.serie ?? []);
  const semanasUteis = contarSemanasUteis(dadosDiarios?.serie ?? []);

  /** Barras semanais empilhadas (verde = ok, vermelho = problema) com percentuais escritos. */
  const barrasSemanaisPdf = (responsavelId: string | null, campoProblema: "crm_desatualizado" | "falta_followup", rotuloOk: string, rotuloProblema: string) => {
    const pontos = serieSemanal.filter((ponto) => ponto.responsavel_id === responsavelId).slice(-10);
    if (!pontos.length) return;
    const alturaBarra = 4;
    const alturaBloco = alturaBarra + 9;
    garantir(alturaBloco + 2);
    const larguraSemana = (CONTENT_W - 42) / pontos.length;
    pontos.forEach((ponto, indice) => {
      const total = ponto.conta_dias_exigiveis;
      const problema = Math.min(total, Math.max(0, Number(ponto[campoProblema] ?? 0)));
      const percOk = total ? ((total - problema) / total) * 100 : 0;
      const percProblema = total ? (problema / total) * 100 : 0;
      const x = MARGIN + 42 + indice * larguraSemana;
      doc.setFillColor(...GREEN);
      doc.rect(x, y, larguraSemana * percOk / 100, alturaBarra, "F");
      doc.setFillColor(...RED);
      doc.rect(x + larguraSemana * percOk / 100, y, larguraSemana * percProblema / 100, alturaBarra, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...INK);
      doc.text(`${percOk.toFixed(0)}% ${rotuloOk.toLowerCase()}`, x, y + alturaBarra + 2.6);
      doc.setTextColor(...RED);
      doc.text(`${percProblema.toFixed(0)}% ${rotuloProblema.toLowerCase()}`, x, y + alturaBarra + 5.4);
      doc.setTextColor(...MUTED);
      doc.text(rotuloSemana(ponto), x, y + alturaBarra + 8.2);
    });
    y += alturaBloco + 2;
  };

  tituloSecao("03 · Taxa de incidência", "Cada problema, lado a lado", `Medição em conta-semana exigível · ${semanasUteis} semanas úteis no período.`);
  CLASSIFICACOES_ACOMPANHAMENTO.forEach((classificacao) => {
    if (classificacao.id === "crm_desatualizado") {
      garantir(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text("CRM atualizado × desatualizado", MARGIN, y);
      y += 5;
      corretoresIncidencia.forEach((corretor) => {
        garantir(10);
        const status = calcularStatusCrm(corretor.conta_dias_exigiveis, corretor.crm_desatualizado);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(corretor.corretor_nome, MARGIN, y);
        doc.setFillColor(...GREEN);
        doc.rect(MARGIN + 42, y - 2.5, (CONTENT_W - 42) * status.percentualAtualizado / 100, 3, "F");
        doc.setFillColor(...RED);
        doc.rect(MARGIN + 42 + (CONTENT_W - 42) * status.percentualAtualizado / 100, y - 2.5, (CONTENT_W - 42) * status.percentualDesatualizado / 100, 3, "F");
        doc.text(`Atualizado ${percentual(status.atualizado, corretor.conta_dias_exigiveis)} (${status.atualizado}) · Desatualizado ${percentual(status.desatualizado, corretor.conta_dias_exigiveis)} (${status.desatualizado})`, MARGIN + 42, y + 4);
        y += 10;
      });
      if (!corretoresIncidencia.length) {
        texto("Sem contas exigíveis nas semanas úteis do período.", CONTENT_W, 7.5);
      }
      y += 2;
      return;
    }
    garantir(13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(classificacao.label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const incidencias = corretoresIncidencia.map((corretor) => {
      const qtd = Number((corretor as unknown as Record<string, string | number | null>)[classificacao.id] ?? 0);
      return `${corretor.corretor_nome}: ${percentual(qtd, corretor.conta_dias_exigiveis)} (${qtd} conta-dias)`;
    });
    const linhas = doc.splitTextToSize(incidencias.join("  ·  ") || "Sem contas no período.", CONTENT_W) as string[];
    doc.text(linhas, MARGIN, y + 4, { lineHeightFactor: 1.3 });
    y += 6 + linhas.length * 3.5;
  });
  if (serieSemanal.length) {
    garantir(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text("Evolução semanal — CRM desatualizado", MARGIN, y);
    y += 5;
    const semanas = Array.from(new Map(serieSemanal.map((item) => [item.semana_inicio, item])).values())
      .sort((a, b) => a.semana_inicio.localeCompare(b.semana_inicio))
      .slice(-8);
    const linhas = corretoresIncidencia.map((corretor) => {
      const valores = semanas.map((semana) => {
        const ponto = serieSemanal.find((item) => item.semana_inicio === semana.semana_inicio && item.responsavel_id === corretor.responsavel_id);
        return ponto ? percentual(ponto.crm_desatualizado, ponto.conta_dias_exigiveis) : "—";
      });
      return [corretor.corretor_nome, ...valores];
    });
    const larguraNome = 38;
    const larguraSemana = (CONTENT_W - larguraNome) / Math.max(1, semanas.length);
    tabela(["Corretor", ...semanas.map((semana) => rotuloSemana(semana))], linhas, [larguraNome, ...semanas.map(() => larguraSemana)]);
  }
  y += 3;

  const piorCorretor = [...dados.corretores].sort((a, b) => b.falha_processo / (b.total || 1) - a.falha_processo / (a.total || 1))[0];
  tituloSecao("04 · O que fazer", "Três leituras");
  texto(`1. Entrada comprovada — ${percentual(e.leads_com_conta, e.leads)} dos leads possuem Conta vinculada e ${percentual(e.leads_com_oportunidade, e.leads)} possuem Oportunidade vinculada. Os demais totais não são tratados como uma jornada única.`, CONTENT_W, 8.5, INK);
  texto(`2. É do escritório ou de um corretor? — Falta de follow-up soma ${t.falta_followup} contas. ${piorCorretor ? `A maior incidência é de ${piorCorretor.corretor_nome} (${percentual(piorCorretor.falha_processo, piorCorretor.total)}), mas as demais carteiras também devem ser acompanhadas.` : "Não há contas classificadas no período."}`, CONTENT_W, 8.5, INK);
  texto(`3. Prazo é o sintoma comum — As contas travadas estão, em média, ${t.dias_medios_travadas ?? "—"} dias sem contato, com prazo máximo configurado em ${dados.prazo_dias} dias.`, CONTENT_W, 8.5, INK);
  texto(`Auditoria — ${t.oportunidade_futura} contas estão como oportunidade futura sem negócio criado, ${t.etapa_antiga} estão em etapa antiga e ${dados.divergencias.length} Oportunidades têm corretor diferente do responsável da Conta.`, CONTENT_W, 8.5, INK);
  y += 3;

  tituloSecao("05 · Conta a conta", "Detalhamento exportado", `${contas.length} contas · filtros: ${filtroCorretor} / ${filtroClassificacao}`);
  tabela(
    ["Cliente", "Corretor", "Classificação", "Etapa", "Interações", "Oportunidades", "Dias sem contato", "Observação"],
    contas.map((conta) => [
      conta.nome,
      conta.corretor_nome,
      `${classificacaoLabel(conta.classificacao)}${conta.manual ? " (manual)" : ""}`,
      etapaLabel(conta.etapa_funil ?? "a_contatar"),
      String(conta.interacoes),
      String(conta.qtd_oportunidades ?? 0),
      String(conta.dias_sem_contato),
      [conta.observacao, conta.divergencias_responsabilidade ? `Divergência: ${conta.divergencias_responsabilidade}` : null, `Último contato: ${fmtDate(conta.ultima_interacao)}`].filter(Boolean).join(" · "),
    ]),
    [30, 24, 28, 22, 14, 18, 17, 29],
  );

  if (dados.divergencias.length) {
    tituloSecao("Auditoria", "Divergências Conta × Oportunidade", "A Oportunidade prevalece e nenhuma responsabilidade é alterada automaticamente.");
    tabela(
      ["Cliente", "Responsável da Conta", "Corretor da Oportunidade", "Etapa", "Situação"],
      dados.divergencias.map((item) => [item.cliente, item.responsavel_conta, item.corretor_oportunidade, item.estagio, item.ativa ? "Ativa" : "Encerrada"]),
      [40, 40, 40, 32, 30],
    );
  }

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
  doc.text(doc.splitTextToSize("A incidência é calculada diariamente, somente em dias úteis e sobre contas exigíveis. Admin e gestor podem reclassificar uma conta; a classificação manual prevalece a partir da data registrada.", CONTENT_W - 10), MARGIN + 5, y + 6, { lineHeightFactor: 1.3 });

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

export async function gerarPdfContasSelecionadas({ contas, periodo, filtroOrigens }: GerarPdfSelecionadosParams) {
  if (!contas.length) throw new Error("Selecione pelo menos um cliente.");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logo = await carregarLogo();
  const pageW = 297;
  const pageH = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 18;

  const novaPagina = () => {
    doc.addPage();
    y = 18;
  };

  const desenharCabecalhoTabela = () => {
    doc.setFillColor(...INK);
    doc.rect(margin, y, contentW, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    const titulos = ["Cliente", "Corretor", "Classificação", "Etapa", "Interações", "Oportunidades", "Dias sem contato", "Último contato", "Observação / auditoria"];
    const larguras = [38, 31, 34, 27, 17, 21, 22, 25, 54];
    let x = margin + 2;
    titulos.forEach((titulo, index) => {
      doc.text(doc.splitTextToSize(titulo, larguras[index] - 4)[0], x, y + 5.7);
      x += larguras[index];
    });
    y += 9;
    return larguras;
  };

  if (logo) doc.addImage(logo, "PNG", margin, 10, 18, 21, undefined, "FAST");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("HR IMÓVEIS · RELATÓRIO GERENCIAL", logo ? 37 : margin, 16);
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("Clientes selecionados", logo ? 37 : margin, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Período: ${periodo}  ·  Gerado em ${fmtDateTime(new Date())}  ·  ${contas.length} clientes`, logo ? 37 : margin, 32);
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.8);
  doc.line(margin, 38, pageW - margin, 38);
  y = 47;

  doc.setFillColor(...SOFT);
  doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  const origemLinhas = doc.splitTextToSize(`Origem da carteira: ${filtroOrigens}`, contentW - 10) as string[];
  doc.text(origemLinhas, margin + 5, y + 6, { lineHeightFactor: 1.25 });
  y += 20;

  let larguras = desenharCabecalhoTabela();
  contas.forEach((conta, rowIndex) => {
    const valores = [
      conta.nome,
      conta.corretor_nome,
      `${classificacaoLabel(conta.classificacao)}${conta.manual ? " (manual)" : ""}`,
      etapaLabel(conta.etapa_funil ?? "a_contatar"),
      String(conta.interacoes),
      String(conta.qtd_oportunidades ?? 0),
      String(conta.dias_sem_contato),
      fmtDate(conta.ultima_interacao),
      [conta.observacao, conta.divergencias_responsabilidade ? `Divergência: ${conta.divergencias_responsabilidade}` : null].filter(Boolean).join(" · ") || "—",
    ];
    const celulas = valores.map((valor, index) => doc.splitTextToSize(valor, larguras[index] - 4) as string[]);
    const rowH = Math.max(9, Math.max(...celulas.map((celula) => celula.length)) * 3.7 + 3);
    if (y + rowH > pageH - 18) {
      novaPagina();
      larguras = desenharCabecalhoTabela();
    }
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...SOFT);
      doc.rect(margin, y, contentW, rowH, "F");
    }
    doc.setDrawColor(...LINE);
    doc.line(margin, y + rowH, pageW - margin, y + rowH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    let x = margin + 2;
    celulas.forEach((celula, index) => {
      doc.text(celula, x, y + 5, { lineHeightFactor: 1.25 });
      x += larguras[index];
    });
    y += rowH;
  });

  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(...LINE);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`HR Imóveis · Clientes selecionados · ${periodo}`, margin, pageH - 7);
    doc.text(`${pagina}/${totalPaginas}`, pageW - margin, pageH - 7, { align: "right" });
  }

  const slug = periodo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  doc.save(`clientes-selecionados-${slug}.pdf`);
}