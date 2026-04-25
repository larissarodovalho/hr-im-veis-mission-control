import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useContas } from "@/hooks/useContas";
import { useInteracoes, InteracaoDB } from "@/hooks/useInteracoes";
import { LeadDB } from "@/hooks/useLeads";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InteracaoDialog from "@/components/InteracaoDialog";
import {
  ArrowLeft, Phone, Mail, MapPin, Loader2, UserPlus, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ETAPAS, TEMP_META, INTERACAO_TIPOS, daysSince, slaColor, slaLabel, initials,
} from "@/lib/leads";
import { toast } from "sonner";

const TIPO_LABEL: Record<string, { icon: string; label: string }> = Object.fromEntries(
  INTERACAO_TIPOS.map((t) => [t.value, { icon: t.icon, label: t.label }])
);

export default function LeadDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConta } = useContas();
  const [lead, setLead] = useState<LeadDB | null>(null);
  const [loading, setLoading] = useState(true);
  const { items: interacoes, loading: loadingInter, remove } = useInteracoes({ leadId: id });

  async function load() {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) toast.error(error.message);
    setLead((data as LeadDB) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`lead-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  async function mudarEtapa(etapa: string) {
    if (!lead) return;
    const { error } = await supabase.from("leads").update({ etapa_funil: etapa }).eq("id", lead.id);
    if (error) toast.error(error.message);
    else toast.success(`Etapa atualizada: ${etapa}`);
  }

  async function converterEmConta() {
    if (!lead) return;
    const res = await createConta({
      nome: lead.nome,
      tipo: "PF",
      email: lead.email,
      telefone: lead.telefone,
      lead_id_origem: lead.id,
      observacoes: lead.observacoes,
    });
    if (!("error" in res) || !res.error) {
      await supabase.from("leads").update({ etapa_funil: "Fechamento", status: "Convertido" }).eq("id", lead.id);
      toast.success("Lead convertido em conta");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }
  if (!lead) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Lead não encontrado.</CardContent></Card>
    );
  }

  const dias = daysSince(lead.ultima_interacao);
  const temp = (lead as any).temperatura as keyof typeof TEMP_META | null;
  const regiao = (lead as any).regiao as string | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Link to="/crm?tab=leads" className="text-xs text-muted-foreground hover:text-primary">CRM › Leads</Link>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-6 flex flex-wrap items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
            {initials(lead.nome)}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{lead.nome}</h1>
              <Badge>{lead.status}</Badge>
              {temp && TEMP_META[temp] && (
                <Badge variant="outline" className={TEMP_META[temp].cls}>
                  {TEMP_META[temp].emoji} {TEMP_META[temp].label}
                </Badge>
              )}
              <Badge variant="outline" className={slaColor(dias)}>⏱ {slaLabel(dias)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {lead.telefone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.telefone}</span>}
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
              {regiao && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{regiao}</span>}
              {lead.origem && <span>Origem: <strong className="text-foreground/80">{lead.origem}</strong></span>}
              {lead.valor_estimado && <span>Valor: <strong className="text-foreground/80">R$ {Number(lead.valor_estimado).toLocaleString("pt-BR")}</strong></span>}
            </div>
            {/* Etapa pills */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {ETAPAS.map((e) => (
                <button
                  key={e}
                  onClick={() => mudarEtapa(e)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition ${
                    lead.etapa_funil === e
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 hover:bg-muted border-border"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <InteracaoDialog leadId={lead.id} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="h-4 w-4 mr-1" /> Converter em Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Converter em conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cria uma conta nova com base nos dados do lead e move o lead para "Fechamento".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={converterEmConta}>Converter</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3 mt-4">
          {loadingInter ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : interacoes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma interação registrada ainda. Use o botão "Registrar interação" acima.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {interacoes.map((i: InteracaoDB) => {
                const meta = TIPO_LABEL[i.tipo] ?? { icon: "•", label: i.tipo };
                return (
                  <Card key={i.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{meta.label}</span>
                            {i.resultado && <Badge variant="secondary" className="text-[10px]">{i.resultado.replace(/_/g, " ")}</Badge>}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(i.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {i.descricao && <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{i.descricao}</p>}
                          {i.proxima_acao && (
                            <p className="text-xs mt-2 text-primary">→ Próxima ação: {i.proxima_acao}</p>
                          )}
                          {i.agendado_para && (
                            <p className="text-xs mt-1 text-muted-foreground">📅 {new Date(i.agendado_para).toLocaleString("pt-BR")}</p>
                          )}
                        </div>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-3 text-sm">
              <Info label="Imóvel de interesse" value={lead.imovel_interesse} />
              <Info label="Tags" value={lead.tags?.join(", ")} />
              <Info label="Data de entrada" value={new Date(lead.data_entrada).toLocaleString("pt-BR")} />
              <Info label="Última interação" value={lead.ultima_interacao ? new Date(lead.ultima_interacao).toLocaleString("pt-BR") : "—"} />
              <Info label="Observações" value={lead.observacoes} multiline />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={multiline ? "whitespace-pre-wrap" : ""}>{value || "—"}</span>
    </div>
  );
}
