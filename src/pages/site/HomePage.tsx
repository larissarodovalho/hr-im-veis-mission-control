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

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [80, 0, 0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.95, 1, 1, 0.96]);
  const rotateX = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [3, 0, 0, -2]);

  return (
    <motion.section ref={ref} style={{ y, opacity, scale, rotateX, perspective: 1200 }} className={className}>
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
      <motion.img src={src} alt={alt} style={{ y }} className="w-full h-[120%] object-cover" loading="lazy" />
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const pageRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 100]);

  return (
    <div ref={pageRef} className="bg-[#050505]">
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative h-screen flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img src={heroBg} alt="Imóveis de alto padrão em Sinop" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>

        {/* Subtle line overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 119px, rgba(255,255,255,0.15) 120px)" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 48 }}
            transition={{ duration: 1.2, delay: 0.2, ease }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mb-8"
          />

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            transition={{ duration: 1.5, delay: 0.3, ease }}
            className="text-[11px] uppercase text-white/25 font-light mb-8"
          >
            Sinop — Mato Grosso
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease }}
            className="text-4xl sm:text-6xl lg:text-[5.5rem] font-extralight leading-[1.02] tracking-[-0.03em] mb-8"
          >
            Seu novo lar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
              começa aqui.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-sm sm:text-base text-white/30 max-w-lg mb-12 font-light leading-[1.8] tracking-wide"
          >
            Casas, terrenos e apartamentos de alto padrão nos melhores condomínios fechados.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex gap-4"
          >
            <Link
              to="/site/imoveis"
              className="group inline-flex items-center gap-3 px-9 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-amber-50 transition-all duration-500"
            >
              Explorar Imóveis
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/site/contato"
              className="inline-flex items-center gap-2 px-9 py-3.5 rounded-full border border-white/[0.08] text-white/30 text-[11px] font-light tracking-[0.15em] uppercase hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-white/50 transition-all duration-500"
            >
              Contato
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-[1px] h-10 bg-gradient-to-b from-white/15 to-transparent"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Statement ─── */}
      <ScrollSection className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 32 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease }}
              className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-8"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: smoothEase }}
              className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-10"
            >
              Exclusividade
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.2, delay: 0.1, ease }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extralight leading-[1.12] tracking-[-0.02em]"
            >
              Imóveis que definem{" "}
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5, ease }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 italic font-light"
              >
                um novo padrão
              </motion.span>{" "}
              de viver.
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.2, delay: 0.2, ease }}
            className="aspect-[4/3] rounded-3xl overflow-hidden"
          >
            <motion.img
              src={property3}
              alt="Imóvel de alto padrão"
              className="w-full h-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.8, ease: smoothEase }}
            />
          </motion.div>
        </div>
      </ScrollSection>

      {/* ─── Full-width Parallax ─── */}
      <ScrollSection className="relative h-[75vh] sm:h-[85vh]">
        <ParallaxImage src={sectionLiving} alt="Interior de luxo" className="absolute inset-0 h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-[#050505]/20" />
        <div className="relative z-10 flex items-center justify-center h-full max-w-5xl mx-auto px-6 text-center">
          <div>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease }}
              className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent mx-auto mb-10"
            />
            <motion.h2
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.4, ease }}
              className="text-3xl sm:text-5xl lg:text-7xl font-extralight leading-[1.12] tracking-[-0.02em]"
            >
              Cada detalhe pensado para quem valoriza{" "}
              <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60">
                sofisticação
              </span>{" "}
              e qualidade de vida.
            </motion.h2>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Diferenciais ─── */}
      <ScrollSection className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 32 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-8"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: smoothEase }}
                className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light"
              >
                Nossos Diferenciais
              </motion.p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.03] rounded-3xl overflow-hidden">
            {[
              { num: "01", title: "Curadoria Exclusiva", desc: "Seleção criteriosa dos melhores imóveis em condomínios fechados de Sinop." },
              { num: "02", title: "Segurança Jurídica", desc: "Assessoria completa em documentação e negociação." },
              { num: "03", title: "Atendimento Personalizado", desc: "Consultoria dedicada para encontrar o imóvel perfeito." },
              { num: "04", title: "Tradição & Confiança", desc: "14 anos de experiência no mercado imobiliário de alto padrão." },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.15, ease }}
                className="bg-[#050505] p-10 sm:p-14 group hover:bg-white/[0.02] transition-all duration-700 cursor-default"
              >
                <span className="inline-block text-[11px] text-transparent bg-clip-text bg-gradient-to-r from-amber-300/60 to-amber-100/40 tracking-[0.4em] font-light mb-8 group-hover:from-amber-300 group-hover:to-amber-100 transition-all duration-700">
                  {item.num}
                </span>
                <h3 className="font-light text-lg sm:text-xl mb-5 tracking-wide text-white/80 group-hover:text-white/95 transition-colors duration-700">
                  {item.title}
                </h3>
                <p className="text-sm text-white/30 leading-[1.8] font-light group-hover:text-white/35 transition-colors duration-700">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ─── Imóveis em Destaque ─── */}
      <ScrollSection className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 32 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-8"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: smoothEase }}
                className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-4"
              >
                Portfolio
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.1, ease }}
                className="text-3xl sm:text-4xl font-extralight tracking-wide"
              >
                Imóveis em destaque
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                to="/site/imoveis"
                className="hidden sm:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors duration-500 font-light"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-white/[0.03] rounded-3xl overflow-hidden">
            {destaque.map((imovel, i) => (
              <motion.div
                key={imovel.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.15, ease }}
              >
                <Link
                  to={`/site/imovel/${imovel.id}`}
                  className="group block bg-[#050505] hover:bg-white/[0.02] transition-all duration-700"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <motion.img
                      src={propertyImages[i] || property1}
                      alt={imovel.nome}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.8, ease: smoothEase }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] uppercase tracking-[0.4em] text-white/25 font-light">{imovel.tipo}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-amber-300/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500" />
                    </div>
                    <h3 className="font-light text-base mb-3 tracking-wide text-white/80 group-hover:text-white/95 transition-colors duration-500">
                      {imovel.nome}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[11px] text-white/25 mb-6 font-light tracking-[0.15em]">
                      <MapPin className="h-2.5 w-2.5" /> Sinop, MT
                    </p>
                    <p className="text-xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 tracking-wide">
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
            className="sm:hidden mt-12 text-center"
          >
            <Link
              to="/site/imoveis"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.08] text-white/30 text-[11px] font-light tracking-[0.15em] uppercase hover:bg-white/[0.04] transition-all duration-500"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </ScrollSection>

      {/* ─── Comprar ou Vender ─── */}
      <ScrollSection className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 40 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent mx-auto mb-10"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-10 text-center"
          >
            Como podemos ajudar
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.03] rounded-3xl overflow-hidden">
            {/* Comprar */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease }}
            >
              <div className="relative bg-[#050505] overflow-hidden h-full group">
                <img src={property1} alt="Comprar imóvel" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-1000" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/60" />
                <div className="relative p-12 sm:p-20 text-center flex flex-col items-center">
                  <MessageCircle className="h-7 w-7 text-white/20 mb-8" />
                  <h3 className="text-2xl sm:text-3xl font-extralight tracking-wide mb-5">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">comprar</span> um imóvel?
                  </h3>
                  <p className="text-sm text-white/30 font-light leading-[1.8] max-w-sm mb-10">
                    Nossa equipe de consultores vai te ajudar a encontrar o imóvel perfeito para você e sua família.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link
                      to="/site/contato"
                      className="group/btn inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-amber-50 transition-all duration-500"
                    >
                      Fale com um Consultor
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                    <a
                      href="https://wa.me/5566999990000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.08] text-white/30 text-[11px] font-light tracking-[0.12em] uppercase hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-500"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Vender */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.15, ease }}
            >
              <div className="relative bg-[#050505] overflow-hidden h-full group">
                <img src={featureInterior} alt="Vender imóvel" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-1000" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/60" />
                <div className="relative p-12 sm:p-20 text-center flex flex-col items-center">
                  <Building2 className="h-7 w-7 text-white/20 mb-8" />
                  <h3 className="text-2xl sm:text-3xl font-extralight tracking-wide mb-5">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">vender</span> seu imóvel?
                  </h3>
                  <p className="text-sm text-white/30 font-light leading-[1.8] max-w-sm mb-10">
                    Avaliamos e anunciamos seu imóvel com exclusividade. Alcance compradores qualificados com a HR Imóveis.
                  </p>
                  <Link
                    to="/site/contato"
                    className="group/btn inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-white/[0.08] text-white/30 text-[11px] font-light tracking-[0.12em] uppercase hover:border-white/[0.15] hover:text-white/50 hover:bg-white/[0.04] transition-all duration-500"
                  >
                    Quero Vender meu Imóvel
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Newsletter ─── */}
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
    <ScrollSection className="py-24 sm:py-32 border-t border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          whileInView={{ opacity: 1, width: 40 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent mx-auto mb-10"
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-8"
        >
          Newsletter
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-2xl sm:text-4xl font-extralight tracking-wide mb-5"
        >
          Fique por dentro do mercado{" "}
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">
            imobiliário
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-sm text-white/30 font-light max-w-md mx-auto mb-12 leading-[1.8]"
        >
          Receba informações exclusivas sobre novos imóveis, tendências do mercado e novidades da região de Sinop.
        </motion.p>
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-6 py-3.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-white/25 font-light tracking-wide focus:outline-none focus:border-white/[0.15] transition-all duration-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-amber-50 transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Inscrever-se"}
          </button>
        </motion.form>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[10px] text-white/20 mt-5 font-light tracking-[0.2em]"
        >
          Sem spam. Cancele quando quiser.
        </motion.p>
      </div>
    </ScrollSection>
  );
}
