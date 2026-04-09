import { Link } from "react-router-dom";
import { imoveis } from "@/data/mockData";
import { ArrowRight, MapPin, ArrowUpRight, MessageCircle, Building2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hrLogo from "@/assets/logo-hr-branco.png";
import heroBg from "@/assets/hero-dark.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import sectionCommunity from "@/assets/section-community.jpg";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import featureInterior from "@/assets/feature-interior.jpg";

const propertyImages = [property1, property2, property3];

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

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.3, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.97, 1, 1, 0.97]);

  return (
    <motion.section ref={ref} style={{ y, opacity, scale }} className={className}>
      {children}
    </motion.section>
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
  const pageRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 80]);


  return (
    <div ref={pageRef} className="bg-black">
      {/* Hero */}
      <section ref={heroRef} className="relative h-screen flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img src={heroBg} alt="Imóveis de alto padrão em Sinop" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-[black] via-[black]/40 to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-28 w-full flex flex-col items-center text-center"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-[11px] uppercase tracking-[0.4em] text-white/30 font-light mb-6"
          >
            Sinop — Mato Grosso
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-4xl sm:text-6xl lg:text-[5.5rem] font-display font-light leading-[1.05] tracking-[-0.02em] mb-6"
          >
            Seu novo lar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 font-normal italic">
              começa aqui.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-sm sm:text-base text-white/30 max-w-lg mb-10 font-light leading-relaxed tracking-wide"
          >
            Casas, terrenos e apartamentos de alto padrão nos melhores condomínios fechados.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex gap-4"
          >
            <Link
              to="/site/imoveis"
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-white text-black text-xs font-medium tracking-wide uppercase hover:bg-white/90 transition-all"
            >
              Explorar Imóveis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/site/contato"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-white/15 text-white/50 text-xs font-light tracking-wide uppercase hover:bg-white/5 transition-all"
            >
              Contato
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Statement */}
      <ScrollSection className="py-36 sm:py-48">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light mb-8"
            >
              Exclusividade
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 50, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl font-display font-light leading-[1.15] tracking-[-0.01em]"
            >
              Imóveis que definem{" "}
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 italic font-normal"
              >
                um novo padrão
              </motion.span>{" "}
              de viver.
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="aspect-[4/3] rounded-2xl overflow-hidden"
          >
            <motion.img
              src={property3}
              alt="Imóvel de alto padrão"
              className="w-full h-full object-cover"
              loading="lazy"
              width={800}
              height={600}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
        </div>
      </ScrollSection>

      {/* Full-width image */}
      <ScrollSection className="relative h-[70vh] sm:h-[80vh]">
        <ParallaxImage src={sectionLiving} alt="Interior de luxo" className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        <div className="relative z-10 flex items-center justify-center h-full max-w-5xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-3xl sm:text-5xl lg:text-7xl font-display font-extralight leading-[1.15] tracking-[-0.01em]"
          >
            Cada detalhe pensado para quem valoriza{" "}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100"
            >
              sofisticação
            </motion.span>{" "}
            e qualidade de vida.
          </motion.h2>
        </div>
      </ScrollSection>

      {/* Features */}
      <ScrollSection className="py-36 sm:py-48">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light mb-16"
          >
            Nossos Diferenciais
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-black rounded-2xl overflow-hidden">
            {[
              { num: "01", title: "Curadoria Exclusiva", desc: "Seleção criteriosa dos melhores imóveis em condomínios fechados de Sinop." },
              { num: "02", title: "Segurança Jurídica", desc: "Assessoria completa em documentação e negociação." },
              { num: "03", title: "Atendimento Personalizado", desc: "Consultoria dedicada para encontrar o imóvel perfeito." },
              { num: "04", title: "Tradição & Confiança", desc: "Anos de experiência no mercado imobiliário de alto padrão." },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.2,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)", y: -4 }}
                className="bg-black p-8 sm:p-12 h-full border-b border-r border-white/[0.04] cursor-default transition-colors"
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 + 0.3 }}
                  className="inline-block text-[11px] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 tracking-[0.3em] font-medium"
                >
                  {item.num}
                </motion.span>
                <motion.h3
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.2 + 0.4 }}
                  className="font-display font-normal text-lg sm:text-xl mt-6 mb-4 tracking-wide"
                >
                  {item.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.2 + 0.55 }}
                  className="text-sm text-white/25 leading-relaxed font-light"
                >
                  {item.desc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* Featured properties */}
      <ScrollSection className="py-36 sm:py-48">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light mb-4"
              >
                Portfolio
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                className="text-3xl sm:text-4xl font-display font-light tracking-wide"
              >
                Imóveis em destaque
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                to="/site/imoveis"
                className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white/60 transition-colors font-light"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-black rounded-2xl overflow-hidden">
            {destaque.map((imovel, i) => (
              <motion.div
                key={imovel.id}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, delay: i * 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <Link
                  to={`/site/imoveis/${imovel.id}`}
                  className="group block bg-black hover:bg-white/[0.02] transition-colors"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <motion.img
                      src={propertyImages[i] || property1}
                      alt={imovel.nome}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-light">{imovel.tipo}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                    </div>
                    <h3 className="font-display font-normal text-base mb-2 tracking-wide group-hover:text-amber-200/80 transition-colors">
                      {imovel.nome}
                    </h3>
                    <p className="flex items-center gap-1 text-[10px] text-white/20 mb-5 font-light tracking-wider">
                      <MapPin className="h-2.5 w-2.5" /> Sinop, MT
                    </p>
                    <p className="text-xl font-display font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 tracking-wide">
                      {formatPrice(imovel.valor)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="sm:hidden mt-10 text-center"
          >
            <Link
              to="/site/imoveis"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/40 text-xs font-light tracking-wide uppercase hover:bg-white/5 transition-all"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </ScrollSection>



      {/* CTA — Comprar ou Vender */}
      <ScrollSection className="py-36 sm:py-48">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light mb-8 text-center"
          >
            Como podemos ajudar
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black rounded-2xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="relative bg-black overflow-hidden h-full">
                <img src={property1} alt="Comprar imóvel" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
                <div className="relative p-10 sm:p-16 text-center flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <MessageCircle className="h-8 w-8 text-white/15 mb-6" />
                  </motion.div>
                  <h3 className="text-2xl sm:text-3xl font-display font-light tracking-wide mb-4">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100">comprar</span> um imóvel?
                  </h3>
                  <p className="text-xs text-white/25 font-light leading-relaxed max-w-sm mb-8 tracking-wide">
                    Nossa equipe de consultores vai te ajudar a encontrar o imóvel perfeito para você e sua família.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      to="/site/contato"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black text-xs font-medium tracking-wide uppercase hover:bg-white/90 transition-all"
                    >
                      Fale com um Consultor <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <a
                      href="https://wa.me/5566999990000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/10 text-white/40 text-xs font-light tracking-wide uppercase hover:bg-white/5 transition-all"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="relative bg-black overflow-hidden h-full">
                <img src={featureInterior} alt="Vender imóvel" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
                <div className="relative p-10 sm:p-16 text-center flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Building2 className="h-8 w-8 text-white/15 mb-6" />
                  </motion.div>
                  <h3 className="text-2xl sm:text-3xl font-display font-light tracking-wide mb-4">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100">vender</span> seu imóvel?
                  </h3>
                  <p className="text-xs text-white/25 font-light leading-relaxed max-w-sm mb-8 tracking-wide">
                    Avaliamos e anunciamos seu imóvel com exclusividade. Alcance compradores qualificados com a HR Imóveis.
                  </p>
                  <Link
                    to="/site/contato"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/10 text-white/40 text-xs font-light tracking-wide uppercase hover:border-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                  >
                    Quero Vender meu Imóvel <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers" as any)
        .insert({ email: email.trim().toLowerCase() } as any);
      if (error) {
        if (error.code === "23505") {
          toast.info("Você já está inscrito na nossa newsletter!");
        } else {
          toast.error("Erro ao se inscrever. Tente novamente.");
        }
      } else {
        toast.success("Inscrito com sucesso! Você receberá nossas novidades.");
        setEmail("");
      }
    } catch {
      toast.error("Erro ao se inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollSection className="py-36 sm:py-48 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <FadeIn>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light mb-6">Newsletter</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-display font-light tracking-wide mb-4">
            Fique por dentro do mercado{" "}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-100 font-normal">
              imobiliário
            </span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="text-xs text-white/25 font-light max-w-md mx-auto mb-10 leading-relaxed tracking-wide">
            Receba informações exclusivas sobre novos imóveis, tendências do mercado e novidades da região de Sinop.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 font-light tracking-wide focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 rounded-full bg-white text-black text-xs font-medium tracking-wide uppercase hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Inscrever-se"}
            </button>
          </form>
        </FadeIn>
        <FadeIn delay={0.25}>
          <p className="text-[9px] text-white/15 mt-4 font-light tracking-wider">
            Sem spam. Cancele quando quiser.
          </p>
        </FadeIn>
      </div>
    </ScrollSection>
  );
}
