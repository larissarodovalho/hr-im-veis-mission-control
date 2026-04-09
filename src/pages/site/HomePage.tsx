import { Link } from "react-router-dom";
import { imoveis } from "@/data/mockData";
import { ArrowRight, MapPin, ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroBg from "@/assets/hero-dark.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import sectionCommunity from "@/assets/section-community.jpg";

const destaque = imoveis.filter((i) => i.status === "Disponível").slice(0, 3);

function formatPrice(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ParallaxImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y }}
        className="w-full h-[120%] object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 80]);

  return (
    <div className="bg-[#0a0a0a]">
      {/* Hero — full screen with parallax */}
      <section ref={heroRef} className="relative h-screen flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img
            src={heroBg}
            alt="Imóveis de alto padrão em Sinop"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-24 w-full"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4"
          >
            Sinop — Mato Grosso
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold leading-[0.9] tracking-tight mb-6"
          >
            Seu novo lar
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              começa aqui.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base sm:text-lg text-white/40 max-w-md mb-8"
          >
            Casas, terrenos e apartamentos de alto padrão nos melhores condomínios.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-3"
          >
            <Link
              to="/site/imoveis"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
            >
              Ver Imóveis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/site/contato"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Fale Conosco
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Statement section */}
      <section className="py-32 sm:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-6">Alto padrão</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight max-w-4xl">
              Imóveis que definem{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                um novo padrão
              </span>{" "}
              de viver.
            </h2>
          </FadeIn>
        </div>
      </section>

      {/* Full-width image with parallax */}
      <section className="relative h-[70vh] sm:h-[80vh]">
        <ParallaxImage src={sectionLiving} alt="Interior de luxo" className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
        <div className="relative z-10 flex items-end h-full max-w-7xl mx-auto px-6 pb-16">
          <FadeIn>
            <p className="text-2xl sm:text-3xl font-display font-medium text-white/80 max-w-xl leading-snug">
              Cada detalhe pensado para quem valoriza qualidade de vida e sofisticação.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Features — minimal grid */}
      <section className="py-32 sm:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-16">Por que HR Imóveis</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {[
              { num: "01", title: "Seleção Exclusiva", desc: "Curadoria dos melhores imóveis em condomínios fechados de Sinop." },
              { num: "02", title: "Segurança Jurídica", desc: "Documentação completa e assessoria jurídica em todas as negociações." },
              { num: "03", title: "Atendimento Premium", desc: "Corretores especializados para encontrar o imóvel ideal para você." },
              { num: "04", title: "Experiência", desc: "Anos de atuação no mercado imobiliário de alto padrão." },
            ].map((item, i) => (
              <FadeIn key={item.num} delay={i * 0.1}>
                <div className="bg-[#0a0a0a] p-8 sm:p-10 h-full">
                  <span className="text-xs text-white/20 font-mono">{item.num}</span>
                  <h3 className="font-display font-bold text-lg mt-4 mb-3">{item.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured properties */}
      <section className="py-32 sm:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <div>
              <FadeIn>
                <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">Destaques</p>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                  Imóveis em destaque
                </h2>
              </FadeIn>
            </div>
            <FadeIn delay={0.2}>
              <Link
                to="/site/imoveis"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {destaque.map((imovel, i) => (
              <FadeIn key={imovel.id} delay={i * 0.1}>
                <Link
                  to={`/site/imoveis/${imovel.id}`}
                  className="group block bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      className="w-full h-full bg-gradient-to-br from-amber-900/20 to-amber-700/5 flex items-center justify-center"
                    >
                      <span className="text-6xl text-white/5 font-display font-bold">{imovel.tipo[0]}</span>
                    </motion.div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">{imovel.tipo}</span>
                      <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-amber-300 transition-colors">
                      {imovel.nome}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-white/25 mb-4">
                      <MapPin className="h-3 w-3" /> Sinop, MT
                    </p>
                    <p className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                      {formatPrice(imovel.valor)}
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="sm:hidden mt-8 text-center">
              <Link
                to="/site/imoveis"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all"
              >
                Ver todos os imóveis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Community image section */}
      <section className="relative h-[70vh] sm:h-[80vh]">
        <ParallaxImage src={sectionCommunity} alt="Condomínio fechado" className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
      </section>

      {/* Numbers */}
      <section className="py-32 sm:py-44">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {[
              { num: "200+", label: "Imóveis Vendidos" },
              { num: "500+", label: "Clientes Satisfeitos" },
              { num: "10+", label: "Anos de Experiência" },
              { num: "50+", label: "Condomínios" },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-5xl sm:text-6xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                    {s.num}
                  </p>
                  <p className="text-xs text-white/25 mt-2 uppercase tracking-wider">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 sm:py-44">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
              Pronto para encontrar
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                seu imóvel ideal?
              </span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-base text-white/30 max-w-md mx-auto mb-10">
              Entre em contato e deixe nossa equipe te ajudar a realizar o sonho da casa própria.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/site/contato"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all"
              >
                Fale com um Corretor <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/5566999990000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 transition-all"
              >
                WhatsApp
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
