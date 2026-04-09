import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import hrLogo from "@/assets/hr-imoveis-logo.png";

const navLinks = [
  { label: "Início", to: "/site" },
  { label: "Imóveis", to: "/site/imoveis" },
  { label: "Sobre", to: "/site/sobre" },
  { label: "Contato", to: "/site/contato" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="bg-foreground text-background text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> (66) 99999-0000</span>
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> contato@hrimoveis.com.br</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-accent transition-colors"><Instagram className="h-3.5 w-3.5" /></a>
            <a href="#" className="hover:text-accent transition-colors"><Facebook className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/site" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center overflow-hidden">
              <img src={hrLogo} alt="HR Imóveis" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight">HR Imóveis</span>
              <span className="block text-[10px] text-muted-foreground -mt-1">Realizando sonhos em Sinop</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/site/contato"
            className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Fale Conosco
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden">
                  <img src={hrLogo} alt="HR Imóveis" className="w-8 h-8 object-contain" />
                </div>
                <span className="font-display font-bold text-lg">HR Imóveis</span>
              </div>
              <p className="text-sm text-background/60 leading-relaxed">
                A HR Imóveis é referência no mercado imobiliário de Sinop-MT, oferecendo os melhores imóveis de alto padrão com atendimento personalizado.
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-background/70">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold mb-4">Contato</h4>
              <ul className="space-y-3 text-sm text-background/70">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Sinop, Mato Grosso</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> (66) 99999-0000</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> contato@hrimoveis.com.br</li>
              </ul>
              <div className="flex gap-3 mt-4">
                <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 mt-8 pt-6 text-center text-xs text-background/40">
            © {new Date().getFullYear()} HR Imóveis. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
