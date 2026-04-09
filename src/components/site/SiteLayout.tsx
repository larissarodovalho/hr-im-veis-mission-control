import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, Instagram, Facebook, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import hrLogo from "@/assets/logo-hr-branco.png";

const navLinks = [
  { label: "Início", to: "/site" },
  { label: "Imóveis", to: "/site/imoveis" },
  { label: "Sobre", to: "/site/sobre" },
  { label: "Contato", to: "/site/contato" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* Sticky Nav */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/site">
            <img src={hrLogo} alt="HR Imóveis" className="h-7 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  location.pathname === link.to
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/site/contato"
              className="hidden sm:inline-flex px-5 py-1.5 rounded-full text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
            >
              Fale Conosco
            </Link>
            <button
              className="md:hidden text-white/70"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? "bg-white/10 text-white"
                        : "text-white/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer — minimal Apple-style */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
              <img src={hrLogo} alt="HR Imóveis" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-xs text-white/30 leading-relaxed max-w-sm">
                Referência no mercado imobiliário de Sinop-MT. Imóveis de alto padrão com atendimento personalizado.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Navegação</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Contato</h4>
              <ul className="space-y-2 text-xs text-white/30">
                <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> (66) 99999-0000</li>
                <li className="flex items-center gap-2"><Mail className="h-3 w-3" /> contato@hrimoveis.com.br</li>
              </ul>
              <div className="flex gap-2 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-white/60">
                  <Instagram className="h-3.5 w-3.5" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/30 hover:text-white/60">
                  <Facebook className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-8 pt-6 text-center text-[10px] text-white/20">
            © {new Date().getFullYear()} HR Imóveis. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
