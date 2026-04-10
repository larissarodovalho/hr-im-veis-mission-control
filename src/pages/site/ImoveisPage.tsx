import { useState, useMemo, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Search, X, ArrowUpRight, Maximize2, Eye } from "lucide-react";
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

const TIPOS = ["Todos", "Casa", "Sobrado", "Apartamento"] as const;
const STATUS_FILTER = ["Disponível", "Em negociação"] as const;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

/* ─── ScrollSection — same as HomePage for unified feel ─── */
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
      style={{
        y, opacity, scale, rotateX, filter,
        perspective: 1200,
        transformStyle: "preserve-3d",
        zIndex: index,
      }}
      className={`relative ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none" />
      {children}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
    </motion.section>
  );
}

/* ─── Hero with parallax — refined to match HomePage ─── */
function ParallaxHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section ref={ref} className="relative h-[70vh] flex items-end overflow-hidden">
      {/* Background with scale effect */}
      <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
        <img
          src={casaLuxo1}
          alt="Portfólio exclusivo de imóveis"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
      </motion.div>

      {/* Subtle line overlay — matches HomePage */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 119px, rgba(255,255,255,0.15) 120px)" }}
      />

      <motion.div
        style={{ opacity: heroOpacity, y: heroTextY }}
        className="relative z-10 max-w-7xl mx-auto px-6 pb-24 w-full flex flex-col items-center text-center"
      >
        {/* Amber accent line */}
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
          Portfólio Exclusivo
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease }}
          className="text-4xl sm:text-6xl lg:text-[5.5rem] font-extralight leading-[1.02] tracking-[-0.03em] mb-8"
        >
          Imóveis que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
            inspiram viver.
          </span>
        </motion.h1>

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
  );
}

export default function ImoveisPage() {
  const [busca, setBusca] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("Todos");
  const [faixaSelecionada, setFaixaSelecionada] = useState<string>("Todos");
  const [valorDropdownOpen, setValorDropdownOpen] = useState(false);

  const FAIXAS = [
    { label: "Todos", min: 0, max: Infinity },
    { label: "Até 500K", min: 0, max: 500000 },
    { label: "500K – 1M", min: 500000, max: 1000000 },
    { label: "1M – 1,5M", min: 1000000, max: 1500000 },
    { label: "1,5M – 2M", min: 1500000, max: 2000000 },
    { label: "2M – 3M", min: 2000000, max: 3000000 },
    { label: "3M – 5M", min: 3000000, max: 5000000 },
    { label: "Acima de 5M", min: 5000000, max: Infinity },
  ];

  const imoveis = useMemo(() => {
    return IMOVEIS_SITE
      .filter((im) => STATUS_FILTER.includes(im.status as any))
      .filter((im) => tipoSelecionado === "Todos" || im.tipo === tipoSelecionado)
      .filter((im) => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
          im.nome.toLowerCase().includes(termo) ||
          im.endereco.bairro.toLowerCase().includes(termo) ||
          im.endereco.condominio.toLowerCase().includes(termo) ||
          im.endereco.cidade.toLowerCase().includes(termo)
        );
      })
      .filter((im) => {
        const faixa = FAIXAS.find(f => f.label === faixaSelecionada);
        if (!faixa || faixa.label === "Todos") return true;
        return im.valor >= faixa.min && im.valor <= faixa.max;
      });
  }, [busca, tipoSelecionado, faixaSelecionada]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero with parallax — same style as HomePage */}
      <ParallaxHero />

      {/* ─── Filter Section ─── */}
      <ScrollSection className="py-2 sm:py-4 -mt-24" index={1}>
        <div className="px-6 relative z-20">
          <div className="max-w-7xl mx-auto">
            {/* Section label — amber accent like HomePage */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 48 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 1, ease }}
              className="h-[1px] bg-gradient-to-r from-amber-300/40 to-transparent mb-5"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8 }}
              className="text-sm uppercase tracking-[0.4em] text-white/40 font-light mb-8"
            >
              Filtrar Imóveis
            </motion.p>

            {/* Filter bar with subtle background */}
            <div className="bg-white/[0.03] rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
              {/* Type pills row */}
              <div className="flex items-center flex-wrap gap-4 sm:gap-6 mb-5">
                <div className="flex items-center gap-1.5">
                  {TIPOS.map((tipo) => (
                    <motion.button
                      key={tipo}
                      onClick={() => setTipoSelecionado(tipo)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-400 ${
                        tipoSelecionado === tipo
                          ? "text-white"
                          : "text-white/35 hover:text-white/60"
                      }`}
                    >
                      {tipoSelecionado === tipo && (
                        <motion.div
                          layoutId="activeType"
                          className="absolute inset-0 bg-white/10 border border-white/15 rounded-full"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10">{tipo}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

                {/* Search */}
                <div className="relative flex-1 max-w-sm hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="text"
                    placeholder="Buscar condomínio ou bairro"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-transparent border-b border-white/[0.08] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all duration-300"
                  />
                </div>

                <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

                {/* Price range dropdown */}
                <div className="hidden md:block relative">
                  <motion.button
                    onClick={() => setValorDropdownOpen(!valorDropdownOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                      faixaSelecionada !== "Todos"
                        ? "bg-white/10 border-white/15 text-white"
                        : "bg-transparent border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
                    }`}
                  >
                    <span>{faixaSelecionada === "Todos" ? "Valor" : faixaSelecionada}</span>
                    <motion.svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      animate={{ rotate: valorDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-white/30"
                    >
                      <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </motion.svg>
                  </motion.button>

                  <AnimatePresence>
                    {valorDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: smoothEase }}
                        className="absolute top-full mt-2 right-0 min-w-[180px] bg-[#111111] border border-white/[0.08] rounded-xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/40 z-50"
                      >
                        {FAIXAS.map((faixa, i) => (
                          <motion.button
                            key={faixa.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => { setFaixaSelecionada(faixa.label); setValorDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-all duration-200 flex items-center justify-between ${
                              faixaSelecionada === faixa.label
                                ? "bg-white/[0.08] text-white"
                                : "text-white/35 hover:bg-white/[0.04] hover:text-white/70"
                            }`}
                          >
                            <span>{faixa.label}</span>
                            {faixaSelecionada === faixa.label && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1.5 h-1.5 rounded-full bg-amber-300/60"
                              />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear */}
                <AnimatePresence>
                  {(tipoSelecionado !== "Todos" || busca || faixaSelecionada !== "Todos") && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => { setTipoSelecionado("Todos"); setBusca(""); setFaixaSelecionada("Todos"); }}
                      className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.1] transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile search */}
              <div className="sm:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="text"
                    placeholder="Buscar condomínio ou bairro"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Grid — elegant cards ─── */}
      <ScrollSection className="py-4 sm:py-6 -mt-16" index={2}>
        <div className="px-6 relative z-20">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-10">
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
                  className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light"
                >
                  {imoveis.length} {imoveis.length === 1 ? "imóvel" : "imóveis"} encontrados
                </motion.p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {imoveis.map((im, i) => (
                <motion.div
                  key={im.id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.9, delay: (i % 3) * 0.12, ease }}
                  className="group"
                >
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.4, ease: smoothEase }}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-700 hover:shadow-2xl hover:shadow-white/[0.03]"
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] relative overflow-hidden">
                      <motion.img
                        src={getImageForImovel(im.id, im.tipo)}
                        alt={im.nome}
                        loading="lazy"
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.8, ease: smoothEase }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                      {/* Top badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + (i % 3) * 0.1 }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xl ${
                            im.status === "Disponível"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                              : "bg-amber-500/15 text-amber-300 border border-amber-400/20"
                          }`}
                        >
                          {im.status}
                        </motion.span>
                        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-white/50 bg-black/30 backdrop-blur-xl border border-white/[0.08] tracking-wide">
                          {im.codigo}
                        </span>
                      </div>

                      {/* Bottom price overlay */}
                      <div className="absolute bottom-4 left-4">
                        <motion.p
                          className="text-xl sm:text-2xl font-light tracking-tight text-white drop-shadow-lg"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + (i % 3) * 0.1 }}
                        >
                          {formatPrice(im.valor)}
                        </motion.p>
                      </div>

                      {/* Hover icon */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                        <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20">
                          <Maximize2 className="h-3.5 w-3.5 text-white/80" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6">
                      <motion.h3
                        className="text-[15px] font-medium leading-snug text-white/80 group-hover:text-white transition-colors duration-500 mb-2"
                      >
                        {im.nome}
                      </motion.h3>

                      <div className="flex items-center gap-1.5 text-white/25 mb-3">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="text-[11px] truncate font-light">
                          {im.endereco.bairro}{im.endereco.condominio ? ` · ${im.endereco.condominio}` : ""} — {im.endereco.cidade}
                        </span>
                      </div>

                      <p className="text-[11px] text-white/20 leading-relaxed line-clamp-2 mb-5 font-light">
                        {im.descricao}
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-0 mb-5">
                        {im.tipo !== "Terreno" ? (
                          <>
                            {im.quartos > 0 && (
                              <div className="flex items-center gap-1.5 pr-3 text-white/30">
                                <BedDouble className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-light">{im.quartos} quartos</span>
                              </div>
                            )}
                            {im.banheiros > 0 && (
                              <div className="flex items-center gap-1.5 px-3 border-l border-white/[0.06] text-white/30">
                                <Bath className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-light">{im.banheiros}</span>
                              </div>
                            )}
                            {im.vagas > 0 && (
                              <div className="flex items-center gap-1.5 px-3 border-l border-white/[0.06] text-white/30">
                                <Car className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-light">{im.vagas}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.06] text-white/25">
                              <span className="text-[11px] font-light">{im.area}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-white/30">
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-light">Área total: {im.area}</span>
                          </div>
                        )}
                      </div>

                      {/* CTAs */}
                      <div className="flex gap-2">
                        <motion.a
                          href={`https://wa.me/5566999990000?text=Olá! Tenho interesse no imóvel ${im.codigo} - ${im.nome}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-[11px] font-medium bg-white/[0.06] border border-white/[0.08] text-white/50 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all duration-400 group/btn"
                        >
                          Solicitar visita
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </motion.a>
                        <motion.a
                          href={`/site/imovel/${im.id}`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-[11px] font-medium bg-white/[0.06] border border-white/[0.08] text-white/50 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all duration-400 group/btn2"
                        >
                          Ver imóvel
                          <Eye className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn2:scale-110" />
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {imoveis.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <p className="text-white/20 text-sm font-light">Nenhum imóvel encontrado com os filtros aplicados.</p>
                <button
                  onClick={() => { setTipoSelecionado("Todos"); setBusca(""); setFaixaSelecionada("Todos"); }}
                  className="mt-4 px-5 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </ScrollSection>

      {/* ─── Bottom CTA ─── */}
      <ScrollSection className="py-6 sm:py-10 -mt-16" index={3}>
        <div className="px-6 relative z-20">
          <div className="max-w-7xl mx-auto text-center">
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
              Atendimento Exclusivo
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-80px" }}
              transition={{ duration: 1.2, delay: 0.1, ease }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extralight leading-[1.12] tracking-[-0.02em] mb-4"
            >
              Não encontrou o que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
                procura?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-sm text-white/30 font-light mb-10 max-w-md mx-auto leading-[1.8]"
            >
              Nossa equipe encontra o imóvel ideal para você. Conte-nos o que busca.
            </motion.p>

            <motion.a
              href="https://wa.me/5566999990000?text=Olá! Gostaria de ajuda para encontrar um imóvel."
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
              Falar com um consultor
              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </motion.a>
          </div>
        </div>
      </ScrollSection>

      {/* Bottom spacer */}
      <div className="h-24" />
    </div>
  );
}
