import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  abrirLink,
  registrarEventoLink,
  type LinkItemPublico,
  type LinkPublicoResponse,
} from "@/lib/imovelLinkPublico";
import {
  AlertCircle,
  Bath,
  BedDouble,
  Car,
  Clock,
  Loader2,
  MessageCircle,
  Ruler,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import hrLogo from "@/assets/logo-hr-branco.png";

function brl(v: number | null) {
  if (v == null) return null;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function useCountdown(expiraEm?: string | null) {
  const [restante, setRestante] = useState<number | null>(null);
  useEffect(() => {
    if (!expiraEm) return;
    const tick = () => setRestante(new Date(expiraEm).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiraEm]);
  return restante;
}

function formatRestante(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min ${String(s).padStart(2, "0")}s`;
}

function Galeria({ fotos, onView }: { fotos: string[]; onView: () => void }) {
  const [i, setI] = useState(0);
  if (!fotos.length) {
    return <div className="aspect-[4/3] w-full rounded-xl bg-muted" />;
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      <img
        src={fotos[i]}
        alt={`Foto ${i + 1} do imóvel`}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
        onClick={onView}
      />
      {fotos.length > 1 && (
        <>
          <button
            aria-label="Foto anterior"
            onClick={() => setI((v) => (v - 1 + fotos.length) % fotos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Próxima foto"
            onClick={() => { setI((v) => (v + 1) % fotos.length); onView(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-3 rounded-full bg-background/80 px-2 py-0.5 text-xs">
            {i + 1}/{fotos.length}
          </div>
        </>
      )}
    </div>
  );
}

function ItemCard({
  item,
  token,
  telefone,
}: {
  item: LinkItemPublico;
  token: string;
  telefone: string | null;
}) {
  const specs = [
    item.quartos ? { icon: BedDouble, label: `${item.quartos} quarto${item.quartos > 1 ? "s" : ""}` } : null,
    item.banheiros ? { icon: Bath, label: `${item.banheiros} banheiro${item.banheiros > 1 ? "s" : ""}` } : null,
    item.vagas ? { icon: Car, label: `${item.vagas} vaga${item.vagas > 1 ? "s" : ""}` } : null,
    item.area_util || item.area_total
      ? { icon: Ruler, label: `${item.area_util ?? item.area_total} m²` }
      : null,
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  const whatsapp = () => {
    registrarEventoLink(token, "clique_whatsapp", { item_id: item.item_id });
    const texto = encodeURIComponent(`Olá! Tenho interesse no imóvel "${item.titulo ?? ""}" que você me enviou.`);
    const fone = (telefone ?? "").replace(/\D/g, "");
    window.open(fone ? `https://wa.me/55${fone}?text=${texto}` : `https://wa.me/?text=${texto}`, "_blank");
  };

  const pedirVisita = () => {
    registrarEventoLink(token, "pedido_visita", { item_id: item.item_id });
    toast.success("Pedido de visita enviado! O corretor entrará em contato.");
  };

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <Galeria
        fotos={item.fotos}
        onView={() => registrarEventoLink(token, "galeria", { item_id: item.item_id })}
      />
      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-medium">{item.titulo ?? "Imóvel"}</h2>
        {item.localizacao && <p className="text-sm text-muted-foreground">{item.localizacao}</p>}
        {item.valor != null && <p className="text-xl font-semibold">{brl(item.valor)}</p>}
        {(item.valor_condominio || item.valor_iptu) && (
          <p className="text-xs text-muted-foreground">
            {item.valor_condominio ? `Condomínio ${brl(item.valor_condominio)}` : ""}
            {item.valor_condominio && item.valor_iptu ? " · " : ""}
            {item.valor_iptu ? `IPTU ${brl(item.valor_iptu)}` : ""}
          </p>
        )}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
            {specs.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-1">
                <s.icon className="h-4 w-4" /> {s.label}
              </span>
            ))}
          </div>
        )}
        {item.descricao && <p className="whitespace-pre-line pt-2 text-sm">{item.descricao}</p>}
        {item.condicoes_comerciais && (
          <p className="rounded-lg bg-muted p-3 text-sm">{item.condicoes_comerciais}</p>
        )}
        {item.caracteristicas?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {item.caracteristicas.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2.5 py-1 text-xs">{c}</span>
            ))}
          </div>
        )}
        {item.video_url && (
          <a
            href={item.video_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => registrarEventoLink(token, "video", { item_id: item.item_id })}
            className="inline-block text-sm underline"
          >
            Assistir ao vídeo do imóvel
          </a>
        )}
        <div className="flex flex-col gap-2 pt-3 sm:flex-row">
          <Button onClick={whatsapp} className="flex-1">
            <MessageCircle className="mr-2 h-4 w-4" /> Falar com o corretor
          </Button>
          <Button variant="outline" onClick={pedirVisita} className="flex-1">
            <CalendarCheck className="mr-2 h-4 w-4" /> Quero agendar uma visita
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function LinkImovelPublico() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LinkPublicoResponse | null>(null);
  const abriu = useRef(false);

  useEffect(() => {
    document.title = "Apresentação de imóveis | HR Imóveis";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!token || abriu.current) return;
    abriu.current = true;
    abrirLink(token).then((r) => {
      setData(r);
      setLoading(false);
    });
  }, [token]);

  const restante = useCountdown(data?.expira_em);
  const expirouAgora = restante != null && restante <= 0;

  const itens = useMemo(() => data?.itens ?? [], [data]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const indisponivel =
    !data || data.status !== "ativo" || expirouAgora;

  if (indisponivel) {
    const msg =
      data?.status === "revogado"
        ? "Este link foi encerrado pelo corretor."
        : data?.status === "expirado" || expirouAgora
          ? "Este link expirou."
          : "Link não encontrado.";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-medium">{msg}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Fale com o seu corretor da HR Imóveis para receber um novo acesso à apresentação.
        </p>
        {data?.codigo_referencia && (
          <p className="text-xs text-muted-foreground">Referência: {data.codigo_referencia}</p>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <img src={hrLogo} alt="HR Imóveis" className="h-8 w-auto" />
          {restante != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs">
              <Clock className="h-3.5 w-3.5" /> Disponível por {formatRestante(restante)}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <section>
          <h1 className="text-2xl font-medium">
            {data.titulo || (itens.length > 1 ? "Seleção de imóveis" : "Imóvel selecionado para você")}
          </h1>
          {data.mensagem && <p className="pt-1 text-sm text-muted-foreground">{data.mensagem}</p>}
          {data.corretor?.nome && (
            <p className="pt-1 text-sm text-muted-foreground">Enviado por {data.corretor.nome}</p>
          )}
        </section>

        {itens.map((item) => (
          <ItemCard key={item.item_id} item={item} token={token!} telefone={data.corretor?.telefone ?? null} />
        ))}

        <footer className="py-6 text-center text-xs text-muted-foreground">
          Conteúdo exclusivo e temporário · Referência {data.codigo_referencia}
          <br />
          É proibida a reprodução ou redistribuição deste material.
        </footer>
      </div>
    </main>
  );
}
