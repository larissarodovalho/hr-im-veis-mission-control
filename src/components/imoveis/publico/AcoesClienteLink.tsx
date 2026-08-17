// Etapa 12 — ações do cliente na página pública do link temporário.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, MessageCircle, CalendarCheck, Check } from "lucide-react";
import { registrarEventoLink } from "@/lib/imovelLinkPublico";

const MOTIVOS = ["Localização", "Valor", "Tamanho ou planta", "Já escolhi outro imóvel", "Outro motivo"];
const TURNOS = ["Manhã", "Tarde", "Noite"];

interface Props {
  token: string;
  itemId: string;
  titulo: string;
  telefone: string | null;
  codigoReferencia?: string;
  bloqueado?: boolean;
}

export default function AcoesClienteLink({
  token, itemId, titulo, telefone, codigoReferencia, bloqueado,
}: Props) {
  const chave = `hr_link_acoes_${token}_${itemId}`;
  const [feitas, setFeitas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(chave) || "[]"); } catch { return []; }
  });
  const [openRejeitar, setOpenRejeitar] = useState(false);
  const [motivo, setMotivo] = useState<string>("");
  const [obs, setObs] = useState("");
  const [openVisita, setOpenVisita] = useState(false);
  const [data, setData] = useState("");
  const [turno, setTurno] = useState("");
  const [enviando, setEnviando] = useState(false);

  const marcar = (tipo: string) => {
    const novo = Array.from(new Set([...feitas, tipo]));
    setFeitas(novo);
    localStorage.setItem(chave, JSON.stringify(novo));
  };

  const enviar = async (tipo: string, metadata?: Record<string, unknown>) => {
    if (bloqueado) { toast.error("Este link expirou. Fale com o seu corretor."); return; }
    setEnviando(true);
    await registrarEventoLink(token, tipo, { item_id: itemId, metadata });
    setEnviando(false);
    marcar(tipo);
  };

  const whatsappTexto = (prefixo: string) =>
    encodeURIComponent(
      `${prefixo} "${titulo}"${codigoReferencia ? ` (ref. ${codigoReferencia})` : ""}.`,
    );

  const abrirWhats = (prefixo: string) => {
    const fone = (telefone ?? "").replace(/\D/g, "");
    const texto = whatsappTexto(prefixo);
    window.open(fone ? `https://wa.me/55${fone}?text=${texto}` : `https://wa.me/?text=${texto}`, "_blank");
  };

  const gostei = async () => {
    await enviar("gostei");
    toast.success("Obrigado! Avisamos o seu corretor que você gostou deste imóvel.");
  };

  const maisInfo = async () => {
    await enviar("solicitou_informacoes");
    abrirWhats("Olá! Quero mais informações sobre o imóvel");
    toast.success("Pedido registrado. Estamos te levando para o WhatsApp do corretor.");
  };

  const confirmarRejeicao = async () => {
    await enviar("rejeitou", { motivo: [motivo, obs].filter(Boolean).join(" — ") || null });
    setOpenRejeitar(false);
    toast.success("Obrigado pelo retorno! Vamos buscar opções mais alinhadas ao seu perfil.");
  };

  const confirmarVisita = async () => {
    const pref = [data ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") : null, turno]
      .filter(Boolean).join(" · ");
    await enviar("solicitou_visita", { preferencia: pref || null });
    setOpenVisita(false);
    toast.success("Pedido de visita enviado! O corretor vai confirmar o horário com você.");
  };

  const feito = (t: string) => feitas.includes(t);

  return (
    <>
      <div className="grid gap-2 pt-3 sm:grid-cols-2">
        <Button
          variant={feito("gostei") ? "secondary" : "default"}
          disabled={bloqueado || enviando || feito("gostei")}
          onClick={gostei}
        >
          {feito("gostei") ? <Check className="mr-2 h-4 w-4" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
          {feito("gostei") ? "Você gostou deste imóvel" : "Gostei"}
        </Button>

        <Button
          variant="outline"
          disabled={bloqueado || enviando || feito("rejeitou")}
          onClick={() => setOpenRejeitar(true)}
        >
          {feito("rejeitou") ? <Check className="mr-2 h-4 w-4" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
          {feito("rejeitou") ? "Retorno enviado" : "Não tenho interesse"}
        </Button>

        <Button variant="outline" disabled={bloqueado || enviando} onClick={maisInfo}>
          <MessageCircle className="mr-2 h-4 w-4" /> Quero mais informações
        </Button>

        <Button
          variant="outline"
          disabled={bloqueado || enviando || feito("solicitou_visita")}
          onClick={() => setOpenVisita(true)}
        >
          {feito("solicitou_visita") ? <Check className="mr-2 h-4 w-4" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
          {feito("solicitou_visita") ? "Visita solicitada" : "Quero agendar uma visita"}
        </Button>
      </div>

      <Dialog open={openRejeitar} onOpenChange={setOpenRejeitar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>O que não combinou?</DialogTitle>
            <DialogDescription>Seu retorno ajuda o corretor a enviar opções melhores.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                className={`rounded-full border px-3 py-1.5 text-sm ${motivo === m ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Quer detalhar? (opcional)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenRejeitar(false)}>Cancelar</Button>
            <Button onClick={confirmarRejeicao} disabled={enviando}>Enviar retorno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openVisita} onOpenChange={setOpenVisita}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quero agendar uma visita</DialogTitle>
            <DialogDescription>
              Informe sua preferência. O corretor confirma o horário com você — o agendamento só vale após a confirmação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Data preferida (opcional)</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Turno</Label>
              <div className="flex gap-2">
                {TURNOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTurno(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${turno === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenVisita(false)}>Cancelar</Button>
            <Button onClick={confirmarVisita} disabled={enviando}>Enviar pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
