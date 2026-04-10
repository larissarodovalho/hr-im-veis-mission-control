import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import heroBg from "@/assets/hero-dark.jpg";
import sectionLiving from "@/assets/section-living.jpg";

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
      <motion.img src={src} alt={alt} style={{ y }} className="w-full h-[120%] object-cover" loading="lazy" />
    </div>
  );
}

const infos = [
  { icon: MapPin, label: "Endereço", value: "Av. dos Ingás, 2075\nJd. Maringá — Sinop, MT" },
  { icon: Phone, label: "Telefone", value: "(66) 99999-0000" },
  { icon: Mail, label: "E-mail", value: "contato@hrimoveis.com.br" },
  { icon: Clock, label: "Horário", value: "Seg a Sex: 08h – 18h\nSáb: 08h – 12h" },
];

export default function ContatoPage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 80]);

  return (
    <div className="bg-black">
      {/* Hero — same pattern as HomePage */}
      <section ref={heroRef} className="relative h-[70vh] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img src={heroBg} alt="Contato HR Imóveis" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-24 w-full flex flex-col items-center text-center"
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
            className="text-5xl md:text-7xl font-extralight tracking-tight text-white leading-[1.05] mb-6"
          >
            Fale conosco
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-base md:text-lg text-white/30 font-light max-w-md leading-relaxed"
          >
            Estamos prontos para atender você com atendimento personalizado e exclusivo.
          </motion.p>
        </motion.div>
      </section>

      {/* WhatsApp — floating card */}
      <ScrollSection className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 mb-32">
        <motion.a
          href="https://wa.me/5566999990000?text=Olá! Gostaria de mais informações sobre os imóveis."
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="block rounded-2xl bg-[#0d0d0d] border border-white/[0.06] p-10 md:p-14 text-center group cursor-pointer hover:border-white/[0.12] transition-all duration-700"
        >
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors duration-500">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-extralight text-white/90 mb-2 tracking-tight">
              Converse pelo WhatsApp
            </h2>
            <p className="text-sm text-white/25 font-light mb-6">
              Atendimento rápido e personalizado
            </p>
            <span className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium bg-emerald-500 text-white group-hover:bg-emerald-400 transition-all duration-300">
              Iniciar conversa
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </motion.a>
      </ScrollSection>

      {/* Info grid with parallax image */}
      <ScrollSection className="max-w-6xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <ParallaxImage
            src={sectionLiving}
            alt="Escritório HR Imóveis"
            className="rounded-3xl aspect-[4/5]"
          />
          <div>
            <motion.p
              className="text-[11px] uppercase tracking-[0.4em] text-white/20 font-light mb-6"
            >
              Informações
            </motion.p>
            <div className="space-y-8">
              {infos.map((info) => (
                <div key={info.label} className="group">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.08] transition-colors duration-500">
                      <info.icon className="h-4 w-4 text-white/25 group-hover:text-white/50 transition-colors duration-500" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 block mb-1.5">{info.label}</span>
                      <p className="text-base text-white/60 font-light whitespace-pre-line leading-relaxed">{info.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Map */}
      <ScrollSection className="max-w-6xl mx-auto px-6 mb-32">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/20 font-light mb-4">Localização</p>
          <h2 className="text-3xl md:text-4xl font-extralight text-white/90 tracking-tight">
            Av. dos Ingás, 2075
          </h2>
          <p className="text-base text-white/25 font-light mt-2">Jd. Maringá — Sinop, MT</p>
        </div>
        <div className="rounded-3xl overflow-hidden border border-white/[0.06] h-[450px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.5!2d-55.5025!3d-11.8639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93a8e2a3e2a3e2a3%3A0x0!2sAv.%20dos%20Ing%C3%A1s%2C%202075%20-%20Jardim%20Maring%C3%A1%2C%20Sinop%20-%20MT!5e0!3m2!1spt-BR!2sbr!4v1"
            width="100%"
            height="100%"
            style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(0.9) brightness(0.8)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização HR Imóveis"
          />
        </div>
      </ScrollSection>

      {/* Final CTA */}
      <ScrollSection className="max-w-4xl mx-auto px-6 pb-32 text-center">
        <div className="py-16">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/15 font-light mb-8">HR Imóveis</p>
          <h3 className="text-3xl md:text-5xl font-extralight text-white/90 tracking-tight mb-4 leading-[1.05]">
            Encontre o imóvel
            <br />
            <span className="text-white/30">dos seus sonhos</span>
          </h3>
          <p className="text-sm text-white/20 font-light mb-10 max-w-sm mx-auto leading-relaxed">
            14 anos de experiência no mercado imobiliário de Sinop, com atendimento exclusivo e personalizado.
          </p>
          <motion.a
            href="https://wa.me/5566999990000?text=Olá! Gostaria de mais informações."
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 transition-all"
          >
            Falar com a equipe
            <ArrowUpRight className="h-4 w-4" />
          </motion.a>
        </div>
      </ScrollSection>
    </div>
  );
}
