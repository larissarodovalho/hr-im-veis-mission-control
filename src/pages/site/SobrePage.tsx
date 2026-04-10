import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Building2, Target, Heart, Shield, TrendingUp } from "lucide-react";
import sectionCommunity from "@/assets/section-community.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import featureInterior from "@/assets/feature-interior.jpg";

const ease = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [80, 0, 0, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.97]);

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
}

function ParallaxImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img src={src} alt={alt} style={{ y }} className="w-full h-[120%] object-cover" />
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
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.5], [1, 0.95]);

  const textRef = useRef(null);
  const { scrollYProgress: textProgress } = useScroll({ target: textRef, offset: ["start end", "center center"] });
  const textOpacity = useTransform(textProgress, [0, 0.5, 1], [0, 0.3, 1]);
  const textX = useTransform(textProgress, [0, 1], [-40, 0]);

  return (
    <div className="min-h-screen">
      {/* Hero — full viewport with parallax */}
      <motion.section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Ambient glow */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[120px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-[100px]"
          animate={{ scale: [1.1, 1, 1.1], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />

        <motion.div style={{ y: heroY }} className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] text-white/30 tracking-widest uppercase">
              <Building2 className="h-3 w-3" />
              Desde 2012
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease }}
            className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tighter text-white/90 mb-8 leading-[0.95]"
          >
            14 anos
            <br />
            <span className="text-white/20">transformando sonhos</span>
            <br />
            <span className="text-white/40">em endereços</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-sm md:text-base text-white/20 font-light max-w-lg mx-auto leading-relaxed"
          >
            Uma experiência imobiliária diferente em Sinop.
            <br className="hidden md:block" />
            Atendimento humanizado. Conhecimento profundo do mercado local.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-[-120px] left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Spacer */}
      <div className="h-32" />

      {/* Story — parallax image + text */}
      <ScrollReveal className="max-w-6xl mx-auto px-6 mb-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <ParallaxImage
            src={sectionCommunity}
            alt="HR Imóveis"
            className="rounded-3xl aspect-[3/4] lg:aspect-[4/5]"
          />
          <motion.div ref={textRef} style={{ opacity: textOpacity, x: textX }}>
            <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6 block">Nossa história</span>
            <h2 className="text-3xl md:text-4xl font-extralight text-white/90 mb-8 leading-[1.1] tracking-tight">
              Referência no mercado
              <br />
              <span className="text-white/30">imobiliário de Sinop</span>
            </h2>
            <div className="space-y-5 text-sm text-white/30 font-light leading-[1.8]">
              <p>
                Fundada em 2012, a HR Imóveis surgiu com a missão de trazer um novo padrão de atendimento
                ao mercado imobiliário de Sinop. Ao longo de 14 anos, construímos uma trajetória sólida
                baseada em confiança, transparência e resultados.
              </p>
              <p>
                Com profundo conhecimento da região e dos melhores empreendimentos, oferecemos consultoria
                especializada para quem busca imóveis de alto padrão. Nossa equipe é formada por profissionais
                apaixonados pelo que fazem.
              </p>
              <p>
                Hoje, somos reconhecidos como uma das imobiliárias mais confiáveis de Sinop,
                com centenas de famílias atendidas e uma carteira de imóveis que reflete o melhor da cidade.
              </p>
            </div>
          </motion.div>
        </div>
      </ScrollReveal>

      {/* Full-width parallax divider */}
      <ScrollReveal className="mb-40">
        <div className="relative h-[50vh] overflow-hidden">
          <ParallaxImage
            src={featureInterior}
            alt="Interior de alto padrão"
            className="absolute inset-0 h-full"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.p
              className="text-2xl md:text-4xl font-extralight text-white/70 tracking-tight text-center px-6 max-w-3xl leading-[1.3]"
            >
              Encontrar o imóvel ideal vai além de metros quadrados,
              <span className="text-white/30"> é sobre encontrar um lugar que transforme vidas</span>
            </motion.p>
          </div>
        </div>
      </ScrollReveal>

      {/* Valores — staggered cards */}
      <ScrollReveal className="max-w-5xl mx-auto px-6 mb-40">
        <div className="text-center mb-16">
          <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-4 block">Nossos valores</span>
          <h2 className="text-3xl md:text-4xl font-extralight text-white/90 tracking-tight">
            O que nos move
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-3xl overflow-hidden">
          {valores.map((valor, i) => (
            <motion.div
              key={valor.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7, ease }}
              className="bg-[#0a0a0a] p-10 group hover:bg-white/[0.02] transition-colors duration-700"
            >
              <valor.icon className="h-5 w-5 text-white/15 mb-6 group-hover:text-white/40 transition-colors duration-700" />
              <h4 className="text-sm font-medium text-white/60 mb-3 tracking-wide">{valor.title}</h4>
              <p className="text-xs text-white/25 leading-relaxed font-light group-hover:text-white/40 transition-colors duration-700">
                {valor.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </ScrollReveal>

      {/* Missão — reversed layout */}
      <ScrollReveal className="max-w-6xl mx-auto px-6 mb-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6 block">Nossa missão</span>
            <h2 className="text-3xl md:text-4xl font-extralight text-white/90 mb-8 leading-[1.1] tracking-tight">
              Conectar pessoas aos
              <br />
              <span className="text-white/30">melhores imóveis de Sinop</span>
            </h2>
            <p className="text-sm text-white/30 font-light leading-[1.8]">
              Nossa missão é proporcionar a melhor experiência na compra, venda e locação de imóveis de alto padrão
              em Sinop e região. Acreditamos que encontrar o imóvel ideal vai além de metros quadrados,
              é sobre encontrar um lugar que transforme a vida das pessoas.
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <ParallaxImage
              src={sectionLiving}
              alt="Missão HR Imóveis"
              className="rounded-3xl aspect-[3/4] lg:aspect-[4/5]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* CTA — minimal */}
      <ScrollReveal className="max-w-4xl mx-auto px-6 mb-32 text-center">
        <div className="py-20">
          <motion.h3
            className="text-3xl md:text-5xl font-extralight text-white/90 mb-4 tracking-tight"
          >
            Vamos conversar?
          </motion.h3>
          <p className="text-xs text-white/20 font-light mb-10 max-w-sm mx-auto leading-relaxed">
            Entre em contato e descubra como podemos ajudar você a encontrar o imóvel ideal em Sinop.
          </p>
          <motion.a
            href="https://wa.me/5566999990000?text=Olá! Gostaria de saber mais sobre a HR Imóveis."
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full text-xs font-medium bg-white text-black hover:bg-white/90 transition-all tracking-wide"
          >
            Falar com a equipe
          </motion.a>
        </div>
      </ScrollReveal>
    </div>
  );
}
