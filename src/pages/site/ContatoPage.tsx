import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import heroBg from "@/assets/hero-dark.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import { useSiteImages } from "@/lib/siteSettings";
import { createWhatsAppUrl, openWhatsApp } from "@/lib/whatsapp";
import { ScrollSection, ParallaxImage } from "@/components/site/MotionSections";

const infos = [
  { icon: MapPin, label: "Endereço", value: "Av. dos Ingás, 2075\nJd. Maringá — Sinop, MT" },
  { icon: Phone, label: "Telefone", value: "(66) 99995-5881" },
  { icon: Mail, label: "E-mail", value: "contato@hrimoveis.com.br" },
  { icon: Clock, label: "Horário", value: "Seg a Sex: 08h – 18h\nSáb: 08h – 12h" },
];

export default function ContatoPage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.1]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 80]);
  const { img, loaded: imagesLoaded } = useSiteImages();

  return (
    <div className="bg-black">
      {/* Hero — same pattern as HomePage */}
      <section ref={heroRef} className="relative h-[70vh] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0 bg-black" style={{ scale: heroScale }}>
          {imagesLoaded && (
            <img
              src={img("hero_contato", heroBg)}
              alt="Contato HR Imóveis"
              className="w-full h-full object-cover animate-in fade-in duration-500"
              fetchPriority="high"
              decoding="async"
            />
          )}
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
            className="text-[11px] uppercase tracking-[0.4em] text-white/60 font-light mb-6"
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
            className="text-base md:text-lg text-white/60 font-light max-w-md leading-relaxed"
          >
            Estamos prontos para atender você com atendimento personalizado e exclusivo.
          </motion.p>
        </motion.div>
      </section>

      {/* Info grid with parallax image */}
      <ScrollSection className="max-w-6xl mx-auto px-6 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <ParallaxImage
            src={img("section_living", sectionLiving)}
            alt="Escritório HR Imóveis"
            className="rounded-3xl aspect-[4/5]"
          />
          <div>
            <motion.p
              className="text-[11px] uppercase tracking-[0.4em] text-white/50 font-light mb-6"
            >
              Informações
            </motion.p>
            <div className="space-y-8">
              {infos.map((info) => (
                <div key={info.label} className="group">
                  <div className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.08] transition-colors duration-500">
                      <info.icon className="h-4 w-4 text-white/45 group-hover:text-white/75 transition-colors duration-500" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-1.5">{info.label}</span>
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
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/50 font-light mb-4">Localização</p>
          <h2 className="text-3xl md:text-4xl font-extralight text-white/90 tracking-tight">
            Av. dos Ingás, 2075
          </h2>
          <p className="text-base text-white/45 font-light mt-2">Jd. Maringá — Sinop, MT</p>
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
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/55 font-light mb-8">HR Imóveis</p>
          <h3 className="text-3xl md:text-5xl font-extralight text-white/90 tracking-tight mb-4 leading-[1.05]">
            Não perca mais tempo,
            <br />
            <span className="text-white/60">fale conosco agora</span>
          </h3>
          <p className="text-base text-white/50 font-light mb-10 max-w-sm mx-auto leading-relaxed">
            14 anos de experiência no mercado imobiliário de Sinop, com atendimento exclusivo e personalizado.
          </p>
          <a
            href={createWhatsAppUrl("Olá, tudo bem? Quero falar com um corretor de imóveis.")}
            onClick={(event) => openWhatsApp(event, "Olá, tudo bem? Quero falar com um corretor de imóveis.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            Falar com a equipe
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </ScrollSection>
    </div>
  );
}
