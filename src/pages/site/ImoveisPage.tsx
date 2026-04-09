import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Search, SlidersHorizontal, X } from "lucide-react";
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
      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3"
          >
            Portfólio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]"
          >
            Nossos <span className="font-semibold">Imóveis</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm text-white/40 mt-4 max-w-lg"
          >
            Explore nossa seleção curada de imóveis de alto padrão em Sinop e região.
          </motion.p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar por nome, bairro ou condomínio..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all border ${
                  filtersOpen
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
              </button>
            </div>

            {/* Filter chips */}
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-end gap-4 pb-2"
              >
                <div className="flex gap-1.5">
                  {TIPOS.map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setTipoSelecionado(tipo)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                        tipoSelecionado === tipo
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín R$"
                    value={faixaMin}
                    onChange={(e) => setFaixaMin(e.target.value)}
                    className="w-28 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  />
                  <span className="text-white/20 text-xs">—</span>
                  <input
                    type="number"
                    placeholder="Máx R$"
                    value={faixaMax}
                    onChange={(e) => setFaixaMax(e.target.value)}
                    className="w-28 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                  />
                </div>

                {(tipoSelecionado !== "Todos" || faixaMin || faixaMax) && (
                  <button
                    onClick={() => { setTipoSelecionado("Todos"); setFaixaMin(""); setFaixaMax(""); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X className="h-3 w-3" /> Limpar
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-white/30 mt-4"
          >
            {imoveis.length} {imoveis.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </motion.p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveis.map((im, i) => (
            <motion.div
              key={im.id}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-500">
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-white/[0.04] to-white/[0.02] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/10 text-6xl font-light">{im.tipo === "Terreno" ? "◇" : "⌂"}</span>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-md ${
                      im.status === "Disponível"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {im.status}
                    </span>
                  </div>
                  {/* Code badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-full text-[10px] font-mono text-white/40 bg-black/40 backdrop-blur-md border border-white/10">
                      {im.codigo}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold leading-tight group-hover:text-white/90 transition-colors text-white/80">
                      {im.nome}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-white/30 mb-3">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] truncate">
                      {im.endereco.bairro}{im.endereco.condominio ? ` • ${im.endereco.condominio}` : ""} — {im.endereco.cidade}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/25 leading-relaxed line-clamp-2 mb-4">
                    {im.descricao}
                  </p>

                  {/* Specs */}
                  {im.tipo !== "Terreno" && (
                    <div className="flex items-center gap-3 mb-4">
                      {im.quartos > 0 && (
                        <div className="flex items-center gap-1 text-white/30">
                          <BedDouble className="h-3 w-3" />
                          <span className="text-[10px]">{im.quartos}</span>
                        </div>
                      )}
                      {im.banheiros > 0 && (
                        <div className="flex items-center gap-1 text-white/30">
                          <Bath className="h-3 w-3" />
                          <span className="text-[10px]">{im.banheiros}</span>
                        </div>
                      )}
                      {im.vagas > 0 && (
                        <div className="flex items-center gap-1 text-white/30">
                          <Car className="h-3 w-3" />
                          <span className="text-[10px]">{im.vagas}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-white/20">{im.area}</span>
                    </div>
                  )}
                  {im.tipo === "Terreno" && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] text-white/30">Área: {im.area}</span>
                    </div>
                  )}

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <span className="text-lg font-semibold tracking-tight">{formatPrice(im.valor)}</span>
                    <a
                      href={`https://wa.me/5566999990000?text=Olá! Tenho interesse no imóvel ${im.codigo} - ${im.nome}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                    >
                      Agendar visita
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {imoveis.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">Nenhum imóvel encontrado com os filtros aplicados.</p>
          </div>
        )}
      </section>
    </div>
  );
}
