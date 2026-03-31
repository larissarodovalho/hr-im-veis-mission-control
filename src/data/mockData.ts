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
  corretor: "Larissa" | "Hans";
  etapa: LeadEtapa;
  dataEntrada: string;
  historico: { data: string; mensagem: string; remetente: "Sofia" | "Lead" }[];
}

export const leads: Lead[] = [
  {
    id: "1", nome: "Carlos Eduardo Silva", telefone: "(66) 99901-2345", canal: "Meta Ads", corretor: "Hans", etapa: "Visita agendada", dataEntrada: "2025-03-24",
    historico: [
      { data: "2025-03-24 10:32", mensagem: "Olá Carlos! Sou a Sofia, assistente virtual da HR Imóveis. Vi que você se interessou pelo Residencial Lago Azul. Posso te ajudar?", remetente: "Sofia" },
      { data: "2025-03-24 10:35", mensagem: "Oi! Sim, quero saber o valor e se tem lotes maiores.", remetente: "Lead" },
      { data: "2025-03-24 10:36", mensagem: "Claro! Temos lotes de 360m² a 600m² no Lago Azul, a partir de R$580.000. Posso agendar uma visita com o Hans para esta semana?", remetente: "Sofia" },
      { data: "2025-03-24 10:40", mensagem: "Pode ser quinta às 15h.", remetente: "Lead" },
    ],
  },
  {
    id: "2", nome: "Ana Paula Ferreira", telefone: "(66) 99812-6789", canal: "Google Ads", corretor: "Larissa", etapa: "Proposta", dataEntrada: "2025-03-20",
    historico: [
      { data: "2025-03-20 14:10", mensagem: "Boa tarde, Ana Paula! Aqui é a Sofia da HR Imóveis. Você pesquisou sobre casas de alto padrão em Sinop?", remetente: "Sofia" },
      { data: "2025-03-20 14:15", mensagem: "Sim! Estou buscando algo acima de 300m², condomínio fechado.", remetente: "Lead" },
      { data: "2025-03-20 14:17", mensagem: "Perfeito! Temos opções incríveis no Aquarela e no Damha. A Larissa pode te apresentar. Quando fica bom?", remetente: "Sofia" },
    ],
  },
  {
    id: "3", nome: "Roberto Nascimento", telefone: "(66) 99734-1122", canal: "Meta Ads", corretor: "Hans", etapa: "Qualificado", dataEntrada: "2025-03-25",
    historico: [
      { data: "2025-03-25 09:00", mensagem: "Bom dia Roberto! Sou a Sofia, assistente da HR Imóveis. Vi seu interesse em imóveis premium. Qual sua faixa de investimento?", remetente: "Sofia" },
      { data: "2025-03-25 09:05", mensagem: "Bom dia! Estou pensando entre 1 e 2 milhões.", remetente: "Lead" },
    ],
  },
  {
    id: "4", nome: "Mariana Costa", telefone: "(66) 99645-3344", canal: "Indicação", corretor: "Larissa", etapa: "Visita realizada", dataEntrada: "2025-03-18",
    historico: [
      { data: "2025-03-18 16:00", mensagem: "Olá Mariana! A Fernanda indicou você para conhecer nossos empreendimentos. Posso ajudar?", remetente: "Sofia" },
      { data: "2025-03-18 16:10", mensagem: "Sim! Ela falou muito bem. Quero ver casas prontas no Aquarela.", remetente: "Lead" },
    ],
  },
  {
    id: "5", nome: "Fernando Almeida", telefone: "(66) 99556-7788", canal: "Google Ads", corretor: "Hans", etapa: "Lead recebido", dataEntrada: "2025-03-27",
    historico: [
      { data: "2025-03-27 11:20", mensagem: "Olá Fernando! Sou a Sofia da HR Imóveis. Obrigada pelo interesse! Está buscando imóvel para moradia ou investimento?", remetente: "Sofia" },
    ],
  },
  {
    id: "6", nome: "Juliana Mendes", telefone: "(66) 99467-9900", canal: "Meta Ads", corretor: "Larissa", etapa: "Fechamento", dataEntrada: "2025-03-10",
    historico: [
      { data: "2025-03-10 08:30", mensagem: "Bom dia Juliana! Vi que se interessou pelo Residencial Damha III. Gostaria de saber mais?", remetente: "Sofia" },
      { data: "2025-03-10 08:45", mensagem: "Sim! Quero agendar visita o mais rápido possível.", remetente: "Lead" },
      { data: "2025-03-15 17:00", mensagem: "Juliana, a Larissa confirmou que a proposta foi aceita! Parabéns pelo novo lar! 🎉", remetente: "Sofia" },
    ],
  },
  {
    id: "7", nome: "Thiago Barbosa", telefone: "(66) 99378-1234", canal: "Orgânico", corretor: "Hans", etapa: "Visita agendada", dataEntrada: "2025-03-26",
    historico: [
      { data: "2025-03-26 13:00", mensagem: "Oi Thiago! Sou a Sofia. Vi que você acompanha a HR Imóveis. Está pensando em investir em imóveis?", remetente: "Sofia" },
      { data: "2025-03-26 13:10", mensagem: "Sim, quero conhecer terrenos no Eco Park.", remetente: "Lead" },
    ],
  },
  {
    id: "8", nome: "Patrícia Oliveira", telefone: "(66) 99289-5566", canal: "Meta Ads", corretor: "Larissa", etapa: "Qualificado", dataEntrada: "2025-03-26",
    historico: [
      { data: "2025-03-26 15:30", mensagem: "Boa tarde Patrícia! Aqui é a Sofia. Você se interessou pelas casas do Aquarela. Posso passar mais detalhes?", remetente: "Sofia" },
      { data: "2025-03-26 15:40", mensagem: "Por favor! Qual o valor do m² e condições de pagamento?", remetente: "Lead" },
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

export const imoveis = [
  { id: "1", nome: "Casa Aquarela Premium", tipo: "Casa", valor: 2800000, status: "Disponível" as const, corretor: "Larissa" as const },
  { id: "2", nome: "Lote Lago Azul 360m²", tipo: "Terreno", valor: 580000, status: "Em negociação" as const, corretor: "Hans" as const },
  { id: "3", nome: "Sobrado Damha III", tipo: "Casa", valor: 3500000, status: "Vendido" as const, corretor: "Larissa" as const },
  { id: "4", nome: "Terreno Eco Park 500m²", tipo: "Terreno", valor: 750000, status: "Disponível" as const, corretor: "Hans" as const },
  { id: "5", nome: "Casa Florais Cuiabá", tipo: "Casa", valor: 4200000, status: "Em negociação" as const, corretor: "Larissa" as const },
  { id: "6", nome: "Lote Residencial Royal", tipo: "Terreno", valor: 920000, status: "Disponível" as const, corretor: "Hans" as const },
  { id: "7", nome: "Mansão Jardins Imperial", tipo: "Casa", valor: 8500000, status: "Disponível" as const, corretor: "Larissa" as const },
  { id: "8", nome: "Cobertura Duplex Central", tipo: "Apartamento", valor: 1500000, status: "Em negociação" as const, corretor: "Hans" as const },
  { id: "9", nome: "Casa Condomínio Alphaville", tipo: "Casa", valor: 6800000, status: "Disponível" as const, corretor: "Larissa" as const },
  { id: "10", nome: "Terreno Premium Nações", tipo: "Terreno", valor: 1200000, status: "Disponível" as const, corretor: "Hans" as const },
];

export const corretoresRanking = [
  { nome: "Larissa", atendimentos: 18, visitas: 7, propostas: 3, fechamentos: 1 },
  { nome: "Hans", atendimentos: 17, visitas: 6, propostas: 2, fechamentos: 1 },
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
    nome: "Larissa",
    handle: "@larissa.hrimoveis",
    seguidores: 12400,
    alcance: 34500,
    engajamento: 2890,
    posts: 8,
    variacaoSemanal: [
      { semana: "Sem 1", alcance: 28000, engajamento: 2100 },
      { semana: "Sem 2", alcance: 31000, engajamento: 2400 },
      { semana: "Sem 3", alcance: 33000, engajamento: 2700 },
      { semana: "Sem 4", alcance: 34500, engajamento: 2890 },
    ],
  },
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
  { perfil: "Larissa", curtidas: 2200, comentarios: 690 },
  { perfil: "Hans", curtidas: 1280, comentarios: 370 },
  { perfil: "HR Imóveis", curtidas: 3300, comentarios: 900 },
];

export type PostStatus = "💡 Ideia" | "✍️ Roteiro" | "🎬 Gravado" | "✅ Publicado";

export interface ContentPost {
  id: string;
  titulo: string;
  perfil: "Larissa" | "Hans" | "HR Imóveis";
  formato: "Reels" | "Carrossel" | "Feed" | "Stories";
  tema: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: PostStatus;
  data: string;
}

export const contentPosts: ContentPost[] = [
  { id: "1", titulo: "Tour Mansão Jardins Imperial", perfil: "Larissa", formato: "Reels", tema: "Tour de imóvel", prioridade: "Alta", status: "✅ Publicado", data: "2025-03-24" },
  { id: "2", titulo: "5 motivos para morar em condomínio", perfil: "HR Imóveis", formato: "Carrossel", tema: "Educacional", prioridade: "Média", status: "✅ Publicado", data: "2025-03-25" },
  { id: "3", titulo: "Dia a dia do corretor", perfil: "Hans", formato: "Stories", tema: "Bastidores", prioridade: "Baixa", status: "🎬 Gravado", data: "2025-03-26" },
  { id: "4", titulo: "Casa Aquarela - Detalhes", perfil: "Larissa", formato: "Reels", tema: "Tour de imóvel", prioridade: "Alta", status: "✍️ Roteiro", data: "2025-03-28" },
  { id: "5", titulo: "Mercado imobiliário Sinop 2025", perfil: "HR Imóveis", formato: "Feed", tema: "Mercado", prioridade: "Média", status: "💡 Ideia", data: "2025-03-29" },
  { id: "6", titulo: "Depoimento cliente Damha", perfil: "Larissa", formato: "Reels", tema: "Social proof", prioridade: "Alta", status: "✍️ Roteiro", data: "2025-03-30" },
  { id: "7", titulo: "Lote vs Casa pronta", perfil: "Hans", formato: "Carrossel", tema: "Educacional", prioridade: "Média", status: "💡 Ideia", data: "2025-03-31" },
  { id: "8", titulo: "Inauguração área gourmet Eco Park", perfil: "HR Imóveis", formato: "Stories", tema: "Evento", prioridade: "Alta", status: "🎬 Gravado", data: "2025-03-27" },
];

export interface KanbanTask {
  id: string;
  titulo: string;
  responsavel: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: "A fazer" | "Em andamento" | "Feito";
}

export const kanbanTasks: KanbanTask[] = [
  { id: "1", titulo: "Atualizar fotos Lago Azul", responsavel: "Hans", prioridade: "Alta", status: "A fazer" },
  { id: "2", titulo: "Gravar tour Mansão Imperial", responsavel: "Larissa", prioridade: "Alta", status: "Em andamento" },
  { id: "3", titulo: "Configurar campanha remarketing", responsavel: "Equipe", prioridade: "Média", status: "A fazer" },
  { id: "4", titulo: "Revisar script Sofia", responsavel: "Equipe", prioridade: "Alta", status: "Em andamento" },
  { id: "5", titulo: "Publicar carrossel educacional", responsavel: "Hans", prioridade: "Média", status: "Feito" },
  { id: "6", titulo: "Contrato Juliana Mendes", responsavel: "Larissa", prioridade: "Alta", status: "Feito" },
  { id: "7", titulo: "Ajustar CPC Google Ads", responsavel: "Equipe", prioridade: "Baixa", status: "A fazer" },
  { id: "8", titulo: "Follow-up leads semana", responsavel: "Hans", prioridade: "Alta", status: "Em andamento" },
];

export const agentStatus = [
  { nome: "Sofia (Atendimento IA)", status: "online" as const, ultimaAtividade: "2025-03-27 15:42", detalhes: "Processando 3 conversas simultâneas" },
  { nome: "Agente Principal (Automações)", status: "online" as const, ultimaAtividade: "2025-03-27 15:40", detalhes: "Última tarefa: envio de relatório semanal" },
];

export const activityLog = [
  { tipo: "Lead", descricao: "Novo lead: Fernando Almeida via Google Ads", data: "2025-03-27 11:20", status: "success" as const },
  { tipo: "Sofia", descricao: "Conversa iniciada com Fernando Almeida", data: "2025-03-27 11:21", status: "success" as const },
  { tipo: "Visita", descricao: "Visita agendada: Carlos Eduardo - Lago Azul", data: "2025-03-27 10:45", status: "success" as const },
  { tipo: "Campanha", descricao: "Budget Meta Ads: 90% utilizado", data: "2025-03-27 09:00", status: "warning" as const },
  { tipo: "Sistema", descricao: "Backup automático realizado", data: "2025-03-27 06:00", status: "success" as const },
  { tipo: "Proposta", descricao: "Proposta enviada: Ana Paula - Damha III", data: "2025-03-26 17:30", status: "success" as const },
  { tipo: "Erro", descricao: "Timeout API Salesforce (recuperado)", data: "2025-03-26 14:15", status: "error" as const },
];

export const systemHealth = [
  { nome: "VPS (Servidor)", status: "online" as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "CPU: 23% | RAM: 41% | Disco: 35%" },
  { nome: "Mac (Produção)", status: "online" as const, ultimaChecagem: "2025-03-27 15:44", detalhe: "Processamento de vídeos OK" },
  { nome: "API Anthropic", status: "online" as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "Latência: 340ms | Tokens/dia: 45.2k" },
  { nome: "Salesforce", status: "degraded" as const, ultimaChecagem: "2025-03-27 15:43", detalhe: "Latência elevada: 1.2s (normal: 400ms)" },
  { nome: "Meta Ads API", status: "online" as const, ultimaChecagem: "2025-03-27 15:45", detalhe: "Rate limit: 12% utilizado" },
  { nome: "Google Ads API", status: "online" as const, ultimaChecagem: "2025-03-27 15:44", detalhe: "Quota: 8% utilizada" },
];
