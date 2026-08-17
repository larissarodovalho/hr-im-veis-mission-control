import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Link2, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  criarLinkCompartilhado, urlDoLink, marcarCompartilhado,
  VALIDADES, INICIOS, type LinkCompartilhado,
} from "@/lib/imovelLinks";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imoveis: { id: string; titulo: string }[];
  onCreated?: () => void;
}

export default function CompartilharImovelDialog({ open, onOpenChange, imoveis, onCreated }: Props) {
  const [validade, setValidade] = useState("1440");
  const [inicio, setInicio] = useState<"criacao" | "primeiro_acesso">("criacao");
  const [exibirValor, setExibirValor] = useState(true);
  const [localizacao, setLocalizacao] = useState<"bairro_cidade" | "cidade" | "oculto">("bairro_cidade");
  const [whats, setWhats] = useState(true);
  const [visita, setVisita] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [saving, setSaving] = useState(false);
  const [criado, setCriado] = useState<LinkCompartilhado | null>(null);

  useEffect(() => {
    if (open) {
      setCriado(null);
      setTitulo(imoveis.length > 1 ? "Seleção de imóveis" : "");
      setMensagem("");
    }
  }, [open, imoveis.length]);

  const criar = async () => {
    setSaving(true);
    try {
      const link = await criarLinkCompartilhado({
        imovelIds: imoveis.map((i) => i.id),
        tituloSelecao: titulo || null,
        mensagem: mensagem || null,
        validadeMinutos: Number(validade),
        inicioValidade: inicio,
        exibirValor,
        localizacao,
        permitirWhatsapp: whats,
        permitirAgendarVisita: visita,
      });
      setCriado(link);
      onCreated?.();
      toast.success("Link temporário criado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar o link");
    } finally {
      setSaving(false);
    }
  };

  const url = criado ? urlDoLink(criado.token) : "";

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    if (criado) marcarCompartilhado(criado.id, "copia");
    toast.success("Link copiado");
  };

  const enviarWhats = () => {
    if (!criado) return;
    const texto = `${mensagem || "Segue a apresentação do imóvel:"}\n\n${url}\n\nCódigo: ${criado.codigo_referencia}`;
    marcarCompartilhado(criado.id, "whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Link temporário</DialogTitle>
          <DialogDescription>
            {imoveis.length > 1
              ? `${imoveis.length} imóveis selecionados`
              : imoveis[0]?.titulo || "Imóvel"} — apresentação sem dados internos.
          </DialogDescription>
        </DialogHeader>

        {!criado ? (
          <div className="space-y-4">
            {imoveis.length > 1 && (
              <div className="space-y-1.5">
                <Label>Título da seleção</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Opções em Jardim das Américas" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Select value={validade} onValueChange={setValidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VALIDADES.map((v) => <SelectItem key={v.valor} value={String(v.valor)}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Contagem inicia</Label>
                <Select value={inicio} onValueChange={(v) => setInicio(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INICIOS.map((i) => <SelectItem key={i.valor} value={i.valor}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Localização exibida</Label>
              <Select value={localizacao} onValueChange={(v) => setLocalizacao(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bairro_cidade">Bairro e cidade</SelectItem>
                  <SelectItem value="cidade">Somente cidade</SelectItem>
                  <SelectItem value="oculto">Não exibir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Exibir valor</Label>
                <Switch checked={exibirValor} onCheckedChange={setExibirValor} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Botão "Falar com o corretor"</Label>
                <Switch checked={whats} onCheckedChange={setWhats} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Botão "Agendar visita"</Label>
                <Switch checked={visita} onCheckedChange={setVisita} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mensagem de apresentação (opcional)</Label>
              <Textarea rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Texto que aparece no topo da página do cliente" />
            </div>

            <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              O link não expõe endereço completo, proprietário, matrícula nem dados internos, e as fotos são servidas por URL assinada temporária.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={criar} disabled={saving}>{saving ? "Gerando…" : "Gerar link"}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Link do cliente</Label>
              <div className="flex gap-2">
                <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
                <Button size="icon" variant="outline" onClick={copiar}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Código de referência: <span className="font-medium text-foreground">{criado.codigo_referencia}</span></p>
            </div>
            <Button className="w-full" onClick={enviarWhats}>
              <MessageCircle className="h-4 w-4 mr-2" /> Enviar por WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
