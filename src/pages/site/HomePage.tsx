import { Link } from "react-router-dom";
import { ArrowRight, MapPin, ArrowUpRight, MessageCircle, Building2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hrLogo from "@/assets/logo-hr-branco.png";
import heroBg from "@/assets/hero-dark.jpg";
import sectionLiving from "@/assets/section-living.jpg";
import sectionCommunity from "@/assets/section-community.jpg";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import featureInterior from "@/assets/feature-interior.jpg";
import { useSiteImages, fetchFeaturedImoveis } from "@/lib/siteSettings";
import { createWhatsAppUrl, openWhatsApp } from "@/lib/whatsapp";
import { ScrollSection, ParallaxImage } from "@/components/site/MotionSections";

const propertyImages = [property1, property2, property3];

function formatPrice(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const smoothEase = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

export default function HomePage() {
  const heroRef = useRef(null);
  const pageRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 1.08]);
  const heroTextY = useTransform(heroScroll, [0, 0.5], [0, 100]);

  const { img, loaded: imagesLoaded } = useSiteImages();
  const [destaque, setDestaque] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const ids = await fetchFeaturedImoveis();
      if (ids.length === 0) {
        // Fallback: 3 most recent available
        const { data } = await supabase
          .from("imoveis")
          .select("id, titulo, cidade, valor, fotos, tipo, status")
          .eq("status", "disponivel")
          .order("created_at", { ascending: false })
          .limit(3);
        setDestaque(data ?? []);
        return;
      }
      const { data } = await supabase
        .from("imoveis")
        .select("id, titulo, cidade, valor, fotos, tipo, status")
        .in("id", ids);
      // preserve admin order
      const ordered = ids
        .map((id) => (data ?? []).find((d) => d.id === id))
        .filter(Boolean) as any[];
      setDestaque(ordered);
    })();
  }, []);

  return (
    <div ref={pageRef} className="bg-[#050505]">
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative h-screen flex items-end overflow-hidden">
        <motion.div className="absolute inset-0 bg-[#050505]" style={{ scale: heroScale }}>
          {imagesLoaded && (
            <img
              src={img("hero_home", heroBg)}
              alt="Imóveis de alto padrão em Sinop"
              className="w-full h-full object-cover animate-in fade-in duration-500"
              fetchPriority="high"
              decoding="async"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>

        {/* Subtle line overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 119px, rgba(255,255,255,0.15) 120px)" }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroTextY }}
          className="relative z-10 max-w-7xl mx-auto px-6 pb-32 w-full flex flex-col items-center text-center"
        >
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
            Sinop — Mato Grosso
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease }}
            className="text-4xl sm:text-6xl lg:text-[5.5rem] font-extralight leading-[1.02] tracking-[-0.03em] mb-8"
          >
            Seu novo lar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200/90 to-amber-100/70 font-light italic">
              começa aqui.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-base sm:text-base text-white/60 max-w-lg mb-12 font-light leading-[1.8] tracking-wide"
          >
            Casas, terrenos e apartamentos de alto padrão nos melhores condomínios fechados.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex gap-4"
          >
            <Link
              to="/imoveis"
              className="group inline-flex items-center gap-3 px-9 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-amber-50 transition-all duration-500"
            >
              Explorar Imóveis
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 px-9 py-3.5 rounded-full border border-white/[0.08] text-white/60 text-[11px] font-light tracking-[0.15em] uppercase hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-white/50 transition-all duration-500"
            >
              Contato
            </Link>
          </motion.div>

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

      {/* ─── Diferenciais ─── */}
      <ScrollSection strong className="py-16 sm:py-14" index={2}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 40 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 1, ease }}
              className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8, ease: smoothEase }}
              className="text-xs uppercase tracking-[0.5em] text-amber-300/40 font-medium"
            >
              Nossos Diferenciais
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04] rounded-3xl overflow-hidden">
            {[
              { num: "01", title: "Condutores Patrimoniais", desc: "Seleção criteriosa dos melhores imóveis em condomínios fechados de Sinop." },
              { num: "02", title: "Segurança Jurídica", desc: "Assessoria completa em documentação e negociação." },
              { num: "03", title: "Atendimento Personalizado", desc: "Consultoria dedicada para encontrar o imóvel perfeito." },
              { num: "04", title: "Tradição & Confiança", desc: "14 anos de experiência no mercado imobiliário de alto padrão." },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-60px" }}
                transition={{ duration: 0.9, delay: i * 0.12, ease }}
                className="bg-[#050505] p-8 sm:p-10 group hover:bg-white/[0.03] transition-all duration-700 cursor-default"
              >
                <span className="inline-block text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-300/70 to-amber-200/50 tracking-[0.3em] font-medium mb-5 group-hover:from-amber-300 group-hover:to-amber-100 transition-all duration-700">
                  {item.num}
                </span>
                <h3 className="font-medium text-base sm:text-lg mb-3 tracking-wide text-white/85 group-hover:text-white transition-colors duration-700">
                  {item.title}
                </h3>
                <p className="text-base text-white/60 leading-[1.7] font-light group-hover:text-white/75 transition-colors duration-700">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ─── Imóveis em Destaque ─── */}
      <ScrollSection strong className="py-16 sm:py-14 md:-mt-12" index={4}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                whileInView={{ opacity: 1, width: 32 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 1, ease }}
                className="h-[1px] bg-gradient-to-r from-amber-300/30 to-transparent mb-8"
              />
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 0.8, ease: smoothEase }}
                className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-4"
              >
                Portfolio
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-40px" }}
                transition={{ duration: 1, delay: 0.1, ease }}
                className="text-3xl sm:text-4xl font-extralight tracking-wide"
              >
                Imóveis em destaque
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link
                to="/imoveis"
                className="hidden sm:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white/50 transition-colors duration-500 font-light"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-white/[0.03] rounded-3xl overflow-hidden">
            {destaque.map((imovel, i) => (
              <motion.div
                key={imovel.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.15, ease }}
              >
                <Link
                  to={`/imovel/${imovel.id}`}
                  className="group block bg-[#050505] hover:bg-white/[0.02] transition-all duration-700"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <motion.img
                      src={imovel.fotos?.[0] || propertyImages[i] || property1}
                      alt={imovel.titulo}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.8, ease: smoothEase }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] uppercase tracking-[0.4em] text-white/25 font-light">{imovel.tipo}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/50 group-hover:text-amber-300/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500" />
                    </div>
                    <h3 className="font-light text-base mb-3 tracking-wide text-white/80 group-hover:text-white/95 transition-colors duration-500">
                      {imovel.titulo}
                    </h3>
                    <p className="flex items-center gap-1.5 text-[11px] text-white/25 mb-6 font-light tracking-[0.15em]">
                      <MapPin className="h-2.5 w-2.5" /> {imovel.cidade || "Sinop, MT"}
                    </p>
                    <p className="text-xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 tracking-wide">
                      {formatPrice(imovel.valor || 0)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="sm:hidden mt-12 text-center"
          >
            <Link
              to="/imoveis"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.08] text-white/60 text-[11px] font-light tracking-[0.15em] uppercase hover:bg-white/[0.04] transition-all duration-500"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </ScrollSection>

      {/* ─── Comprar ou Vender ─── */}
      <ScrollSection strong className="py-16 sm:py-14 md:-mt-12" index={5}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 40 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 1, ease }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent mx-auto mb-10"
          />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ margin: "-40px" }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-10 text-center"
          >
            Como podemos ajudar
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.03] rounded-3xl overflow-hidden">
            {/* Comprar */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 1.2, ease }}
            >
              <div className="relative bg-[#050505] overflow-hidden h-full group">
                <img src={img("section_community", sectionCommunity)} alt="Comprar imóvel" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-1000" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/60" />
                <div className="relative p-12 sm:p-20 text-center flex flex-col items-center">
                  <MessageCircle className="h-7 w-7 text-white/50 mb-8" />
                  <h3 className="text-2xl sm:text-3xl font-extralight tracking-wide mb-5">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">comprar</span> um imóvel?
                  </h3>
                  <p className="text-base text-white/60 font-light leading-[1.8] max-w-sm mb-10">
                    Nossa equipe de consultores vai te ajudar a encontrar o imóvel perfeito para você e sua família.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href={createWhatsAppUrl("Olá, tudo bem? Quero falar com um corretor de imóveis.")}
                      onClick={(event) => openWhatsApp(event, "Olá, tudo bem? Quero falar com um corretor de imóveis.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-amber-50 transition-all duration-500"
                    >
                      Fale com um Consultor
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Vender */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ margin: "-40px" }}
              transition={{ duration: 1.2, delay: 0.15, ease }}
            >
              <div className="relative bg-[#050505] overflow-hidden h-full group">
                <img src={img("feature_interior", featureInterior)} alt="Vender imóvel" className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity duration-1000" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/60" />
                <div className="relative p-12 sm:p-20 text-center flex flex-col items-center">
                  <Building2 className="h-7 w-7 text-white/50 mb-8" />
                  <h3 className="text-2xl sm:text-3xl font-extralight tracking-wide mb-5">
                    Quer <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">vender</span> seu imóvel?
                  </h3>
                  <p className="text-base text-white/60 font-light leading-[1.8] max-w-sm mb-10">
                    Avaliamos e anunciamos seu imóvel com exclusividade. Alcance compradores qualificados com a HR Imóveis.
                  </p>
                  <a
                    href={createWhatsAppUrl("Olá, tudo bem? Quero vender meu imóvel.")}
                    onClick={(event) => openWhatsApp(event, "Olá, tudo bem? Quero vender meu imóvel.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-white/[0.08] text-white/60 text-[11px] font-light tracking-[0.12em] uppercase hover:border-white/[0.15] hover:text-white/50 hover:bg-white/[0.04] transition-all duration-500"
                  >
                    Quero Vender meu Imóvel
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* ─── Newsletter ─── */}
      <NewsletterSection />
    </div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = email.trim().toLowerCase();
    const telClean = telefone.replace(/\D/g, "");
    if (!emailClean) return;
    if (telClean.length < 10 || telClean.length > 13) {
      toast.error("Informe um telefone válido com DDD.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers" as any)
        .insert({ email: emailClean, telefone: telClean } as any);
      if (error) {
        if (error.code === "23505") {
          toast.info("Você já está inscrito na nossa newsletter!");
        } else {
          toast.error("Erro ao se inscrever. Tente novamente.");
        }
      } else {
        toast.success("Inscrito com sucesso! Você receberá nossas novidades.");
        setEmail("");
        setTelefone("");
      }
    } catch {
      toast.error("Erro ao se inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollSection strong className="py-16 sm:py-14 md:-mt-12" index={6}>
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          whileInView={{ opacity: 1, width: 40 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="h-[1px] bg-gradient-to-r from-transparent via-amber-300/30 to-transparent mx-auto mb-10"
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          className="text-[11px] uppercase tracking-[0.5em] text-white/25 font-light mb-8"
        >
          Newsletter
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-2xl sm:text-4xl font-extralight tracking-wide mb-5"
        >
          Fique por dentro do mercado{" "}
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200/80 to-amber-100/60 font-light">
            imobiliário
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base text-white/60 font-light max-w-md mx-auto mb-12 leading-[1.8]"
        >
          Receba informações exclusivas sobre novos imóveis, tendências do mercado e novidades da região de Sinop.
        </motion.p>
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="px-6 py-3.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-base text-white placeholder:text-white/45 font-light tracking-wide focus:outline-none focus:border-white/[0.15] transition-all duration-500"
          />
          <input
            type="tel"
            required
            placeholder="Seu telefone com DDD"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            maxLength={20}
            className="px-6 py-3.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-base text-white placeholder:text-white/45 font-light tracking-wide focus:outline-none focus:border-white/[0.15] transition-all duration-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-full bg-white text-black text-[11px] font-medium tracking-[0.12em] uppercase hover:bg-amber-50 transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Inscrever-se"}
          </button>
        </motion.form>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[10px] text-white/50 mt-5 font-light tracking-[0.2em]"
        >
          Sem spam. Cancele quando quiser.
        </motion.p>
      </div>
    </ScrollSection>
  );
}
