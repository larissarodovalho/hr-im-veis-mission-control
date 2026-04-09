import { Link } from "react-router-dom";
import { imoveis } from "@/data/mockData";
import { ArrowRight, Home, Shield, Users, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroBg from "@/assets/hero-bg.jpg";

const destaque = imoveis.filter((i) => i.status === "Disponível").slice(0, 6);

const diferenciais = [
  {
    icon: Home,
    title: "Imóveis de Alto Padrão",
    desc: "Seleção exclusiva dos melhores imóveis em condomínios fechados de Sinop.",
  },
  {
    icon: Shield,
    title: "Segurança Jurídica",
    desc: "Documentação completa e assessoria jurídica em todas as negociações.",
  },
  {
    icon: Users,
    title: "Atendimento Personalizado",
    desc: "Corretores especializados para encontrar o imóvel ideal para você.",
  },
  {
    icon: Star,
    title: "Experiência no Mercado",
    desc: "Anos de experiência no mercado imobiliário de Sinop e região.",
  },
];

function formatPrice(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt="Imóveis de alto padrão"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center md:text-left w-full">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-accent text-accent-foreground border-0 px-4 py-1 text-sm font-semibold">
              Sinop — Mato Grosso
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white leading-tight mb-4">
              Seu novo lar{" "}
              <span className="text-accent">começa aqui.</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-lg">
              Encontre o imóvel dos seus sonhos com a HR Imóveis. Casas, terrenos e apartamentos de alto padrão nos melhores condomínios.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/site/imoveis">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base px-8">
                  Ver Imóveis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/site/contato">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold text-base px-8">
                  Fale Conosco
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">Por que escolher a <span className="text-primary">HR Imóveis</span>?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Comprometidos em encontrar o imóvel perfeito para cada cliente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {diferenciais.map((d) => (
              <Card key={d.title} className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <d.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Imóveis em Destaque */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold">Imóveis em <span className="text-accent">Destaque</span></h2>
              <p className="text-muted-foreground mt-1">Os melhores imóveis selecionados para você.</p>
            </div>
            <Link to="/site/imoveis" className="hidden sm:flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destaque.map((imovel) => (
              <Card key={imovel.id} className="overflow-hidden group hover:shadow-xl transition-all border-0 shadow-md">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <Home className="h-16 w-16 text-primary/30" />
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0 text-xs">
                    {imovel.tipo}
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {imovel.nome}
                  </h3>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5" /> Sinop, MT
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-display font-extrabold text-primary">
                      {formatPrice(imovel.valor)}
                    </span>
                    <Link to={`/site/imoveis/${imovel.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link to="/site/imoveis">
              <Button variant="outline" className="w-full">
                Ver todos os imóveis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sobre / CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Pronto para encontrar seu imóvel ideal?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
            Entre em contato conosco e deixe nossa equipe de corretores especializados te ajudar a realizar o sonho da casa própria.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/site/contato">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8">
                Fale com um Corretor
              </Button>
            </Link>
            <a href="https://wa.me/5566999990000" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-bold px-8">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: "200+", label: "Imóveis Vendidos" },
              { num: "500+", label: "Clientes Satisfeitos" },
              { num: "10+", label: "Anos de Experiência" },
              { num: "50+", label: "Condomínios Atendidos" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-display font-extrabold text-primary">{s.num}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
