import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, BedDouble, Bath, Car, Maximize2, ArrowLeft, ArrowUpRight, Home, FileText } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } }),
};

export default function ImovelDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const imovel = IMOVEIS_SITE.find((im) => im.id === id);

  if (!imovel) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white/80 mb-4">Imóvel não encontrado</h1>
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
    <div className="min-h-screen pt-20 pb-16">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link
            to="/site/imoveis"
            className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para imóveis
          </Link>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="relative rounded-2xl overflow-hidden aspect-[21/9] mb-8"
        >
          <img src={image} alt={imovel.nome} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-white/10 backdrop-blur-md text-white/80 border border-white/10">
              {imovel.tipo}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-medium backdrop-blur-md border ${
              imovel.status === "Disponível"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {imovel.status}
            </span>
          </div>

          {/* Code */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-mono bg-black/30 backdrop-blur-md text-white/50 border border-white/10">
            {imovel.codigo}
          </div>
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & price */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <h1 className="text-2xl md:text-3xl font-light text-white/90 tracking-tight mb-2">
                {imovel.nome}
              </h1>
              <div className="flex items-center gap-2 text-white/30 text-xs mb-4">
                <MapPin className="h-3.5 w-3.5" />
                {enderecoCompleto}
              </div>
              <p className="text-2xl md:text-3xl font-extralight text-white/90">
                {formatPrice(imovel.valor)}
              </p>
            </motion.div>

            {/* Specs */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map((spec, i) => (
                  <div
                    key={spec.label}
                    className="flex flex-col items-center gap-2 py-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <spec.icon className="h-5 w-5 text-white/30" />
                    <span className="text-lg font-light text-white/80">{spec.value}</span>
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">{spec.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Descrição</h2>
              <p className="text-sm text-white/50 leading-relaxed font-light">{imovel.descricao}</p>
            </motion.div>

            {/* Address details */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Localização</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  { label: "Bairro", value: imovel.endereco.bairro },
                  ...(imovel.endereco.condominio ? [{ label: "Condomínio", value: imovel.endereco.condominio }] : []),
                  { label: "Cidade", value: `${imovel.endereco.cidade} - ${imovel.endereco.estado}` },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">{item.label}</span>
                    <p className="text-white/60 font-light">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <Home className="h-4 w-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70">Interessado?</p>
                    <p className="text-[10px] text-white/30">Fale com nosso corretor</p>
                  </div>
                </div>

                <motion.a
                  href={`https://wa.me/5566999990000?text=Olá! Tenho interesse no imóvel ${imovel.codigo} - ${imovel.nome}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
                >
                  Solicitar visita
                  <ArrowUpRight className="h-4 w-4" />
                </motion.a>

                <motion.a
                  href={`https://wa.me/5566999990000?text=Olá! Gostaria de mais informações sobre o imóvel ${imovel.codigo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-medium bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white transition-all"
                >
                  Pedir informações
                </motion.a>
              </div>
            </motion.div>

            {/* Quick details */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-3">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Detalhes</h3>
                {[
                  { label: "Código", value: imovel.codigo },
                  { label: "Tipo", value: imovel.tipo },
                  { label: "Status", value: imovel.status },
                  { label: "Área total", value: imovel.area },
                  ...(imovel.quartos > 0 ? [{ label: "Quartos", value: `${imovel.quartos}` }] : []),
                  ...(imovel.banheiros > 0 ? [{ label: "Banheiros", value: `${imovel.banheiros}` }] : []),
                  ...(imovel.vagas > 0 ? [{ label: "Vagas", value: `${imovel.vagas}` }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-[11px] text-white/30">{item.label}</span>
                    <span className="text-[11px] text-white/60 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
