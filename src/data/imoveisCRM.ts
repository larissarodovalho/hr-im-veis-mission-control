// Dados centralizados de imóveis - fonte única para CRM e Site
// Exporta no formato completo para ImoveisTab e formato simplificado para o site

export interface ImovelCRM {
  id: string;
  codigo: string;
  nome: string;
  tipo: "Casa" | "Terreno" | "Apartamento" | "Sobrado" | "Cobertura";
  valor: number;
  status: "Disponível" | "Indisponível" | "Em negociação" | "Vendido";
  corretor: "Hans" | "Rafael" | "Gabriel";
  descricao: string;
  area: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    condominio: string;
    cidade: string;
    estado: string;
  };
  proprietario: {
    nome: string;
    telefone: string;
    email: string;
    cpfCnpj: string;
  };
  fotos: string[];
  documentos: { nome: string; tipo: string; dataUpload: string }[];
}

export const IMOVEIS_CRM: ImovelCRM[] = [
  {
    id: "1", codigo: "HR0178", nome: "Casa Condomínio Carpe Diem Resort Residencial",
    tipo: "Casa", valor: 7000000, status: "Disponível", corretor: "Hans",
    descricao: "Casa de alto padrão no Carpe Diem Resort com 4 suítes, piscina aquecida, churrasqueira gourmet, espaço fitness e jardim tropical. Acabamento premium com mármore e madeira nobre.",
    area: "480m²", quartos: 4, banheiros: 5, vagas: 4,
    endereco: { rua: "Rua das Palmeiras", numero: "150", bairro: "Carpe Diem Resort", condominio: "Carpe Diem Resort Residencial", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Ricardo Mendes", telefone: "(66) 99901-4455", email: "ricardo.mendes@email.com", cpfCnpj: "123.456.789-00" },
    fotos: [], documentos: [{ nome: "Matrícula do Imóvel", tipo: "PDF", dataUpload: "2025-03-10" }, { nome: "IPTU 2025", tipo: "PDF", dataUpload: "2025-03-12" }],
  },
  {
    id: "2", codigo: "CA0177", nome: "Casa Aquarela das Artes",
    tipo: "Casa", valor: 3850000, status: "Indisponível", corretor: "Rafael",
    descricao: "Imóvel exclusivo no Aquarela das Artes com design contemporâneo, 3 suítes master, home theater, adega climatizada e piscina com borda infinita.",
    area: "350m²", quartos: 3, banheiros: 4, vagas: 3,
    endereco: { rua: "Alameda das Artes", numero: "88", bairro: "Aquarela", condominio: "Aquarela das Artes", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Fernanda Costa", telefone: "(66) 99822-3344", email: "fernanda.costa@email.com", cpfCnpj: "987.654.321-00" },
    fotos: [], documentos: [{ nome: "Escritura", tipo: "PDF", dataUpload: "2025-02-20" }],
  },
  {
    id: "3", codigo: "HR0176", nome: "Casa Alameda das Cores Residencial",
    tipo: "Casa", valor: 3200000, status: "Disponível", corretor: "Gabriel",
    descricao: "Casa moderna com ampla área gourmet, 3 suítes, escritório e área de lazer completa com piscina e deck de madeira.",
    area: "320m²", quartos: 3, banheiros: 3, vagas: 2,
    endereco: { rua: "Alameda das Cores", numero: "45", bairro: "Alameda das Cores", condominio: "Alameda das Cores Residencial", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Paulo Souza", telefone: "(66) 99788-1122", email: "paulo.souza@email.com", cpfCnpj: "456.789.123-00" },
    fotos: [], documentos: [],
  },
  {
    id: "4", codigo: "CA0175", nome: "Casa Jardim Curitiba",
    tipo: "Casa", valor: 1330000, status: "Disponível", corretor: "Hans",
    descricao: "Casa excelente localização no Jardim Curitiba. 3 quartos sendo 1 suíte, sala ampla, cozinha planejada e quintal com churrasqueira.",
    area: "220m²", quartos: 3, banheiros: 2, vagas: 2,
    endereco: { rua: "Rua dos Ipês", numero: "312", bairro: "Jardim Curitiba", condominio: "", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Marcos Oliveira", telefone: "(66) 99655-8899", email: "marcos.oliveira@email.com", cpfCnpj: "321.654.987-00" },
    fotos: [], documentos: [{ nome: "Contrato de Exclusividade", tipo: "PDF", dataUpload: "2025-03-05" }, { nome: "Matrícula", tipo: "PDF", dataUpload: "2025-03-05" }, { nome: "IPTU 2025", tipo: "PDF", dataUpload: "2025-03-08" }],
  },
  {
    id: "5", codigo: "HR0174", nome: "Casa Jardim Curitiba II",
    tipo: "Casa", valor: 1790000, status: "Disponível", corretor: "Rafael",
    descricao: "Sobrado moderno com 4 quartos, piscina com deck e acabamento de primeira linha. Próximo ao centro comercial.",
    area: "280m²", quartos: 4, banheiros: 3, vagas: 3,
    endereco: { rua: "Av. Principal", numero: "580", bairro: "Jardim Curitiba", condominio: "", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Ana Beatriz Lima", telefone: "(66) 99544-7766", email: "ana.lima@email.com", cpfCnpj: "654.987.321-00" },
    fotos: [], documentos: [],
  },
  {
    id: "6", codigo: "HR0173", nome: "Casa Aquarela dos Poemas",
    tipo: "Casa", valor: 1950000, status: "Indisponível", corretor: "Gabriel",
    descricao: "Imóvel com projeto arquitetônico diferenciado, 3 suítes, varanda gourmet e paisagismo completo.",
    area: "300m²", quartos: 3, banheiros: 3, vagas: 2,
    endereco: { rua: "Rua dos Poemas", numero: "120", bairro: "Aquarela", condominio: "Aquarela dos Poemas", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Juliana Santos", telefone: "(66) 99433-5544", email: "juliana.santos@email.com", cpfCnpj: "789.123.456-00" },
    fotos: [], documentos: [{ nome: "Matrícula Atualizada", tipo: "PDF", dataUpload: "2025-02-28" }],
  },
  {
    id: "7", codigo: "RF0172", nome: "Casa Alameda das Cores II",
    tipo: "Casa", valor: 2850000, status: "Disponível", corretor: "Hans",
    descricao: "Casa espaçosa com 4 suítes, cinema privativo, spa e garagem para 4 carros. Condomínio com segurança 24h.",
    area: "420m²", quartos: 4, banheiros: 5, vagas: 4,
    endereco: { rua: "Alameda Premium", numero: "200", bairro: "Alameda das Cores", condominio: "Alameda das Cores Residencial", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Roberto Ferreira", telefone: "(66) 99322-4433", email: "roberto.ferreira@email.com", cpfCnpj: "147.258.369-00" },
    fotos: [], documentos: [],
  },
  {
    id: "8", codigo: "HR0171", nome: "Casa Aquarela dos Poemas II",
    tipo: "Casa", valor: 2500000, status: "Disponível", corretor: "Rafael",
    descricao: "Casa de esquina com vista panorâmica, 3 suítes com closet, área gourmet integrada e piscina com aquecimento solar.",
    area: "340m²", quartos: 3, banheiros: 4, vagas: 3,
    endereco: { rua: "Rua das Rosas", numero: "75", bairro: "Aquarela", condominio: "Aquarela dos Poemas", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Camila Almeida", telefone: "(66) 99211-3322", email: "camila.almeida@email.com", cpfCnpj: "258.369.147-00" },
    fotos: [], documentos: [{ nome: "Escritura Pública", tipo: "PDF", dataUpload: "2025-01-15" }, { nome: "Laudo de Avaliação", tipo: "PDF", dataUpload: "2025-02-10" }],
  },
  {
    id: "9", codigo: "HR0170", nome: "Casa Aquarela Premium",
    tipo: "Casa", valor: 2800000, status: "Disponível", corretor: "Rafael",
    descricao: "Casa premium no condomínio Aquarela com acabamento de altíssimo padrão, 4 suítes, piscina com deck em porcelanato e espaço gourmet completo.",
    area: "380m²", quartos: 4, banheiros: 4, vagas: 3,
    endereco: { rua: "Rua das Orquídeas", numero: "310", bairro: "Aquarela", condominio: "Aquarela Premium", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Gustavo Henrique", telefone: "(66) 99100-2233", email: "gustavo.henrique@email.com", cpfCnpj: "369.147.258-00" },
    fotos: [], documentos: [{ nome: "Matrícula", tipo: "PDF", dataUpload: "2026-03-05" }],
  },
  {
    id: "10", codigo: "HR0169", nome: "Lote Lago Azul 360m²",
    tipo: "Terreno", valor: 580000, status: "Em negociação", corretor: "Hans",
    descricao: "Lote premium no Residencial Lago Azul com 360m², posição nascente e vista para o lago. Condomínio com infraestrutura completa.",
    area: "360m²", quartos: 0, banheiros: 0, vagas: 0,
    endereco: { rua: "Alameda do Lago", numero: "22", bairro: "Lago Azul", condominio: "Residencial Lago Azul", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Antônio Pereira", telefone: "(66) 99088-4455", email: "antonio.pereira@email.com", cpfCnpj: "741.852.963-00" },
    fotos: [], documentos: [],
  },
  {
    id: "11", codigo: "RF0168", nome: "Sobrado Damha III",
    tipo: "Sobrado", valor: 3500000, status: "Vendido", corretor: "Rafael",
    descricao: "Sobrado de alto padrão no Damha III com 5 suítes, cinema, adega climatizada, piscina aquecida e jardim com paisagismo premiado.",
    area: "450m²", quartos: 5, banheiros: 6, vagas: 4,
    endereco: { rua: "Av. das Palmeiras", numero: "900", bairro: "Damha III", condominio: "Residencial Damha III", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Luciana Martins", telefone: "(66) 99977-6655", email: "luciana.martins@email.com", cpfCnpj: "852.963.741-00" },
    fotos: [], documentos: [{ nome: "Escritura", tipo: "PDF", dataUpload: "2026-02-18" }, { nome: "Contrato de Venda", tipo: "PDF", dataUpload: "2026-03-01" }],
  },
  {
    id: "12", codigo: "HR0167", nome: "Terreno Eco Park 500m²",
    tipo: "Terreno", valor: 750000, status: "Disponível", corretor: "Hans",
    descricao: "Terreno de 500m² no Eco Park com vegetação preservada, posição privilegiada e acesso à trilha ecológica do condomínio.",
    area: "500m²", quartos: 0, banheiros: 0, vagas: 0,
    endereco: { rua: "Rua da Mata", numero: "55", bairro: "Eco Park", condominio: "Eco Park Residencial", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Marcelo Ribeiro", telefone: "(66) 99866-7788", email: "marcelo.ribeiro@email.com", cpfCnpj: "963.741.852-00" },
    fotos: [], documentos: [{ nome: "Matrícula", tipo: "PDF", dataUpload: "2026-01-22" }],
  },
  {
    id: "13", codigo: "GB0166", nome: "Casa Florais Cuiabá",
    tipo: "Casa", valor: 4200000, status: "Em negociação", corretor: "Gabriel",
    descricao: "Casa sofisticada no Florais Cuiabá com 4 suítes, pé-direito duplo, piscina com raia e área gourmet com forno de pizza.",
    area: "400m²", quartos: 4, banheiros: 5, vagas: 3,
    endereco: { rua: "Av. dos Florais", numero: "1200", bairro: "Florais Cuiabá", condominio: "Florais Cuiabá", cidade: "Cuiabá", estado: "MT" },
    proprietario: { nome: "Daniela Fonseca", telefone: "(65) 99755-3344", email: "daniela.fonseca@email.com", cpfCnpj: "159.357.486-00" },
    fotos: [], documentos: [{ nome: "IPTU 2026", tipo: "PDF", dataUpload: "2026-03-20" }],
  },
  {
    id: "14", codigo: "HR0165", nome: "Lote Residencial Royal",
    tipo: "Terreno", valor: 920000, status: "Disponível", corretor: "Hans",
    descricao: "Lote de 450m² no Residencial Royal com frente para área verde e proximidade ao clube do condomínio.",
    area: "450m²", quartos: 0, banheiros: 0, vagas: 0,
    endereco: { rua: "Rua Real", numero: "78", bairro: "Royal", condominio: "Residencial Royal", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Eduardo Campos", telefone: "(66) 99644-5566", email: "eduardo.campos@email.com", cpfCnpj: "357.486.159-00" },
    fotos: [], documentos: [],
  },
  {
    id: "15", codigo: "RF0164", nome: "Mansão Jardins Imperial",
    tipo: "Casa", valor: 8500000, status: "Disponível", corretor: "Rafael",
    descricao: "Mansão imponente no Jardins Imperial com 6 suítes, sala de cinema, spa com sauna, piscina olímpica aquecida, quadra de tênis e heliponto.",
    area: "750m²", quartos: 6, banheiros: 8, vagas: 6,
    endereco: { rua: "Alameda Imperial", numero: "01", bairro: "Jardins Imperial", condominio: "Jardins Imperial", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Dr. Alberto Vasconcelos", telefone: "(66) 99533-2211", email: "alberto.vasconcelos@email.com", cpfCnpj: "486.159.357-00" },
    fotos: [], documentos: [{ nome: "Matrícula", tipo: "PDF", dataUpload: "2026-03-28" }, { nome: "Laudo de Avaliação", tipo: "PDF", dataUpload: "2026-03-28" }],
  },
  {
    id: "16", codigo: "HR0163", nome: "Cobertura Duplex Central",
    tipo: "Cobertura", valor: 1500000, status: "Em negociação", corretor: "Hans",
    descricao: "Cobertura duplex no centro de Sinop com 3 suítes, terraço com churrasqueira, jacuzzi e vista panorâmica da cidade.",
    area: "220m²", quartos: 3, banheiros: 3, vagas: 2,
    endereco: { rua: "Av. das Itaúbas", numero: "1500", bairro: "Centro", condominio: "Edifício Premium Tower", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Patrícia Moraes", telefone: "(66) 99422-1100", email: "patricia.moraes@email.com", cpfCnpj: "159.486.357-00" },
    fotos: [], documentos: [{ nome: "Escritura", tipo: "PDF", dataUpload: "2026-02-25" }],
  },
  {
    id: "17", codigo: "GB0162", nome: "Casa Condomínio Alphaville",
    tipo: "Casa", valor: 6800000, status: "Disponível", corretor: "Gabriel",
    descricao: "Casa contemporânea no Alphaville Sinop com 5 suítes, home office, espaço fitness, piscina com cascata e garagem subterrânea.",
    area: "520m²", quartos: 5, banheiros: 6, vagas: 5,
    endereco: { rua: "Rua Alpha", numero: "300", bairro: "Alphaville", condominio: "Alphaville Sinop", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Renato Gonçalves", telefone: "(66) 99311-9988", email: "renato.goncalves@email.com", cpfCnpj: "486.357.159-00" },
    fotos: [], documentos: [{ nome: "Matrícula", tipo: "PDF", dataUpload: "2026-01-15" }, { nome: "IPTU 2026", tipo: "PDF", dataUpload: "2026-02-01" }],
  },
  {
    id: "18", codigo: "HR0161", nome: "Terreno Premium Nações",
    tipo: "Terreno", valor: 1200000, status: "Disponível", corretor: "Hans",
    descricao: "Terreno premium de 800m² no Residencial Nações com topografia plana, esquina privilegiada e infraestrutura completa de água, esgoto e fibra.",
    area: "800m²", quartos: 0, banheiros: 0, vagas: 0,
    endereco: { rua: "Av. das Nações", numero: "100", bairro: "Nações", condominio: "Residencial Nações", cidade: "Sinop", estado: "MT" },
    proprietario: { nome: "Sérgio Andrade", telefone: "(66) 99200-8877", email: "sergio.andrade@email.com", cpfCnpj: "357.159.486-00" },
    fotos: [], documentos: [{ nome: "Matrícula", tipo: "PDF", dataUpload: "2026-03-01" }],
  },
];

// Versão para o site público (sem dados sensíveis do proprietário)
export const IMOVEIS_SITE = IMOVEIS_CRM.map(({ proprietario, documentos, fotos, ...rest }) => rest);
