import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/datetime";
import { STATUS_LABEL, statusUI, tempoRestante, type LinkCompartilhado } from "@/lib/imovelLinks";

const PAGINA = 25;

const EVENTO_LABEL: Record<string, string> = {
  abertura: "Abriu o link",
  galeria: "Navegou nas fotos",
  video: "Assistiu ao vídeo",
  clique_whatsapp: "Clicou no WhatsApp",
  solicitou_informacoes: "Pediu mais informações",
  solicitou_visita: "Solicitou visita",
  pedido_visita: "Solicitou visita",
  gostei: "Gostou do imóvel",
  rejeitou: "Sem interesse",
  tentativa_apos_expiracao: "Tentou abrir após expirar",
  copia_link_interno: "Link copiado pela equipe",
  compartilhou_whatsapp: "Compartilhado por WhatsApp",
  gerou_qrcode: "QR Code gerado",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  link: LinkCompartilhado | null;
  /** Nome do imóvel ou da seleção. */
  titulo: string;
  conta?: string | null;
  oportunidade?: string | null;
  corretor?: string | null;
  conversao?: "interesse" | "oportunidade" | "venda" | null;
}

interface EventoRow {
  id: string;
  tipo_evento: string;
  dispositivo: string | null;
  navegador: string | null;
  sistema_operacional: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function LinkDetalhesDialog({
  open, onOpenChange, link, titulo, conta, oportunidade, corretor, conversao,
}: Props) {
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [loading, setLoading] = useState(false);

  // Eventos são carregados sob demanda, em páginas, para não pesar a central.
  const carregar = async (p: number) => {
    if (!link) return;
    setLoading(true);
    const { data } = await supabase
      .from("imovel_link_eventos")
      .select("id,tipo_evento,dispositivo,navegador,sistema_operacional,metadata,created_at")
      .eq("link_id", link.id)
      .order("created_at", { ascending: false })
      .range(p * PAGINA, p * PAGINA + PAGINA);
    const rows = (data ?? []) as unknown as EventoRow[];
    setTemMais(rows.length > PAGINA);
    setEventos((prev) => (p === 0 ? rows.slice(0, PAGINA) : [...prev, ...rows.slice(0, PAGINA)]));
    setPagina(p);
    setLoading(false);
  };

  useEffect(() => {
    if (open && link) { setEventos([]); carregar(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, link?.id]);

  if (!link) return null;
  const status = statusUI(link, conversao);

  const info: [string, string][] = [
    ["Código", link.codigo_referencia],
    ["Tipo", link.tipo === "selecao" ? "Seleção de imóveis" : "Imóvel único"],
    ["Corretor", corretor || "—"],
    ["Conta", conta || "—"],
    ["Oportunidade", oportunidade || "—"],
    ["Criado em", fmtDateTime(link.created_at)],
    ["Compartilhado em", link.compartilhado_em ? fmtDateTime(link.compartilhado_em) : "—"],
    ["Prazo", link.validade_minutos < 60
      ? `${link.validade_minutos} min`
      : link.validade_minutos % 60 === 0
        ? `${link.validade_minutos / 60}h`
        : `${Math.floor(link.validade_minutos / 60)}h${link.validade_minutos % 60}`],

    ["Expira em", link.expira_em ? fmtDateTime(link.expira_em) : "Inicia no 1º acesso"],
    ["Tempo restante", tempoRestante(link)],
    ["Primeiro acesso", link.primeiro_acesso_em ? fmtDateTime(link.primeiro_acesso_em) : "—"],
    ["Último acesso", link.ultimo_acesso_em ? fmtDateTime(link.ultimo_acesso_em) : "—"],
    ["Total de acessos", String(link.total_acessos ?? 0)],
    ["Visitantes únicos", String(link.visitantes_unicos ?? 0)],
    ["Revogado em", link.revogado_em ? fmtDateTime(link.revogado_em) : "—"],
    ["Motivo", link.motivo_revogacao || "—"],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {titulo}
            <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[status]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {info.map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className="text-xs break-words">{v}</div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <div className="text-xs font-medium mb-2">Eventos</div>
          {eventos.length === 0 && !loading ? (
            <div className="text-xs text-muted-foreground">Nenhum evento registrado até agora.</div>
          ) : (
            <div className="space-y-1.5">
              {eventos.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
                  <div className="text-xs">
                    {EVENTO_LABEL[e.tipo_evento] || e.tipo_evento}
                    {typeof e.metadata?.motivo === "string" && (
                      <span className="text-muted-foreground"> · {String(e.metadata.motivo)}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {[e.dispositivo, e.sistema_operacional, e.navegador].filter(Boolean).join(" · ")} ·{" "}
                    {fmtDateTime(e.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {temMais && (
            <Button variant="outline" size="sm" className="mt-2" disabled={loading} onClick={() => carregar(pagina + 1)}>
              {loading ? "Carregando…" : "Carregar mais eventos"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
