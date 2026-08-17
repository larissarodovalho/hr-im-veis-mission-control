// Etapa 9 — canais de compartilhamento do link temporário (WhatsApp, cópia, share nativo, QR Code).
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, MessageCircle, QrCode, Share2, ExternalLink, CheckCircle2, Timer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/datetime";
import { estadoAtual, tempoRestante, urlDoLink, type LinkCompartilhado } from "@/lib/imovelLinks";
import { copiarTexto, mensagemWhatsapp, registrarEventoInterno } from "@/lib/imovelLinkShare";

interface Props {
  link: LinkCompartilhado;
  titulo: string;
  codigoImovel?: string | null;
  quantidade?: number;
  /** Chamado quando o link está expirado/revogado e o usuário pede um novo. */
  onGerarNovo?: () => void;
}

export default function CompartilharAcoes({ link, titulo, codigoImovel, quantidade = 1, onGerarNovo }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const url = urlDoLink(link.token);
  const estado = estadoAtual(link);
  const bloqueado = estado !== "ativo";
  const podeShare = typeof navigator !== "undefined" && !!navigator.share;

  const texto = mensagemWhatsapp({
    codigo: codigoImovel,
    titulo,
    url,
    codigoReferencia: link.codigo_referencia,
    quantidade,
  });

  useEffect(() => {
    setQr(null);
    setConfirmado(false);
  }, [link.id]);

  const copiar = async () => {
    const ok = await copiarTexto(url);
    if (!ok) return toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    registrarEventoInterno(link.id, "copia_link_interno");
    toast.success("Link copiado");
  };

  const copiarMensagem = async () => {
    const ok = await copiarTexto(texto);
    if (!ok) return toast.error("Não foi possível copiar a mensagem.");
    registrarEventoInterno(link.id, "copia_link_interno", { com_mensagem: true });
    toast.success("Mensagem copiada");
  };

  const whatsapp = () => {
    registrarEventoInterno(link.id, "envio_whatsapp_iniciado");
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  };

  const compartilharNativo = async () => {
    try {
      await navigator.share({ text: texto, url });
      registrarEventoInterno(link.id, "compartilhamento_nativo_interno");
    } catch {
      /* usuário cancelou */
    }
  };

  const gerarQr = async () => {
    if (qr) return setQr(null);
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 });
    setQr(dataUrl);
    registrarEventoInterno(link.id, "qrcode_gerado");
  };

  const abrirNovaAba = () => {
    registrarEventoInterno(link.id, "abrir_nova_aba");
    window.open(url, "_blank", "noopener");
  };

  const confirmarEnvio = () => {
    registrarEventoInterno(link.id, "envio_confirmado");
    setConfirmado(true);
    toast.success("Envio confirmado manualmente");
  };

  if (bloqueado) {
    return (
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <Badge variant="destructive">{estado === "revogado" ? "Revogado" : estado === "substituido" ? "Substituído" : "Expirado"}</Badge>
          <span className="text-xs text-muted-foreground">Este link não pode mais ser compartilhado.</span>
        </div>
        {onGerarNovo && (
          <Button className="w-full" onClick={onGerarNovo}>
            <RefreshCw className="h-4 w-4 mr-2" /> Gerar novo link
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Link do cliente</Label>
        <div className="flex gap-2">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <Button size="icon" variant="outline" onClick={copiar} title="Copiar link"><Copy className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={abrirNovaAba} title="Abrir em nova aba"><ExternalLink className="h-4 w-4" /></Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Referência: <span className="font-medium text-foreground">{link.codigo_referencia}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {link.expira_em
            ? `Expira em ${fmtDateTime(link.expira_em)} (${tempoRestante(link)})`
            : "A validade começa no primeiro acesso do cliente"}
        </p>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <Label className="text-xs">Mensagem que será enviada</Label>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{texto}</p>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={copiarMensagem}>
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar mensagem
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={whatsapp}><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</Button>
        <Button variant="outline" onClick={gerarQr}><QrCode className="h-4 w-4 mr-2" /> {qr ? "Ocultar QR" : "QR Code"}</Button>
        {podeShare && (
          <Button variant="outline" className="col-span-2" onClick={compartilharNativo}>
            <Share2 className="h-4 w-4 mr-2" /> Compartilhar…
          </Button>
        )}
        <Button
          variant={confirmado ? "secondary" : "outline"}
          className="col-span-2"
          onClick={confirmarEnvio}
          disabled={confirmado}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" /> {confirmado ? "Envio confirmado" : "Confirmar que enviei"}
        </Button>
      </div>

      {qr && (
        <div className="flex flex-col items-center gap-2 rounded-md border p-3">
          <img src={qr} alt="QR Code do link temporário" className="h-44 w-44" />
          <p className="text-[11px] text-muted-foreground">O QR Code contém apenas a URL do link temporário.</p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Abrir o WhatsApp não confirma o envio — use "Confirmar que enviei" após enviar a mensagem ao cliente.
      </p>
    </div>
  );
}
