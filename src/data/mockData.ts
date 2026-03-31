// Mock data for HR Imóveis Mission Control Dashboard

export const leadsPerDay = [
  { day: "Seg", meta: 4, google: 2 },
  { day: "Ter", meta: 6, google: 3 },
  { day: "Qua", meta: 3, google: 5 },
  { day: "Qui", meta: 7, google: 4 },
  { day: "Sex", meta: 5, google: 6 },
  { day: "Sáb", meta: 8, google: 3 },
  { day: "Dom", meta: 2, google: 1 },
];

export const budgetDistribution = [
  { name: "Meta Ads", value: 1800, fill: "hsl(224, 73%, 40%)" },
  { name: "Google Ads", value: 1200, fill: "hsl(43, 76%, 52%)" },
];

export const overviewCards = {
  leadsSemana: 35,
  custoPorLead: 85.71,
  budgetUsado: 2400,
  budgetTotal: 3000,
  visitasAgendadas: 8,
  imoveisAtivos: 24,
  postsPublicados: 12,
};

export type LeadEtapa = "Lead recebido" | "Qualificado" | "Visita agendada" | "Visita realizada" | "Proposta" | "Fechamento";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  canal: "Meta Ads" | "Google Ads" | "Indicação" | "Orgânico";
  corretor: "Hans" | "Rafael" | "Gabriel";
  origem: "Carteira" | "Marketing";
  etapa: LeadEtapa;
  dataEntrada: string;
  historico: { data: string; mensagem: string; remetente: "Sofia" | "Lead" }[];
}

export const leads: Lead[] = [
  // Hans Rodovalho
  {
    id: "1", nome: "Carlos Eduardo Silva", telefone: "(66) 99901-2345", canal: "Meta Ads",
    corretor: "Hans", origem: "Marketing", etapa: "Visita agendada", dataEntrada: "2025-03-24",
    historico: [
      { data: "2025-03-24 10:32", mensagem: "Olá Carlos! Sou a Sofia, assistente virtual da HR Imóveis. Vi que você se interessou pelo Residencial Lago Azul. Posso te ajudar?", remetente: "Sofia" },
      { data: "2025-03-24 10:35", mensagem: "Oi! Sim, quero saber o valor e se tem lotes maiores.", remetente: "Lead" },
      { data: "2025-03-24 10:36", mensagem: "Claro! Temos lotes de 360m² a 600m² no Lago Azul, a partir de R$580.000. Posso agendar uma visita com o Hans para esta semana?", remetente: "Sofia" },
      { data: "2025-03-24 10:40", mensagem: "Pode ser quinta às 15h.", remetente: "Lead" },
    ],
  },
  {
    id: "3", nome: "Roberto Nascimento", telefone: "(66) 99734-1122", canal: "Meta Ads",
    corretor: "Hans", origem: "Marketing", etapa: "Qualificado", dataEntrada: "2025-03-25",
    historico: [
      { data: "2025-03-25 09:00", mensagem: "Bom dia Roberto! Sou a Sofia, assistente da HR Imóveis. Vi seu interesse em imóveis premium. Qual sua faixa de investimento?", remetente: "Sofia" },
      { data: "2025-03-25 09:05", mensagem: "Bom dia! Estou pensando entre 1 e 2 milhões.", remetente: "Lead" },
    ],
  },
  {
    id: "5", nome: "Fernando Almeida", telefone: "(66) 99556-7788", canal: "Google Ads",
    corretor: "Hans", origem: "Marketing", etapa: "Lead recebido", dataEntrada: "2025-03-27",
    historico: [
      { data: "2025-03-27 11:20", mensagem: "Olá Fernando! Sou a Sofia da HR Imóveis. Obrigada pelo interesse! Está buscando imóvel para moradia ou investimento?", remetente: "Sofia" },
    ],
  },
  {
    id: "7", nome: "Thiago Barbosa", telefone: "(66) 99378-1234", canal: "Orgânico",
    corretor: "Hans", origem: "Carteira", etapa: "Visita agendada", dataEntrada: "2025-03-26",
    historico: [
      { data: "2025-03-26 13:00", mensagem: "Oi Thiago! Sou a Sofia. Vi que você acompanha a HR Imóveis. Está pensando em investir em imóveis?", remetente: "Sofia" },
      { data: "2025-03-26 13:10", mensagem: "Sim, quero conhecer terrenos no Eco Park.", remetente: "Lead" },
    ],
  },
  // Rafael Filimberti
  {
    id: "2", nome: "Ana Paula Ferreira", telefone: "(66) 99812-6789", canal: "Google Ads",
    corretor: "Rafael", origem: "Marketing", etapa: "Proposta", dataEntrada: "2025-03-20",
    historico: [
      { data: "2025-03-20 14:10", mensagem: "Boa tarde, Ana Paula! Aqui é a Sofia da HR Imóveis. Você pesquisou sobre casas de alto padrão em Sinop?", remetente: "Sofia" },
      { data: "2025-03-20 14:15", mensagem: "Sim! Estou buscando algo acima de 300m², condomínio fechado.", remetente: "Lead" },
      { data: "2025-03-20 14:17", mensagem: "Perfeito! Temos opções incríveis no Aquarela e no Damha. O Rafael pode te apresentar. Quando fica bom?", remetente: "Sofia" },
    ],
  },
  {
    id: "6", nome: "Juliana Mendes", telefone: "(66) 99467-9900", canal: "Meta Ads",
    corretor: "Rafael", origem: "Marketing", etapa: "Fechamento", dataEntrada: "2025-03-10",
    historico: [
      { data: "2025-03-10 08:30", mensagem: "Bom dia Juliana! Vi que se interessou pelo Residencial Damha III. Gostaria de saber mais?", remetente: "Sofia" },
      { data: "2025-03-10 08:45", mensagem: "Sim! Quero agendar visita o mais rápido possível.", remetente: "Lead" },
      { data: "2025-03-15 17:00", mensagem: "Juliana, o Rafael confirmou que a proposta foi aceita! Parabéns pelo novo lar! 🎉", remetente: "Sofia" },
    ],
  },
  {
    id: "9", nome: "Igor Santos", telefone: "(66) 99123-4455", canal: "Indicação",
    corretor: "Rafael", origem: "Carteira", etapa: "Visita realizada", dataEntrada: "2025-03-22",
    historico: [
      { data: "2025-03-22 10:00", mensagem: "Olá Igor! A Sofia aqui da HR Imóveis. O Paulo indicou você — está buscando casa ou terreno?", remetente: "Sofia" },
      { data: "2025-03-22 10:08", mensagem: "Casa! Procuro algo a partir de 250m² em condomínio.", remetente: "Lead" },
      { data: "2025-03-22 10:10", mensagem: "Ótimo! O Rafael tem a opção perfeita no Aquarela. Que tal visitarmos sexta?", remetente: "Sofia" },
      { data: "2025-03-22 10:15", mensagem: "Combinado!", remetente: "Lead" },
    ],
  },
  {
    id: "10", nome: "Beatriz Lima", telefone: "(66) 99234-5566", canal: "Indicação",
    corretor: "Rafael", origem: "Carteira", etapa: "Qualificado", dataEntrada: "2025-03-28",
    historico: [
      { data: "2025-03-28 14:00", mensagem: "Boa tarde Beatriz! Sou a Sofia da HR Imóveis. A Camila falou que você busca investimento imobiliário?", remetente: "Sofia" },
      { data: "2025-03-28 14:12", mensagem: "Isso! Quero um terreno de até 500m² para construir.", remetente: "Lead" },
    ],
  },
  // Gabriel Souza
  {
    id: "4", nome: "Mariana Costa", telefone: "(66) 99645-3344", canal: "Indicação",
    corretor: "Gabriel", origem: "Carteira", etapa: "Visita realizada", dataEntrada: "2025-03-18",
    historico: [
      { data: "2025-03-18 16:00", mensagem: "Olá Mariana! A Fernanda indicou você para conhecer nossos empreendimentos. Posso ajudar?", remetente: "Sofia" },
      { data: "2025-03-18 16:10", mensagem: "Sim! Ela falou muito bem. Quero ver casas prontas no Aquarela.", remetente: "Lead" },
    ],
  },
  {
    id: "8", nome: "Patrícia Oliveira", telefone: "(66) 99289-5566", canal: "Meta Ads",
    corretor: "Gabriel", origem: "Marketing", etapa: "Qualificado", dataEntrada: "2025-03-26",
    historico: [
      { data: "2025-03-26 15:30", mensagem: "Boa tarde Patrícia! Aqui é a Sofia. Você se interessou pelas casas do Aquarela. Posso passar mais detalhes?", remetente: "Sofia" },
      { data: "2025-03-26 15:40", mensagem: "Por favor! Qual o valor do m² e condições de pagamento?", remetente: "Lead" },
    ],
  },
  {
    id: "11", nome: "Diego Carvalho", telefone: "(66) 99345-6677", canal: "Google Ads",
    corretor: "Gabriel", origem: "Marketing", etapa: "Proposta", dataEntrada: "2025-03-21",
    historico: [
      { data: "2025-03-21 09:30", mensagem: "Olá Diego! Sou a Sofia da HR Imóveis. Você pesquisou sobre terrenos premium em Sinop. Posso ajudar?", remetente: "Sofia" },
      { data: "2025-03-21 09:40", mensagem: "Sim! Quero um lote grande, acima de 600m².", remetente: "Lead" },
      { data: "2025-03-21 09:42", mensagem: "Temos o Terreno Premium Nações com 800m² por R$1.200.000. O Gabriel pode agendar uma visita. Quando fica bom?", remetente: "Sofia" },
    ],
  },
  {
    id: "12", nome: "Sabrina Nunes", telefone: "(66) 99456-7788", canal: "Orgânico",
    corretor: "Gabriel", origem: "Carteira", etapa: "Lead recebido", dataEntrada: "2025-03-29",
    historico: [
      { data: "2025-03-29 11:00", mensagem: "Oi Sabrina! Sou a Sofia. Vi que você curtiu várias publicações do Gabriel. Está pensando em investir?", remetente: "Sofia" },
    ],
  },
];

export const funnelData = [
  { etapa: "Lead recebido", quantidade: 35, fill: "hsl(224, 73%, 40%)" },
  { etapa: "Qualificado", quantidade: 22, fill: "hsl(224, 73%, 50%)" },
  { etapa: "Visita agendada", quantidade: 14, fill: "hsl(43, 76%, 52%)" },
  { etapa: "Visita realizada", quantidade: 10, fill: "hsl(43, 76%, 62%)" },
  { etapa: "Proposta", quantidade: 5, fill: "hsl(160, 60%, 45%)" },
  { etapa: "Fechamento", quantidade: 2, fill: "hsl(160, 60%, 35%)" },
];

export interface FunnelEtapaData {
  etapa: LeadEtapa;
  quantidade: number;
  fill: string;
}

export interface FunnelCorretor {
  corretor: string;
  corretorId: string;
  stats: {
    totalLeads: number;
    taxaConversao: string;
    pipelineEmNegociacao: number;
  };
  carteira: FunnelEtapaData[];
  marketing: FunnelEtapaData[];
}

export const funnelPorCorretor: FunnelCorretor[] = [
  {
    corretor: "Hans Rodovalho",
    corretorId: "hans",
    stats: { totalLeads: 30, taxaConversao: "6.7", pipelineEmNegociacao: 2250000 },
    carteira: [
      { etapa: "Lead recebido", quantidade: 12, fill: "hsl(224, 73%, 38%)" },
      { etapa: "Qualificado", quantidade: 8,  fill: "hsl(224, 73%, 46%)" },
      { etapa: "Visita agendada", quantidade: 5, fill: "hsl(224, 73%, 53%)" },
      { etapa: "Visita realizada", quantidade: 4, fill: "hsl(224, 73%, 60%)" },
      { etapa: "Proposta", quantidade: 2,  fill: "hsl(224, 73%, 67%)" },
      { etapa: "Fechamento", quantidade: 1,  fill: "hsl(224, 73%, 30%)" },
    ],
    marketing: [
      { etapa: "Lead recebido", quantidade: 18, fill: "hsl(43, 76%, 48%)" },
      { etapa: "Qualificado", quantidade: 12, fill: "hsl(43, 76%, 54%)" },
      { etapa: "Visita agendada", quantidade: 8,  fill: "hsl(43, 76%, 60%)" },
      { etapa: "Visita realizada", quantidade: 6,  fill: "hsl(43, 76%, 65%)" },
      { etapa: "Proposta", quantidade: 3,  fill: "hsl(43, 76%, 43%)" },
      { etapa: "Fechamento", quantidade: 1,  fill: "hsl(43, 76%, 35%)" },
    ],
  },
  {
    corretor: "Rafael Filimberti",
    corretorId: "rafael",
    stats: { totalLeads: 23, taxaConversao: "4.3", pipelineEmNegociacao: 1500000 },
    carteira: [
      { etapa: "Lead recebido", quantidade: 8,  fill: "hsl(224, 73%, 38%)" },
      { etapa: "Qualificado", quantidade: 5,  fill: "hsl(224, 73%, 46%)" },
      { etapa: "Visita agendada", quantidade: 3,  fill: "hsl(224, 73%, 53%)" },
      { etapa: "Visita realizada", quantidade: 2,  fill: "hsl(224, 73%, 60%)" },
      { etapa: "Proposta", quantidade: 1,  fill: "hsl(224, 73%, 67%)" },
      { etapa: "Fechamento", quantidade: 0,  fill: "hsl(224, 73%, 30%)" },
    ],
    marketing: [
      { etapa: "Lead recebido", quantidade: 15, fill: "hsl(43, 76%, 48%)" },
      { etapa: "Qualificado", quantidade: 9,  fill: "hsl(43, 76%, 54%)" },
      { etapa: "Visita agendada", quantidade: 6,  fill: "hsl(43, 76%, 60%)" },
      { etapa: "Visita realizada", quantidade: 4,  fill: "hsl(43, 76%, 65%)" },
      { etapa: "Proposta", quantidade: 2,  fill: "hsl(43, 76%, 43%)" },
      { etapa: "Fechamento", quantidade: 1,  fill: "hsl(43, 76%, 35%)" },
    ],
  },
  {
    corretor: "Gabriel Souza",
    corretorId: "gabriel",
    stats: { totalLeads: 18, taxaConversao: "5.6", pipelineEmNegociacao: 1200000 },
    carteira: [
      { etapa: "Lead recebido", quantidade: 6,  fill: "hsl(224, 73%, 38%)" },
      { etapa: "Qualificado", quantidade: 4,  fill: "hsl(224, 73%, 46%)" },
      { etapa: "Visita agendada", quantidade: 2,  fill: "hsl(224, 73%, 53%)" },
      { etapa: "Visita realizada", quantidade: 2,  fill: "hsl(224, 73%, 60%)" },
      { etapa: "Proposta", quantidade: 1,  fill: "hsl(224, 73%, 67%)" },
      { etapa: "Fechamento", quantidade: 0,  fill: "hsl(224, 73%, 30%)" },
    ],
    marketing: [
      { etapa: "Lead recebido", quantidade: 12, fill: "hsl(43, 76%, 48%)" },
      { etapa: "Qualificado", quantidade: 7,  fill: "hsl(43, 76%, 54%)" },
      { etapa: "Visita agendada", quantidade: 5,  fill: "hsl(43, 76%, 60%)" },
      { etapa: "Visita realizada", quantidade: 3,  fill: "hsl(43, 76%, 65%)" },
      { etapa: "Proposta", quantidade: 1,  fill: "hsl(43, 76%, 43%)" },
      { etapa: "Fechamento", quantidade: 1,  fill: "hsl(43, 76%, 35%)" },
    ],
  },
];

export const imoveis = [
  { id: "1",  nome: "Casa Aquarela Premium",       tipo: "Casa",        valor: 2800000, status: "Disponível"    as const, corretor: "Rafael" as const },
  { id: "2",  nome: "Lote Lago Azul 360m²",        tipo: "Terreno",     valor: 580000,  status: "Em negociação" as const, corretor: "Hans"   as const },
  { id: "3",  nome: "Sobrado Damha III",            tipo: "Casa",        valor: 3500000, status: "Vendido"       as const, corretor: "Rafael" as const },
  { id: "4",  nome: "Terreno Eco Park 500m²",      tipo: "Terreno",     valor: 750000,  status: "Disponível"    as const, corretor: "Hans"   as const },
  { id: "5",  nome: "Casa Florais Cuiabá",          tipo: "Casa",        valor: 4200000, status: "Em negociação" as const, corretor: "Gabriel" as const },
  { id: "6",  nome: "Lote Residencial Royal",       tipo: "Terreno",     valor: 920000,  status: "Disponível"    as const, corretor: "Hans"   as const },
  { id: "7",  nome: "Mansão Jardins Imperial",      tipo: "Casa",        valor: 8500000, status: "Disponível"    as const, corretor: "Rafael" as const },
  { id: "8",  nome: "Cobertura Duplex Central",     tipo: "Apartamento", valor: 1500000, status: "Em negociação" as const, corretor: "Hans"   as const },
  { id: "9",  nome: "Casa Condomínio Alphaville",   tipo: "Casa",        valor: 6800000, status: "Disponível"    as const, corretor: "Gabriel" as const },
  { id: "10", nome: "Terreno Premium Nações",       tipo: "Terreno",     valor: 1200000, status: "Disponível"    as const, corretor: "Hans"   as const },
];

export const corretoresRanking = [
  { nome: "Hans Rodovalho",    atendimentos: 30, visitas: 11, propostas: 5, fechamentos: 2 },
  { nome: "Rafael Filimberti", atendimentos: 23, visitas: 9,  propostas: 3, fechamentos: 1 },
  { nome: "Gabriel Souza",     atendimentos: 18, visitas: 7,  propostas: 2, fechamentos: 1 },
];

export const metaAds = {
  impressoes: 45200,
  cliques: 1356,
  ctr: 3.0,
  cpc: 1.33,
  cpl: 72.0,
  gastos: 1800,
  budget: 2000,
  campanhas: [
    { nome: "Casas Alto Padrão - Sinop", leads: 12, gastos: 650, cpl: 54.17 },
    { nome: "Lotes Premium - Lago Azul", leads: 8, gastos: 480, cpl: 60.0 },
    { nome: "Remarketing - Visitantes Site", leads: 3, gastos: 320, cpl: 106.67 },
    { nome: "Lookalike - Compradores", leads: 2, gastos: 350, cpl: 175.0 },
  ],
};

export const googleAds = {
  impressoes: 32800,
  cliques: 984,
  ctr: 3.0,
  cpc: 1.22,
  cpl: 100.0,
  gastos: 1200,
  budget: 1500,
  campanhas: [
    { nome: "Imóveis de Luxo Sinop", leads: 5, gastos: 420, cpl: 84.0 },
    { nome: "Casas Condomínio Fechado", leads: 4, gastos: 380, cpl: 95.0 },
    { nome: "Terrenos Premium MT", leads: 3, gastos: 400, cpl: 133.33 },
  ],
};

export const metaVsGoogle = [
  { metrica: "Impressões", meta: 45200, google: 32800 },
  { metrica: "Cliques", meta: 1356, google: 984 },
  { metrica: "Leads", meta: 25, google: 12 },
];

export const socialProfiles = [
  {
    nome: "Hans",
    handle: "@hans.corretor",
    seguidores: 8900,
    alcance: 22100,
    engajamento: 1650,
    posts: 6,
    variacaoSemanal: [
      { semana: "Sem 1", alcance: 18000, engajamento: 1200 },
      { semana: "Sem 2", alcance: 19500, engajamento: 1350 },
      { semana: "Sem 3", alcance: 21000, engajamento: 1500 },
      { semana: "Sem 4", alcance: 22100, engajamento: 1650 },
    ],
  },
  {
    nome: "Rafael",
    handle: "@rafael.hrimoveis",
    seguidores: 6400,
    alcance: 16800,
    engajamento: 1240,
    posts: 5,
    variacaoSemanal: [
      { semana: "Sem 1", alcance: 12000, engajamento: 880 },
      { semana: "Sem 2", alcance: 14000, engajamento: 1020 },
      { semana: "Sem 3", alcance: 15500, engajamento: 1140 },
      { semana: "Sem 4", alcance: 16800, engajamento: 1240 },
    ],
  },
  {
    nome: "HR Imóveis",
    handle: "@hrimoveis",
    seguidores: 18700,
    alcance: 52000,
    engajamento: 4200,
    posts: 10,
    variacaoSemanal: [
      { semana: "Sem 1", alcance: 42000, engajamento: 3200 },
      { semana: "Sem 2", alcance: 45000, engajamento: 3600 },
      { semana: "Sem 3", alcance: 48000, engajamento: 3900 },
      { semana: "Sem 4", alcance: 52000, engajamento: 4200 },
    ],
  },
];

export const engajamentoPorPerfil = [
  { perfil: "Hans",      curtidas: 1280, comentarios: 370 },
  { perfil: "Rafael",    curtidas: 980,  comentarios: 260 },
  { perfil: "HR Imóveis", curtidas: 3300, comentarios: 900 },
];

export type PostStatus = "💡 Ideia" | "✍️ Roteiro" | "🎬 Gravado" | "✅ Publicado";

export interface ContentPost {
  id: string;
  titulo: string;
  perfil: "Hans" | "Rafael" | "Gabriel" | "HR Imóveis";
  formato: "Reels" | "Carrossel" | "Feed" | "Stories";
  tema: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: PostStatus;
  data: string;
}

export const contentPosts: ContentPost[] = [
  { id: "1", titulo: "Tour Mansão Jardins Imperial",       perfil: "Rafael",    formato: "Reels",    tema: "Tour de imóvel", prioridade: "Alta",  status: "✅ Publicado", data: "2025-03-24" },
  { id: "2", titulo: "5 motivos para morar em condomínio", perfil: "HR Imóveis", formato: "Carrossel", tema: "Educacional",    prioridade: "Média", status: "✅ Publicado", data: "2025-03-25" },
  { id: "3", titulo: "Dia a dia do corretor",              perfil: "Hans",      formato: "Stories",  tema: "Bastidores",     prioridade: "Baixa", status: "🎬 Gravado",   data: "2025-03-26" },
  { id: "4", titulo: "Casa Aquarela - Detalhes",           perfil: "Gabriel",   formato: "Reels",    tema: "Tour de imóvel", prioridade: "Alta",  status: "✍️ Roteiro",   data: "2025-03-28" },
  { id: "5", titulo: "Mercado imobiliário Sinop 2025",     perfil: "HR Imóveis", formato: "Feed",     tema: "Mercado",        prioridade: "Média", status: "💡 Ideia",     data: "2025-03-29" },
  { id: "6", titulo: "Depoimento cliente Damha",           perfil: "Rafael",    formato: "Reels",    tema: "Social proof",   prioridade: "Alta",  status: "✍️ Roteiro",   data: "2025-03-30" },
  { id: "7", titulo: "Lote vs Casa pronta",                perfil: "Hans",      formato: "Carrossel", tema: "Educacional",    prioridade: "Média", status: "💡 Ideia",     data: "2025-03-31" },
  { id: "8", titulo: "Inauguração área gourmet Eco Park",  perfil: "HR Imóveis", formato: "Stories",  tema: "Evento",         prioridade: "Alta",  status: "🎬 Gravado",   data: "2025-03-27" },
];

export interface KanbanTask {
  id: string;
  titulo: string;
  responsavel: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: "A fazer" | "Em andamento" | "Feito";
}

export const kanbanTasks: KanbanTask[] = [
  { id: "1", titulo: "Atualizar fotos Lago Azul",        responsavel: "Hans",    prioridade: "Alta",  status: "A fazer" },
  { id: "2", titulo: "Gravar tour Mansão Imperial",      responsavel: "Rafael",  prioridade: "Alta",  status: "Em andamento" },
  { id: "3", titulo: "Configurar campanha remarketing",  responsavel: "Equipe",  prioridade: "Média", status: "A fazer" },
  { id: "4", titulo: "Revisar script Sofia",             responsavel: "Equipe",  prioridade: "Alta",  status: "Em andamento" },
  { id: "5", titulo: "Publicar carrossel educacional",   responsavel: "Hans",    prioridade: "Média", status: "Feito" },
  { id: "6", titulo: "Contrato Juliana Mendes",          responsavel: "Rafael",  prioridade: "Alta",  status: "Feito" },
  { id: "7", titulo: "Ajustar CPC Google Ads",           responsavel: "Equipe",  prioridade: "Baixa", status: "A fazer" },
  { id: "8", titulo: "Follow-up leads semana",           responsavel: "Gabriel", prioridade: "Alta",  status: "Em andamento" },
];

export const agentStatus = [
  { nome: "Sofia (Atendimento IA)", status: "online" as const, ultimaAtividade: "2025-03-27 15:42", detalhes: "Processando 3 conversas simultâneas" },
  { nome: "Agente Principal (Automações)", status: "online" as const, ultimaAtividade: "2025-03-27 15:40", detalhes: "Última tarefa: envio de relatório semanal" },
];

export const activityLog = [
  { tipo: "Lead",     descricao: "Novo lead: Fernando Almeida via Google Ads",  data: "2025-03-27 11:20", status: "success" as const },
  { tipo: "Sofia",    descricao: "Conversa iniciada com Fernando Almeida",       data: "2025-03-27 11:21", status: "success" as const },
  { tipo: "Visita",   descricao: "Visita agendada: Carlos Eduardo - Lago Azul",  data: "2025-03-27 10:45", status: "success" as const },
  { tipo: "Campanha", descricao: "Budget Meta Ads: 90% utilizado",               data: "2025-03-27 09:00", status: "warning" as const },
  { tipo: "Sistema",  descricao: "Backup automático realizado",                  data: "2025-03-27 06:00", status: "success" as const },
  { tipo: "Proposta", descricao: "Proposta enviada: Ana Paula - Damha III",      data: "2025-03-26 17:30", status: "success" as const },
  { tipo: "Erro",     descricao: "Timeout API Salesforce (recuperado)",          data: "2025-03-26 14:15", status: "error"   as const },
];

export const systemHealth = [
  { nome: "VPS (Servidor)",      status: "online"    as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "CPU: 23% | RAM: 41% | Disco: 35%" },
  { nome: "Mac (Produção)",      status: "online"    as const, ultimaChecagem: "2025-03-27 15:44", detalhe: "Processamento de vídeos OK" },
  { nome: "API Anthropic",       status: "online"    as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "Latência: 340ms | Tokens/dia: 45.2k" },
  { nome: "Salesforce",          status: "degraded"  as const, ultimaChecagem: "2025-03-27 15:43", detalhe: "Latência elevada: 1.2s (normal: 400ms)" },
  { nome: "Meta Ads API",        status: "online"    as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "Rate limit: 12% utilizado" },
  { nome: "Google Ads API",      status: "online"    as const, ultimaChecagem: "2025-03-27 15:44", detalhe: "Quota: 8% utilizada" },
];

// --- Controle de Criação ---

export interface Conta {
  id: string;
  nome: string;
  tipo: "Pessoa Física" | "Pessoa Jurídica";
  corretor: "Hans" | "Rafael" | "Gabriel";
  dataCreacao: string;
  cidade: string;
}

export interface Oportunidade {
  id: string;
  nome: string;
  corretor: "Hans" | "Rafael" | "Gabriel";
  valor: number;
  estagio: "Prospecção" | "Qualificação" | "Proposta" | "Negociação" | "Fechamento";
  dataCreacao: string;
}

export const contas: Conta[] = [
  { id: "c1",  nome: "Carlos Eduardo Silva",    tipo: "Pessoa Física",   corretor: "Hans",    dataCreacao: "2026-01-10", cidade: "Sinop" },
  { id: "c2",  nome: "Roberto Nascimento",       tipo: "Pessoa Física",   corretor: "Hans",    dataCreacao: "2026-01-15", cidade: "Sinop" },
  { id: "c3",  nome: "Fernando Almeida",         tipo: "Pessoa Física",   corretor: "Hans",    dataCreacao: "2026-02-03", cidade: "Sinop" },
  { id: "c4",  nome: "Thiago Barbosa",           tipo: "Pessoa Física",   corretor: "Hans",    dataCreacao: "2026-02-18", cidade: "Sorriso" },
  { id: "c5",  nome: "Construtora Nortec",       tipo: "Pessoa Jurídica", corretor: "Hans",    dataCreacao: "2026-03-01", cidade: "Sinop" },
  { id: "c6",  nome: "Ana Paula Ferreira",       tipo: "Pessoa Física",   corretor: "Rafael",  dataCreacao: "2026-01-20", cidade: "Sinop" },
  { id: "c7",  nome: "Juliana Mendes",           tipo: "Pessoa Física",   corretor: "Rafael",  dataCreacao: "2026-02-10", cidade: "Sinop" },
  { id: "c8",  nome: "Igor Santos",              tipo: "Pessoa Física",   corretor: "Rafael",  dataCreacao: "2026-03-05", cidade: "Sinop" },
  { id: "c9",  nome: "Mariana Costa",            tipo: "Pessoa Física",   corretor: "Gabriel", dataCreacao: "2026-01-25", cidade: "Sinop" },
  { id: "c10", nome: "Patrícia Oliveira",        tipo: "Pessoa Física",   corretor: "Gabriel", dataCreacao: "2026-02-14", cidade: "Sorriso" },
  { id: "c11", nome: "Diego Carvalho",           tipo: "Pessoa Física",   corretor: "Gabriel", dataCreacao: "2026-03-12", cidade: "Sinop" },
  { id: "c12", nome: "Sabrina Nunes",            tipo: "Pessoa Física",   corretor: "Gabriel", dataCreacao: "2026-03-20", cidade: "Sinop" },
];

export const oportunidades: Oportunidade[] = [
  { id: "o1",  nome: "Lote Lago Azul - Carlos",     corretor: "Hans",    valor: 580000,   estagio: "Negociação",  dataCreacao: "2026-02-20" },
  { id: "o2",  nome: "Cobertura Central - Roberto",  corretor: "Hans",    valor: 1500000,  estagio: "Proposta",    dataCreacao: "2026-03-01" },
  { id: "o3",  nome: "Terreno Nações - Fernando",    corretor: "Hans",    valor: 920000,   estagio: "Qualificação",dataCreacao: "2026-03-10" },
  { id: "o4",  nome: "Eco Park - Thiago",            corretor: "Hans",    valor: 750000,   estagio: "Fechamento",  dataCreacao: "2026-03-15" },
  { id: "o5",  nome: "Aquarela - Ana Paula",         corretor: "Rafael",  valor: 2800000,  estagio: "Proposta",    dataCreacao: "2026-02-25" },
  { id: "o6",  nome: "Damha III - Juliana",          corretor: "Rafael",  valor: 3500000,  estagio: "Fechamento",  dataCreacao: "2026-03-08" },
  { id: "o7",  nome: "Alphaville - Mariana",         corretor: "Gabriel", valor: 6800000,  estagio: "Negociação",  dataCreacao: "2026-03-05" },
  { id: "o8",  nome: "Florais Cuiabá - Patrícia",    corretor: "Gabriel", valor: 4200000,  estagio: "Proposta",    dataCreacao: "2026-03-18" },
];

// --- Análise de Leads ---

export const leadsPorOrigem = [
  { origem: "Carteira",                  quantidade: 16, fill: "hsl(224, 73%, 45%)" },
  { origem: "Anúncio Pago / Meta",        quantidade: 10, fill: "hsl(43, 76%, 48%)"  },
  { origem: "Indicação de terceiros",     quantidade: 10, fill: "hsl(160, 60%, 42%)" },
  { origem: "Instagram",                  quantidade: 4,  fill: "hsl(280, 60%, 55%)" },
  { origem: "Cliente de corretor parceiro", quantidade: 9, fill: "hsl(200, 70%, 50%)" },
  { origem: "WhatsApp",                   quantidade: 1,  fill: "hsl(130, 60%, 45%)" },
  { origem: "Site",                       quantidade: 10, fill: "hsl(20, 70%, 55%)"  },
];

export const leadsTotaisPorOrigem = [
  { name: "Anúncio Pago / Meta",        value: 8,  fill: "hsl(43, 76%, 48%)"  },
  { name: "Indicação de terceiros",     value: 2,  fill: "hsl(160, 60%, 42%)" },
  { name: "Cliente de corretor parceiro", value: 2, fill: "hsl(200, 70%, 50%)" },
  { name: "Carteira",                   value: 3,  fill: "hsl(224, 73%, 45%)" },
  { name: "Outros",                     value: 1,  fill: "hsl(0, 0%, 65%)"    },
];

export const produtosPorLead = [
  { produto: "Imóveis Exclusivos", quantidade: 9,  fill: "hsl(224, 73%, 45%)" },
  { produto: "Imóveis Alto Padrão", quantidade: 4, fill: "hsl(224, 73%, 55%)" },
  { produto: "Imóveis Padrão",     quantidade: 3,  fill: "hsl(224, 73%, 65%)" },
  { produto: "Empreendimentos",    quantidade: 1,  fill: "hsl(43, 76%, 52%)"  },
  { produto: "Terreno",            quantidade: 1,  fill: "hsl(43, 76%, 62%)"  },
];

export const motivosDesqualificacao = [
  { motivo: "Perfil Inadequado (Fit)", quantidade: 6, fill: "hsl(224, 73%, 45%)" },
  { motivo: "Orçamento (Budget)",      quantidade: 3, fill: "hsl(224, 73%, 55%)" },
  { motivo: "Viab. Técnica/Comercial", quantidade: 1, fill: "hsl(224, 73%, 65%)" },
  { motivo: "Outros",                  quantidade: 2, fill: "hsl(0, 0%, 65%)"    },
];
