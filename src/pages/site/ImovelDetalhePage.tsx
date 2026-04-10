import { useParams, Link } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Maximize2, ArrowLeft, ArrowUpRight, Home, Phone, MessageCircle } from "lucide-react";
import { IMOVEIS_SITE } from "@/data/imoveisCRM";

import casaLuxo1 from "@/assets/imoveis/casa-luxo-1.jpg";
import casaLuxo2 from "@/assets/imoveis/casa-luxo-2.jpg";
import casaLuxo3 from "@/assets/imoveis/casa-luxo-3.jpg";
import terreno1 from "@/assets/imoveis/terreno-1.jpg";
import terreno2 from "@/assets/imoveis/terreno-2.jpg";
import cobertura1 from "@/assets/imoveis/cobertura-1.jpg";
import sobrado1 from "@/assets/imoveis/sobrado-1.jpg";
import mansao1 from "@/assets/imoveis/mansao-1.jpg";

const casaImages = [casaLuxo1, casaLuxo2, casaLuxo3, mansao1];
const terrenoImages = [terreno1, terreno2];

function getImageForImovel(id: string, tipo: string): string {
  const numId = parseInt(id) || 0;
  if (tipo === "Terreno") return terrenoImages[numId % terrenoImages.length];
  if (tipo === "Cobertura") return cobertura1;
  if (tipo === "Sobrado") return sobrado1;
  return casaImages[numId % casaImages.length];
}

function formatPrice(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

function ScrollSection({ children, className = "", index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 0.15, 0.8, 1], [60, 0, 0, -30]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.8, 1], [0.95, 1, 1, 0.97]);
  const filter = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], ["blur(4px)", "blur(0px)", "blur(0px)", "blur(2px)"]);

  return (
    <motion.section
      ref={ref}
      style={{ y, opacity, scale, filter, perspective: 1200, transformStyle: "preserve-3d", zIndex: index }}
      className={`relative ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none" />
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
    </motion.section>
  );
}

export default function ImovelDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const imovel = IMOVEIS_SITE.find((im) => im.id === id);
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 80]);

  if (!imovel) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-extralight text-white/80 mb-6"
          >
            Imóvel não encontrado
          </motion.h1>
          <Link to="/site/imoveis" className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">
            Voltar para imóveis
          </Link>
        </div>
      </div>
    );
  }

  const image = getImageForImovel(imovel.id, imovel.tipo);
  const specs = [
    { icon: Maximize2, label: "Área", value: imovel.area },
    ...(imovel.quartos > 0 ? [{ icon: BedDouble, label: "Quartos", value: `${imovel.quartos}` }] : []),
    ...(imovel.banheiros > 0 ? [{ icon: Bath, label: "Banheiros", value: `${imovel.banheiros}` }] : []),
    ...(imovel.vagas > 0 ? [{ icon: Car, label: "Vagas", value: `${imovel.vagas}` }] : []),
  ];

  const enderecoCompleto = [
    imovel.endereco.condominio || imovel.endereco.bairro,
    `${imovel.endereco.cidade} - ${imovel.endereco.estado}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* ─── Hero — clean photo only ─── */}
      <section ref={heroRef} className="relative h-[60vh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
          <img src={image} alt={imovel.nome} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-black/10" />
        </motion.div>

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 119px, rgba(255,255,255,0.15) 120px)" }}
        />

        {/* Back link only */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute top-24 left-6 z-10"
        >
          <Link
            to="/site/imoveis"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white/70 transition-all duration-300 backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full border border-white/10"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </Link>
        </motion.div>
      </section>

      {/* ─── Info Section: Title, Price, Specs, Description, Location ─── */}
      <ScrollSection className="py-6 sm:py-8 -mt-12" index={1}>
        <div className="max-w-7xl mx-auto px-6 relative z-20">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider bg-white/10 text-white/60 border border-white/10">
              {imovel.tipo}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${
              imovel.status === "Disponível"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                : "bg-amber-500/15 text-amber-300 border border-amber-400/20"
            }`}>
              {imovel.status}
            </span>
            <span className="px-2 py-1 rounded-lg text-[9px] font-mono text-white/35 bg-black/30 border border-white/[0.06]">
              {imovel.codigo}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-[-0.02em] leading-[1.15] mb-2"
          >
            {imovel.nome}
          </motion.h1>

          {/* Location inline */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-1.5 text-white/25 mb-8"
          >
            <MapPin className="h-3 w-3" />
            <span className="text-xs font-light">{enderecoCompleto}</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2">
              {/* Price */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 36 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/40 to-transparent mb-4"
              />
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-light mb-2">Valor</p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 0.8, ease }}
                className="text-3xl sm:text-4xl font-extralight tracking-[-0.02em] mb-8"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70">
                  {formatPrice(imovel.valor)}
                </span>
              </motion.h2>

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-white/[0.04] rounded-xl overflow-hidden mb-8">
                {specs.map((spec, i) => (
                  <motion.div
                    key={spec.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease }}
                    className="flex flex-col items-center gap-2 py-6 bg-[#050505] hover:bg-white/[0.02] transition-all duration-500"
                  >
                    <spec.icon className="h-4 w-4 text-amber-300/40" />
                    <span className="text-xl font-extralight text-white/80">{spec.value}</span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/20">{spec.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-gradient-to-b from-amber-300/40 to-transparent rounded-full" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-light">Sobre o imóvel</p>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ margin: "-40px" }}
                  transition={{ duration: 0.6, ease: smoothEase }}
                  className="text-sm text-white/35 leading-[1.9] font-light"
                >
                  {imovel.descricao}
                </motion.p>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-gradient-to-b from-amber-300/40 to-transparent rounded-full" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-light">Localização</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Bairro", value: imovel.endereco.bairro },
                    ...(imovel.endereco.condominio ? [{ label: "Condomínio", value: imovel.endereco.condominio }] : []),
                    { label: "Cidade", value: `${imovel.endereco.cidade} - ${imovel.endereco.estado}` },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease }}
                    >
                      <span className="text-[9px] uppercase tracking-[0.3em] text-white/15 block mb-1">{item.label}</span>
                      <p className="text-sm font-light text-white/50">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — CTA sidebar */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15, ease }}
                className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5 hover:border-white/[0.1] transition-all duration-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300/20 to-amber-500/10 flex items-center justify-center border border-amber-300/10">
                    <Home className="h-4 w-4 text-amber-300/60" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/60">Interessado?</p>
                    <p className="text-[10px] text-white/20 font-light">Fale com nosso consultor</p>
                  </div>
                </div>

                <motion.a
                  href={`https://wa.me/5566999990000?text=Olá! Tenho interesse no imóvel ${imovel.codigo} - ${imovel.nome}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group flex items-center justify-center gap-2 w-full py-3 rounded-full text-[10px] font-medium tracking-[0.15em] uppercase bg-white text-black hover:bg-amber-50 transition-all duration-500"
                >
                  Solicitar visita
                  <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </motion.a>

                <motion.a
                  href={`https://wa.me/5566999990000?text=Olá! Gostaria de mais informações sobre o imóvel ${imovel.codigo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-[10px] font-medium tracking-[0.1em] uppercase bg-white/[0.04] border border-white/[0.08] text-white/35 hover:bg-white/[0.08] hover:text-white/60 hover:border-white/15 transition-all duration-500"
                >
                  <MessageCircle className="h-3 w-3" />
                  Pedir informações
                </motion.a>
              </motion.div>

              {/* Quick details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:border-white/[0.1] transition-all duration-500"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3 bg-gradient-to-b from-amber-300/40 to-transparent rounded-full" />
                  <h3 className="text-[10px] font-medium text-white/30 uppercase tracking-[0.3em]">Detalhes</h3>
                </div>
                {[
                  { label: "Código", value: imovel.codigo },
                  { label: "Tipo", value: imovel.tipo },
                  { label: "Status", value: imovel.status },
                  { label: "Área total", value: imovel.area },
                  ...(imovel.quartos > 0 ? [{ label: "Quartos", value: `${imovel.quartos}` }] : []),
                  ...(imovel.banheiros > 0 ? [{ label: "Banheiros", value: `${imovel.banheiros}` }] : []),
                  ...(imovel.vagas > 0 ? [{ label: "Vagas", value: `${imovel.vagas}` }] : []),
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="text-[10px] text-white/20 font-light">{item.label}</span>
                    <span className="text-[10px] text-white/50 font-medium">{item.value}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Bottom CTA ─── */}
      <ScrollSection className="py-8 sm:py-12 -mt-8" index={2}>
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
            Agende uma visita
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-80px" }}
            transition={{ duration: 1.2, delay: 0.1, ease }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.12] tracking-[-0.02em] mb-4"
          >
            Este imóvel chamou sua{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
              atenção?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-sm text-white/30 font-light mb-10 max-w-md mx-auto leading-[1.8]"
          >
            Entre em contato e agende uma visita exclusiva com nosso consultor.
          </motion.p>

          <motion.a
            href={`https://wa.me/5566999990000?text=Olá! Gostaria de agendar uma visita ao imóvel ${imovel.codigo} - ${imovel.nome}`}
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
            Falar com consultor
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </motion.a>
        </div>
      </ScrollSection>

      {/* Bottom spacer */}
      <div className="h-24" />
    </div>
  );
}
