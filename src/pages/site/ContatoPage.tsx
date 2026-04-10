import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";

const ease = [0.25, 0.4, 0.25, 1] as [number, number, number, number];

const infos = [
  { icon: MapPin, label: "Endereço", value: "Av. dos Ingás, 2075\nJd. Maringá — Sinop, MT" },
  { icon: Phone, label: "Telefone", value: "(66) 99999-0000" },
  { icon: Mail, label: "E-mail", value: "contato@hrimoveis.com.br" },
  { icon: Clock, label: "Horário", value: "Seg a Sex: 08h – 18h\nSáb: 08h – 12h" },
];

export default function ContatoPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="text-center mb-20"
        >
          <span className="text-xs text-white/20 uppercase tracking-[0.3em] mb-4 block">Contato</span>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tighter text-white/90 mb-6 leading-[0.95]">
            Fale conosco
          </h1>
          <p className="text-base text-white/25 font-light max-w-md mx-auto leading-relaxed">
            Estamos prontos para atender você. Entre em contato pelo WhatsApp ou visite nosso escritório.
          </p>
        </motion.div>

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="mb-20"
        >
          <div className="relative rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.06] p-10 md:p-16 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-white/[0.02] blur-[100px]" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-400" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-extralight text-white/90 mb-3 tracking-tight">
                Converse pelo WhatsApp
              </h2>
              <p className="text-sm text-white/25 font-light mb-8 max-w-sm mx-auto">
                Atendimento rápido e personalizado. Tire suas dúvidas ou agende uma visita.
              </p>
              <motion.a
                href="https://wa.me/5566999990000?text=Olá! Gostaria de mais informações sobre os imóveis."
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-all"
              >
                Iniciar conversa
                <ArrowUpRight className="h-4 w-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-20">
          {infos.map((info, i) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease }}
              className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors duration-500 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-colors duration-500">
                <info.icon className="h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors duration-500" />
              </div>
              <span className="text-xs text-white/20 uppercase tracking-widest block mb-2">{info.label}</span>
              <p className="text-sm text-white/60 font-light whitespace-pre-line leading-relaxed">{info.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Map embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease }}
          className="rounded-3xl overflow-hidden border border-white/[0.06] h-[400px]"
        >
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
        </motion.div>
      </div>
    </div>
  );
}
