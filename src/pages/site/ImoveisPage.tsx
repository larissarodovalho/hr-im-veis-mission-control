import { useState, useMemo, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Search, SlidersHorizontal, X, ArrowUpRight, Maximize2 } from "lucide-react";
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

const TIPOS = ["Todos", "Casa", "Terreno", "Apartamento", "Sobrado", "Cobertura"] as const;
const STATUS_FILTER = ["Disponível", "Em negociação"] as const;

const smoothEase = [0.25, 0.4, 0.25, 1] as const;

function ParallaxHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <motion.section ref={ref} className="relative pt-32 pb-24 px-6 overflow-hidden" style={{ opacity }}>
      {/* Decorative elements */}
      <motion.div
        className="absolute top-20 right-10 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-white/[0.01] blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div className="max-w-7xl mx-auto relative" style={{ y }}>
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
          className="flex items-center gap-3 mb-6"
        >
          <motion.div
            className="w-12 h-px bg-gradient-to-r from-white/60 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ transformOrigin: "left" }}
          />
          <span className="text-[10px] uppercase tracking-[0.35em] text-white/40 font-medium">
            Portfólio Exclusivo
          </span>
        </motion.div>

        {/* Main heading */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight leading-[1.05]"
          >
            Imóveis que
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-6">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]"
          >
            <span className="font-semibold bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              inspiram viver.
            </span>
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: smoothEase }}
          className="text-sm sm:text-base text-white/30 max-w-md leading-relaxed font-light"
        >
          Uma seleção curada de propriedades de alto padrão
          <br className="hidden sm:block" />
          em Sinop e região. Cada detalhe, pensado para você.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: smoothEase }}
          className="flex items-center gap-8 mt-10"
        >
          {[
            { value: IMOVEIS_SITE.filter(i => STATUS_FILTER.includes(i.status as any)).length.toString(), label: "Imóveis disponíveis" },
            { value: "R$ 580K", label: "A partir de" },
            { value: "Sinop", label: "Mato Grosso" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
              className="relative"
            >
              <p className="text-xl sm:text-2xl font-light tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{stat.label}</p>
              {i < 2 && <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-px h-6 bg-white/10 hidden sm:block" />}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default function ImoveisPage() {
  const [busca, setBusca] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("Todos");
  const [faixaMin, setFaixaMin] = useState("");
  const [faixaMax, setFaixaMax] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        const min = faixaMin ? Number(faixaMin) : 0;
        const max = faixaMax ? Number(faixaMax) : Infinity;
        return im.valor >= min && im.valor <= max;
      });
  }, [busca, tipoSelecionado, faixaMin, faixaMax]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero with parallax */}
      <ParallaxHero />

      {/* Search & Filters — elegant glass bar */}
      <section className="px-6 pb-10 -mt-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 sm:p-6"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Buscar por nome, bairro ou condomínio..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
              <motion.button
                onClick={() => setFiltersOpen(!filtersOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-medium transition-all duration-300 border ${
                  filtersOpen
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filtros</span>
              </motion.button>
            </div>

            {/* Filter chips */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: smoothEase }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap items-end gap-4 pt-5 border-t border-white/[0.05] mt-5">
                    <div className="flex flex-wrap gap-1.5">
                      {TIPOS.map((tipo, i) => (
                        <motion.button
                          key={tipo}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setTipoSelecionado(tipo)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className={`px-4 py-2 rounded-xl text-[11px] font-medium transition-all duration-300 border ${
                            tipoSelecionado === tipo
                              ? "bg-white text-[#0a0a0a] border-white shadow-lg shadow-white/10"
                              : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15"
                          }`}
                        >
                          {tipo}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Mín R$"
                        value={faixaMin}
                        onChange={(e) => setFaixaMin(e.target.value)}
                        className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                      />
                      <span className="text-white/15 text-xs">—</span>
                      <input
                        type="number"
                        placeholder="Máx R$"
                        value={faixaMax}
                        onChange={(e) => setFaixaMax(e.target.value)}
                        className="w-28 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                      />
                    </div>

                    {(tipoSelecionado !== "Todos" || faixaMin || faixaMax) && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => { setTipoSelecionado("Todos"); setFaixaMin(""); setFaixaMax(""); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        <X className="h-3 w-3" /> Limpar filtros
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Count with elegant line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mt-8 mb-2"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <p className="text-[11px] text-white/25 uppercase tracking-widest font-light">
              {imoveis.length} {imoveis.length === 1 ? "imóvel" : "imóveis"}
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Grid — elegant cards */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {imoveis.map((im, i) => (
            <motion.div
              key={im.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: (i % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
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
                  {/* Gradient overlay */}
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

                  {/* Specs — elegant dividers */}
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

                  {/* CTA */}
                  <motion.a
                    href={`https://wa.me/5566999990000?text=Olá! Tenho interesse no imóvel ${im.codigo} - ${im.nome}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[11px] font-medium bg-white/[0.06] border border-white/[0.08] text-white/50 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-all duration-400 group/btn"
                  >
                    Solicitar visita
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </motion.a>
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
              onClick={() => { setTipoSelecionado("Todos"); setBusca(""); setFaixaMin(""); setFaixaMax(""); }}
              className="mt-4 px-5 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
            >
              Limpar filtros
            </button>
          </motion.div>
        )}
      </section>

      {/* Bottom CTA section */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: smoothEase }}
            className="text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/25 mb-4">Atendimento exclusivo</p>
            <h2 className="text-2xl sm:text-3xl font-extralight tracking-tight mb-3">
              Não encontrou o que procura?
            </h2>
            <p className="text-sm text-white/30 font-light mb-8 max-w-md mx-auto">
              Nossa equipe encontra o imóvel ideal para você. Conte-nos o que busca.
            </p>
            <motion.a
              href="https://wa.me/5566999990000?text=Olá! Gostaria de ajuda para encontrar um imóvel."
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-medium bg-white text-[#0a0a0a] hover:bg-white/90 transition-all shadow-xl shadow-white/10"
            >
              Falar com um consultor
              <ArrowUpRight className="h-3.5 w-3.5" />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
