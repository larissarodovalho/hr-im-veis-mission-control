import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Building2, Target, Heart, Shield, TrendingUp, ArrowUpRight } from "lucide-react";
import sectionCommunity from "@/assets/section-community.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import featureInterior from "@/assets/feature-interior.jpg";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

function ScrollSection({ children, className = "", index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 0.15, 0.8, 1], [60, 0, 0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.8, 1], [0.95, 1, 1, 0.97]);
  const rotateX = useTransform(scrollYProgress, [0, 0.15, 0.8, 1], [3, 0, 0, -2]);
  const filter = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], ["blur(4px)", "blur(0px)", "blur(0px)", "blur(2px)"]);

  return (
    <motion.section
      ref={ref}
      style={{ y, opacity, scale, rotateX, filter, perspective: 1200, transformStyle: "preserve-3d", zIndex: index }}
      className={`relative ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none" />
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
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

const valores = [
  { icon: Target, title: "Excelência", desc: "Atenção personalizada e soluções sob medida para cada cliente." },
  { icon: Heart, title: "Compromisso", desc: "Dedicação genuína na realização do sonho de cada família." },
  { icon: Shield, title: "Confiança", desc: "14 anos de reputação construída com transparência e resultados." },
  { icon: TrendingUp, title: "Inovação", desc: "Tecnologia e práticas modernas para uma experiência eficiente." },
];

export default function SobrePage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 100]);

  return (
    <div className="bg-[#050505]">
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative h-screen flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img src={sectionCommunity} alt="HR Imóveis — Sobre nós" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>

        {/* Line overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 119px, rgba(255,255,255,0.15) 120px)" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full flex flex-col items-center text-center"
        >
          {/* Amber accent */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 48 }}
            transition={{ duration: 1.2, delay: 0.2, ease }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mb-8"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/30 tracking-[0.3em] uppercase">
              <Building2 className="h-3 w-3" />
              Desde 2012
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease }}
            className="text-4xl sm:text-6xl lg:text-[5.5rem] font-extralight leading-[1.02] tracking-[-0.03em] mb-8"
          >
            14 anos transformando{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
              sonhos em endereços.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-sm sm:text-base text-white/30 max-w-lg mb-12 font-light leading-[1.8] tracking-wide"
          >
            Uma experiência imobiliária diferente em Sinop. Atendimento humanizado e conhecimento profundo do mercado local.
          </motion.p>

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

      {/* ─── Nossa História ─── */}
      <ScrollSection className="py-10 sm:py-14 -mt-12" index={1}>
        <div className="max-w-7xl mx-auto px-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ParallaxImage
              src={sectionCommunity}
              alt="HR Imóveis"
              className="rounded-2xl aspect-[3/4] lg:aspect-[4/5]"
            />
            <div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 32 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-6"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 0.8 }}
                className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-8"
              >
                Nossa história
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-80px" }}
                transition={{ duration: 1.2, delay: 0.1, ease }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.12] tracking-[-0.02em] mb-8"
              >
                Referência no mercado{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
                  imobiliário de Sinop
                </span>
              </motion.h2>
              <div className="space-y-5">
                {[
                  "Fundada em 2012, a HR Imóveis surgiu com a missão de trazer um novo padrão de atendimento ao mercado imobiliário de Sinop. Ao longo de 14 anos, construímos uma trajetória sólida baseada em confiança, transparência e resultados.",
                  "Com profundo conhecimento da região e dos melhores empreendimentos, oferecemos consultoria especializada para quem busca imóveis de alto padrão.",
                  "Hoje, somos reconhecidos como uma das imobiliárias mais confiáveis de Sinop, com centenas de famílias atendidas e uma carteira de imóveis que reflete o melhor da cidade."
                ].map((text, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: smoothEase }}
                    className="text-sm text-white/30 font-light leading-[1.9]"
                  >
                    {text}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Quote Divider ─── */}
      <ScrollSection className="py-10 sm:py-14 -mt-12" index={2}>
        <div className="relative z-20">
          <div className="relative h-[50vh] overflow-hidden rounded-none">
            <ParallaxImage
              src={featureInterior}
              alt="Interior de alto padrão"
              className="absolute inset-0 h-full"
            />
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="text-center max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  whileInView={{ opacity: 1, width: 48 }}
                  viewport={{ margin: "-40px" }}
                  transition={{ duration: 1.2, ease }}
                  className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mx-auto mb-8"
                />
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-80px" }}
                  transition={{ duration: 1.2, ease }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-extralight text-white/70 tracking-[-0.02em] leading-[1.4]"
                >
                  Encontrar o imóvel ideal vai além de metros quadrados,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light italic">
                    é sobre encontrar um lugar que transforme vidas.
                  </span>
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Valores ─── */}
      <ScrollSection className="py-10 sm:py-14 -mt-12" index={3}>
        <div className="max-w-6xl mx-auto px-6 relative z-20">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 48 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 1.2, ease }}
              className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8 }}
              className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-6"
            >
              Nossos valores
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-80px" }}
              transition={{ duration: 1.2, ease }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-[-0.02em]"
            >
              O que nos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
                move.
              </span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04] rounded-2xl overflow-hidden">
            {valores.map((valor, i) => (
              <motion.div
                key={valor.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7, ease }}
                className="bg-[#050505] p-8 group hover:bg-white/[0.02] transition-all duration-700"
              >
                <valor.icon className="h-5 w-5 text-amber-300/30 mb-6 group-hover:text-amber-300/60 transition-colors duration-700" />
                <h4 className="text-sm font-medium text-white/60 mb-3 tracking-wide group-hover:text-white/80 transition-colors duration-500">
                  {valor.title}
                </h4>
                <p className="text-xs text-white/20 leading-relaxed font-light group-hover:text-white/35 transition-colors duration-700">
                  {valor.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ─── Missão ─── */}
      <ScrollSection className="py-10 sm:py-14 -mt-12" index={4}>
        <div className="max-w-7xl mx-auto px-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 32 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-6"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 0.8 }}
                className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-8"
              >
                Nossa missão
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-80px" }}
                transition={{ duration: 1.2, delay: 0.1, ease }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.12] tracking-[-0.02em] mb-8"
              >
                Conectar pessoas aos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
                  melhores imóveis de Sinop.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: smoothEase }}
                className="text-sm text-white/30 font-light leading-[1.9]"
              >
                Nossa missão é proporcionar a melhor experiência na compra, venda e locação de imóveis de alto padrão
                em Sinop e região. Acreditamos que encontrar o imóvel ideal vai além de metros quadrados,
                é sobre encontrar um lugar que transforme a vida das pessoas.
              </motion.p>
            </div>
            <ParallaxImage
              src={sectionLiving}
              alt="Missão HR Imóveis"
              className="rounded-2xl aspect-[3/4] lg:aspect-[4/5]"
            />
          </div>
        </div>
      </ScrollSection>

      {/* ─── CTA Final ─── */}
      <ScrollSection className="py-10 sm:py-14 -mt-12" index={5}>
        <div className="max-w-7xl mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 48 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 1.2, ease }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.5em" }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 1.2, ease }}
            className="text-[11px] uppercase text-white/25 font-light mb-8"
          >
            Próximo passo
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-80px" }}
            transition={{ duration: 1.2, delay: 0.1, ease }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.12] tracking-[-0.02em] mb-4"
          >
            Vamos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
              conversar?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm text-white/30 font-light mb-10 max-w-md mx-auto leading-[1.8]"
          >
            Entre em contato e descubra como podemos ajudar você a encontrar o imóvel ideal em Sinop.
          </motion.p>

          <motion.a
            href="https://wa.me/5566999990000?text=Olá! Gostaria de saber mais sobre a HR Imóveis."
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-3 px-9 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-amber-50 transition-all duration-500"
          >
            Falar com a equipe
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </motion.a>
        </div>
      </ScrollSection>

      {/* Bottom spacer */}
      <div className="h-24" />
    </div>
  );
}
