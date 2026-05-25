import { useState, useMemo, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Search, X, ArrowUpRight, Maximize2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function mapImovelFromDb(row: any) {
  const areaTotal = row.area_total != null ? `${Number(row.area_total).toLocaleString("pt-BR")} m²` : null;
  const areaConstruida = row.area_construida != null ? `${Number(row.area_construida).toLocaleString("pt-BR")} m²` : null;
  const areaUtil = row.area_util != null ? `${Number(row.area_util).toLocaleString("pt-BR")} m²` : null;
  return {
    id: row.id,
    codigo: row.codigo || `HR-${String(row.id).slice(0, 6).toUpperCase()}`,
    nome: row.titulo,
    tipo: row.tipo,
    status: row.status,
    valor: Number(row.valor ?? 0),
    quartos: row.quartos ?? 0,
    banheiros: row.banheiros ?? 0,
    suites: row.suites ?? 0,
    vagas: row.vagas ?? 0,
    area: areaUtil ?? areaConstruida ?? areaTotal ?? "—",
    area_total: areaTotal,
    area_construida: areaConstruida,
    descricao: row.descricao ?? "",
    caracteristicas: row.caracteristicas ?? [],
    fotos: row.fotos ?? [],
    imagem: row.fotos?.[0] ?? null,
    endereco: {
      bairro: row.bairro ?? "",
      condominio: row.complemento ?? "",
      cidade: row.cidade ?? "",
      estado: row.estado ?? "",
    },
  };
}

import casaLuxo1 from "@/assets/imoveis/casa-luxo-1.jpg";
import heroImoveis from "@/assets/imoveis/hero-imoveis.jpg";
import casaLuxo2 from "@/assets/imoveis/casa-luxo-2.jpg";
import casaLuxo3 from "@/assets/imoveis/casa-luxo-3.jpg";
import terreno1 from "@/assets/imoveis/terreno-1.jpg";
import terreno2 from "@/assets/imoveis/terreno-2.jpg";
import cobertura1 from "@/assets/imoveis/cobertura-1.jpg";
import sobrado1 from "@/assets/imoveis/sobrado-1.jpg";
import mansao1 from "@/assets/imoveis/mansao-1.jpg";
import { useSiteImages } from "@/lib/siteSettings";
import { createWhatsAppUrl, openWhatsApp } from "@/lib/whatsapp";
import { ScrollSection } from "@/components/site/MotionSections";

const casaImages = [casaLuxo1, casaLuxo2, casaLuxo3, mansao1];
const terrenoImages = [terreno1, terreno2];

function getImageForImovel(id: string, tipo: string): string {
  const numId = parseInt(id) || 0;
  if (tipo === "Terreno") return terrenoImages[numId % terrenoImages.length];
  if (tipo === "Cobertura") return cobertura1;
  if (tipo === "Sobrado") return sobrado1;
  return casaImages[numId % casaImages.length];
}

import { formatBRL } from "@/lib/format";
function formatPrice(valor: number) {
  return formatBRL(valor, { dash: false });
}

const TIPOS = ["Todos", "Casa", "Sobrado", "Apartamento"] as const;
// Imóveis com propostas em análise ou em fechamento permanecem com status "Disponível"
// e continuam aparecendo no site. Só saem daqui quando a venda é confirmada (status = "Vendido").
const STATUS_FILTER = ["Disponível"] as const;

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

/* ─── Hero with parallax — refined to match HomePage ─── */
function ParallaxHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const { img } = useSiteImages();

  return (
    <section ref={ref} className="relative h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background with scale effect */}
      <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
        <img
          src={img("hero_imoveis", heroImoveis)}
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
        className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center"
      >
        {/* Amber accent line */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 48 }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
          className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mb-8"
        />


        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease }}
          className="text-4xl sm:text-6xl lg:text-[5.5rem] font-extralight leading-[1.02] tracking-[-0.03em] mb-8"
        >
          Imóveis que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic inline-block pr-[0.15em]">
            inspiram viver.
          </span>
        </motion.h1>


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
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("Todos");
  const [faixaSelecionada, setFaixaSelecionada] = useState<string>("Todos");
  const [valorDropdownOpen, setValorDropdownOpen] = useState(false);
  const [IMOVEIS_SITE, setImoveisSite] = useState<any[]>([]);

  useEffect(() => {
    const load = () => {
      (supabase
        .from("imoveis_public" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any)
        .then(({ data }: { data: any[] }) => setImoveisSite((data ?? []).map(mapImovelFromDb)));
    };
    load();
    const channel = supabase
      .channel("imoveis-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "imoveis" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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
  }, [busca, tipoSelecionado, faixaSelecionada, IMOVEIS_SITE]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero with parallax — same style as HomePage */}
      <ParallaxHero />

      {/* ─── Filter Section ─── */}
      <ScrollSection className="py-2 sm:py-4 md:-mt-24" index={10}>
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
            <div className="bg-black rounded-2xl p-4 sm:p-6 backdrop-blur-sm overflow-visible">
              {/* Type pills row */}
              <div className="flex items-center flex-wrap gap-3 sm:gap-6 mb-5">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {TIPOS.map((tipo) => (
                    <motion.button
                      key={tipo}
                      onClick={() => setTipoSelecionado(tipo)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-400 ${
                        tipoSelecionado === tipo
                          ? "text-white"
                          : "text-white/60 hover:text-white/60"
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Buscar condomínio ou bairro"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-transparent border-b border-white/[0.08] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/25 transition-all duration-300"
                  />
                </div>

                <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />

                {/* Price range dropdown */}
                <div className="relative w-full sm:w-auto">
                  <motion.button
                    onClick={() => setValorDropdownOpen(!valorDropdownOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                      faixaSelecionada !== "Todos"
                        ? "bg-white/10 border-white/15 text-white"
                        : "bg-transparent border-white/[0.08] text-white/60 hover:text-white/60 hover:border-white/15"
                    }`}
                  >
                    <span>{faixaSelecionada === "Todos" ? "Valor" : faixaSelecionada}</span>
                    <motion.svg
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                      animate={{ rotate: valorDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-white/60"
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
                        className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:min-w-[180px] bg-[#111111] border border-white/[0.08] rounded-xl overflow-hidden backdrop-blur-2xl shadow-2xl shadow-black/40 z-50"
                      >
                        {FAIXAS.map((faixa, i) => (
                          <motion.button
                            key={faixa.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => { setFaixaSelecionada(faixa.label); setValorDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                              faixaSelecionada === faixa.label
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 hover:bg-white/[0.04] hover:text-white/70"
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
                      className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white/60 hover:bg-white/[0.1] transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile search */}
              <div className="sm:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Buscar condomínio ou bairro"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/15 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Grid — elegant cards ─── */}
      <ScrollSection className="py-4 sm:py-6 md:-mt-8" index={2} fadeEdges={false}>
        <div className="px-6 relative z-20">
          <div className="max-w-7xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {imoveis.map((im, i) => (
                <motion.div
                  key={im.id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.05 }}
                  transition={{ duration: 0.9, delay: (i % 3) * 0.12, ease }}
                  className="group hr-card-safety h-full"
                >
                  <motion.div
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/imovel/${im.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/imovel/${im.id}`);
                      }
                    }}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.4, ease: smoothEase }}
                    className="h-full flex flex-col cursor-pointer bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-700 hover:shadow-2xl hover:shadow-white/[0.03]"
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] relative overflow-hidden">
                      <motion.img
                        src={im.imagem || getImageForImovel(im.id, im.tipo)}
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
                          viewport={{ once: true, amount: 0 }}
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
                          viewport={{ once: true, amount: 0 }}
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
                    <div className="p-5 pb-7 sm:p-6 sm:pb-8 flex flex-col flex-1">
                      <motion.h3
                        className="text-lg font-medium leading-snug text-white/90 group-hover:text-white transition-colors duration-500 mb-2"
                      >
                        {im.nome}
                      </motion.h3>

                      <div className="flex items-center gap-1.5 text-white/40 mb-3">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm truncate font-normal">
                          {im.endereco.bairro}{im.endereco.condominio ? ` · ${im.endereco.condominio}` : ""} — {im.endereco.cidade}
                        </span>
                      </div>

                      <p className="text-sm text-white/60 leading-relaxed line-clamp-2 mb-5 font-normal">
                        {im.descricao}
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-0 mb-5">
                        {im.tipo !== "Terreno" ? (
                          <>
                            {im.quartos > 0 && (
                              <div className="flex items-center gap-1.5 pr-3 text-white/70">
                                <BedDouble className="h-4 w-4" />
                                <span className="text-sm font-normal">{im.quartos} quartos</span>
                              </div>
                            )}
                            {im.banheiros > 0 && (
                              <div className="flex items-center gap-1.5 px-3 border-l border-white/[0.08] text-white/70">
                                <Bath className="h-4 w-4" />
                                <span className="text-sm font-normal">{im.banheiros}</span>
                              </div>
                            )}
                            {im.vagas > 0 && (
                              <div className="flex items-center gap-1.5 px-3 border-l border-white/[0.08] text-white/70">
                                <Car className="h-4 w-4" />
                                <span className="text-sm font-normal">{im.vagas}</span>
                              </div>
                            )}
                            {im.area_total && (
                              <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.08] text-white/50">
                                <Maximize2 className="h-4 w-4" />
                                <span className="text-sm font-normal">{im.area_total}</span>
                              </div>
                            )}
                            {im.area_construida && (
                              <div className="flex items-center gap-1.5 pl-3 border-l border-white/[0.08] text-white/50">
                                <span className="text-sm font-normal">{im.area_construida}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-white/70">
                            <Maximize2 className="h-4 w-4" />
                            <span className="text-sm font-normal">Área total: {im.area_total ?? im.area}</span>
                          </div>
                        )}
                      </div>

                      {Array.isArray(im.caracteristicas) && im.caracteristicas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {im.caracteristicas.slice(0, 3).map((c: string) => (
                            <span key={c} className="text-xs font-normal text-white/70 border border-white/15 rounded-full px-2.5 py-1 bg-white/[0.03]">
                              {c}
                            </span>
                          ))}
                          {im.caracteristicas.length > 3 && (
                            <span className="text-xs font-normal text-white/50 px-1 py-1">
                              +{im.caracteristicas.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTAs */}
                      <div className="flex gap-2">
                        <motion.button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); openWhatsApp(event, `Olá! Tenho interesse no imóvel ${im.codigo} - ${im.nome}`); }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold bg-white/[0.08] border border-white/[0.12] text-white/70 hover:bg-white/[0.14] hover:text-white hover:border-white/25 transition-all duration-400 group/btn"
                        >
                          Solicitar visita
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </motion.button>
                        <motion.span
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold bg-white/[0.08] border border-white/[0.12] text-white/70 group-hover:bg-white/[0.14] group-hover:text-white group-hover:border-white/25 transition-all duration-400 group/btn2"
                        >
                          Ver imóvel
                          <Eye className="h-4 w-4 transition-transform duration-300 group-hover/btn2:scale-110" />
                        </motion.span>
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
                <p className="text-white/50 text-base font-light">Nenhum imóvel encontrado com os filtros aplicados.</p>
                <button
                  onClick={() => { setTipoSelecionado("Todos"); setBusca(""); setFaixaSelecionada("Todos"); }}
                  className="mt-4 px-5 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </ScrollSection>

      {/* ─── Bottom CTA ─── */}
      <ScrollSection className="py-10 sm:py-14 md:mt-8" index={3}>
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
              className="text-[11px] uppercase text-white/45 font-light mb-8"
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic inline-block pr-[0.15em]">
                procura?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base text-white/60 font-light mb-10 max-w-md mx-auto leading-[1.8]"
            >
              Nossa equipe encontra o imóvel ideal para você. Conte-nos o que busca.
            </motion.p>

            <motion.a
              href={createWhatsAppUrl("Olá! Gostaria de ajuda para encontrar um imóvel.")}
              onClick={(event) => openWhatsApp(event, "Olá! Gostaria de ajuda para encontrar um imóvel.")}
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
