import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fmtDateTime, fromCuiabaInputValue } from "@/lib/datetime";
import {
  agendarProximaAcao, marcarContatoEstabelecido, registrarTentativa, solicitarCarteira,
  type AtribuicaoCarteira,
} from "@/hooks/useCarteira";

const TIPOS = [
  { id: "mensagem", label: "Mensagem / WhatsApp" },
  { id: "audio", label: "Áudio" },
  { id: "ligacao", label: "Ligação" },
  { id: "visita", label: "Visita" },
  { id: "reuniao", label: "Reunião" },
  { id: "email", label: "E-mail" },
];

interface Props {
  atribuicao: AtribuicaoCarteira | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

export default function AtendimentoCarteiraDialog({ atribuicao, open, onOpenChange, onDone }: Props) {
  const [tipo, setTipo] = useState("mensagem");
  const [descricao, setDescricao] = useState("");
  const [quando, setQuando] = useState("");
  const [tituloAcao, setTituloAcao] = useState("");
  const [solicitacao, setSolicitacao] = useState<"devolucao" | "transferencia">("devolucao");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  if (!atribuicao) return null;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setSalvando(true);
    try {
      await fn();
      toast.success(ok);
      setDescricao(""); setMotivo(""); setQuando(""); setTituloAcao("");
      onDone();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível concluir a ação");
    }
    setSalvando(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{atribuicao.conta_nome}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{atribuicao.telefone || atribuicao.email || "sem contato"}</Badge>
          <Badge variant="outline">{atribuicao.tentativas} tentativa(s)</Badge>
          {atribuicao.prazo_primeiro_contato && (
            <Badge variant="outline">Prazo: {fmtDateTime(atribuicao.prazo_primeiro_contato)}</Badge>
          )}
          {atribuicao.lote_nome && <Badge variant="outline">{atribuicao.lote_nome}</Badge>}
        </div>

        <Tabs defaultValue="tentativa">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="tentativa">Registrar contato</TabsTrigger>
            <TabsTrigger value="agenda">Próxima ação</TabsTrigger>
            <TabsTrigger value="solicitar">Devolver / transferir</TabsTrigger>
          </TabsList>

          <TabsContent value="tentativa" className="space-y-3 mt-4">
            <div>
              <Label className="text-xs">Tipo de contato</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">O que aconteceu</Label>
              <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: enviei mensagem de apresentação, aguardando retorno." />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={salvando}
                onClick={() => run(() => registrarTentativa(atribuicao.atribuicao_id, tipo, descricao), "Tentativa registrada")}>
                {salvando && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Registrar tentativa
              </Button>
              <Button variant="outline" disabled={salvando}
                onClick={() => run(() => marcarContatoEstabelecido(atribuicao.atribuicao_id, descricao), "Contato estabelecido")}>
                Marcar contato estabelecido
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="space-y-3 mt-4">
            <div>
              <Label className="text-xs">Título da próxima ação</Label>
              <Input value={tituloAcao} onChange={(e) => setTituloAcao(e.target.value)}
                placeholder="Ex.: ligar para apresentar imóveis" />
            </div>
            <div>
              <Label className="text-xs">Quando (horário de Cuiabá)</Label>
              <Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />
            </div>
            <Button disabled={salvando || !quando}
              onClick={() => {
                const iso = fromCuiabaInputValue(quando);
                if (!iso) return toast.error("Informe a data e hora");
                return run(() => agendarProximaAcao(atribuicao.atribuicao_id, iso, tituloAcao, descricao), "Próxima ação agendada");
              }}>
              {salvando && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Agendar e criar tarefa
            </Button>
            <p className="text-xs text-muted-foreground">
              A tarefa criada gera a tag de contagem regressiva no funil de Contas.
            </p>
          </TabsContent>

          <TabsContent value="solicitar" className="space-y-3 mt-4">
            {atribuicao.solicitacao_tipo ? (
              <p className="text-sm text-muted-foreground">
                Já existe uma solicitação de <strong>{atribuicao.solicitacao_tipo}</strong> aguardando decisão do gestor.
              </p>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={solicitacao} onValueChange={(v) => setSolicitacao(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="devolucao">Devolver para a carteira HR</SelectItem>
                      <SelectItem value="transferencia">Transferir para outro corretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Motivo</Label>
                  <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Explique por que esta conta deve sair da sua carteira." />
                </div>
                <Button variant="outline" disabled={salvando || !motivo.trim()}
                  onClick={() => run(() => solicitarCarteira(atribuicao.atribuicao_id, solicitacao, motivo), "Solicitação enviada ao gestor")}>
                  Enviar solicitação
                </Button>
                <p className="text-xs text-muted-foreground">
                  A conta continua com você até o gestor decidir.
                </p>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
