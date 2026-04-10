import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Building2, Users, Award, MapPin, Target, Heart, Shield, TrendingUp } from "lucide-react";
import sectionCommunity from "@/assets/section-community.jpg";
import sectionLiving from "@/assets/section-living.jpg";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stats = [
  { icon: Building2, value: "14", label: "Anos de mercado" },
  { icon: Users, value: "800+", label: "Famílias atendidas" },
  { icon: Award, value: "350+", label: "Imóveis vendidos" },
  { icon: MapPin, value: "Sinop", label: "Mato Grosso" },
];

const valores = [
  { icon: Target, title: "Excelência", desc: "Buscamos a excelência em cada atendimento, garantindo que cada cliente receba atenção personalizada e soluções sob medida." },
  { icon: Heart, title: "Compromisso", desc: "Compromisso genuíno com a realização do sonho de cada família. Tratamos cada negociação com dedicação e transparência." },
  { icon: Shield, title: "Confiança", desc: "Construímos relações de confiança duradouras. Nossa reputação de 14 anos é nosso maior patrimônio." },
  { icon: TrendingUp, title: "Inovação", desc: "Adotamos as melhores tecnologias e práticas do mercado para oferecer uma experiência moderna e eficiente." },
];

export default function SobrePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        className="relative pt-32 pb-24 px-6 overflow-hidden"
        style={{ opacity: heroOpacity }}
      >
        <motion.div
          className="absolute top-20 right-10 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div style={{ y: heroY }} className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/40 mb-8"
          >
            <Building2 className="h-3 w-3" />
            Desde 2012 em Sinop - MT
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extralight tracking-tight text-white/90 mb-6 leading-[1.1]"
          >
            14 anos transformando
            <br />
            <span className="text-white/40">sonhos em endereços</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm md:text-base text-white/30 font-light max-w-xl mx-auto leading-relaxed"
          >
            A HR Imóveis nasceu do desejo de oferecer uma experiência imobiliária diferente em Sinop.
            Com atendimento humanizado e profundo conhecimento do mercado local, ajudamos famílias a encontrar o lar ideal.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Stats */}
      <FadeIn className="max-w-5xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-3 py-8 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <stat.icon className="h-5 w-5 text-white/25" />
              <span className="text-3xl font-extralight text-white/90">{stat.value}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      {/* História */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src={sectionCommunity} alt="HR Imóveis história" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Nossa história</h2>
              <h3 className="text-2xl md:text-3xl font-extralight text-white/90 mb-6 leading-tight">
                Referência no mercado imobiliário de Sinop
              </h3>
              <div className="space-y-4 text-sm text-white/40 font-light leading-relaxed">
                <p>
                  Fundada em 2012, a HR Imóveis surgiu com a missão de trazer um novo padrão de atendimento
                  ao mercado imobiliário de Sinop. Ao longo de 14 anos, construímos uma trajetória sólida
                  baseada em confiança, transparência e resultados.
                </p>
                <p>
                  Com profundo conhecimento da região e dos melhores empreendimentos, oferecemos consultoria
                  especializada para quem busca imóveis de alto padrão. Nossa equipe é formada por profissionais
                  apaixonados pelo que fazem, sempre prontos para encontrar a melhor solução para cada cliente.
                </p>
                <p>
                  Hoje, somos reconhecidos como uma das imobiliárias mais confiáveis de Sinop,
                  com centenas de famílias atendidas e uma carteira de imóveis que reflete o melhor da cidade.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Valores */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <FadeIn className="text-center mb-12">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Nossos valores</h2>
          <h3 className="text-2xl md:text-3xl font-extralight text-white/90">
            O que nos move todos os dias
          </h3>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {valores.map((valor, i) => (
            <FadeIn key={valor.title} delay={i * 0.1}>
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] h-full hover:bg-white/[0.05] transition-colors duration-500">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
                  <valor.icon className="h-4 w-4 text-white/40" />
                </div>
                <h4 className="text-sm font-medium text-white/70 mb-2">{valor.title}</h4>
                <p className="text-xs text-white/30 leading-relaxed font-light">{valor.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Missão/Visão */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn delay={0.1}>
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Nossa missão</h2>
              <h3 className="text-2xl md:text-3xl font-extralight text-white/90 mb-6 leading-tight">
                Conectar pessoas aos melhores imóveis de Sinop
              </h3>
              <p className="text-sm text-white/40 font-light leading-relaxed">
                Nossa missão é proporcionar a melhor experiência na compra, venda e locação de imóveis de alto padrão
                em Sinop e região. Acreditamos que encontrar o imóvel ideal vai além de metros quadrados,
                é sobre encontrar um lugar que transforme a vida das pessoas.
              </p>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src={sectionLiving} alt="Missão HR Imóveis" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <FadeIn className="max-w-3xl mx-auto px-6 mb-24 text-center">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12">
          <h3 className="text-2xl font-extralight text-white/90 mb-3">Vamos conversar?</h3>
          <p className="text-xs text-white/30 font-light mb-8 max-w-md mx-auto">
            Entre em contato e descubra como podemos ajudar você a encontrar o imóvel ideal em Sinop.
          </p>
          <motion.a
            href="https://wa.me/5566999990000?text=Olá! Gostaria de saber mais sobre a HR Imóveis."
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
          >
            Falar com a equipe
          </motion.a>
        </div>
      </FadeIn>
    </div>
  );
}
