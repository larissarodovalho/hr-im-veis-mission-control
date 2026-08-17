// Etapa 10 — imóveis apresentados à conta por link temporário.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link2, Copy, ExternalLink, Home } from "lucide-react";
import { toast } from "sonner";
import { fmtDateTime } from "@/lib/datetime";
import { copiarTexto } from "@/lib/imovelLinkShare";
import { estadoAtual, urlDoLink, type LinkCompartilhado } from "@/lib/imovelLinks";

const FEEDBACK_LABEL: Record<string, string> = {
  gostei: "Gostou",
  rejeitou: "Rejeitou",
  solicitou_informacoes: "Pediu informações",
  solicitou_visita: "Pediu visita",
};

export default function ContaImoveisVinculados({ contaId }: { contaId: string }) {
  const [links, setLinks] = useState<LinkCompartilhado[]>([]);
  const [itens, setItens] = useState<Record<string, string[]>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string[]>>({});
  const [ops, setOps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("imovel_links_compartilhados")
        .select("*")
        .eq("conta_id", contaId)
        .order("created_at", { ascending: false });
      const lista = (data ?? []) as unknown as LinkCompartilhado[];
      if (!ativo) return;
      setLinks(lista);

      const ids = lista.map((l) => l.id);
      if (!ids.length) { setLoading(false); return; }

      const opIds = Array.from(new Set(lista.map((l) => l.oportunidade_id).filter(Boolean))) as string[];
      const [{ data: its }, { data: evs }, { data: opsData }] = await Promise.all([
        supabase.from("imovel_link_itens").select("link_id, imovel_id, ordem").in("link_id", ids),
        supabase.from("imovel_link_eventos").select("link_id, tipo_evento, created_at").in("link_id", ids),
        opIds.length
          ? supabase.from("oportunidades").select("id,titulo").in("id", opIds)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const imIds = Array.from(new Set((its ?? []).map((i: any) => i.imovel_id)));
      const { data: ims } = imIds.length
        ? await supabase.from("imoveis").select("id,titulo,codigo").in("id", imIds)
        : { data: [] as any[] };
      const titulos: Record<string, string> = {};
      (ims ?? []).forEach((i: any) => { titulos[i.id] = i.codigo ? `${i.codigo} · ${i.titulo}` : i.titulo; });

      const mapItens: Record<string, string[]> = {};
      (its ?? []).forEach((i: any) => { (mapItens[i.link_id] ||= []).push(titulos[i.imovel_id] || "Imóvel"); });

      const mapFb: Record<string, string[]> = {};
      (evs ?? []).forEach((e: any) => {
        const label = FEEDBACK_LABEL[e.tipo_evento];
        if (!label) return;
        const arr = (mapFb[e.link_id] ||= []);
        if (!arr.includes(label)) arr.push(label);
      });

      if (!ativo) return;
      setItens(mapItens);
      setFeedbacks(mapFb);
      setOps(Object.fromEntries(((opsData?.data ?? opsData ?? []) as any[]).map((o: any) => [o.id, o.titulo || "Oportunidade"])));
      setLoading(false);
    })();
    return () => { ativo = false; };
  }, [contaId]);

  if (loading) return null;
  if (!links.length) return null;

  return (
    <Card className="p-5 space-y-3">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" /> Imóveis vinculados por link
        <Badge variant="secondary" className="text-[10px]">{links.length}</Badge>
      </h2>

      <div className="space-y-2">
        {links.map((l) => {
          const estado = estadoAtual(l);
          const url = urlDoLink(l.token);
          return (
            <div key={l.id} className="rounded-md border p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{(itens[l.id] ?? ["Imóvel"]).join(" · ")}</span>
                <Badge variant={estado === "ativo" ? "secondary" : "outline"} className="text-[10px]">
                  {estado === "ativo" ? "Ativo" : estado === "revogado" ? "Revogado" : estado === "substituido" ? "Substituído" : "Expirado"}
                </Badge>
                <Badge variant={l.primeiro_acesso_em ? "default" : "outline"} className="text-[10px]">
                  {l.primeiro_acesso_em ? "Aberto" : "Não aberto"}
                </Badge>
                {l.oportunidade_id && (
                  <Badge variant="outline" className="text-[10px]">Oportunidade: {ops[l.oportunidade_id] ?? "vinculada"}</Badge>
                )}
                {(feedbacks[l.id] ?? []).map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                ))}
              </div>

              <div className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-3">
                <span>Compartilhado em: {(l as any).compartilhado_em ? fmtDateTime((l as any).compartilhado_em) : fmtDateTime(l.created_at)}</span>
                <span>Expiração: {l.expira_em ? fmtDateTime(l.expira_em) : "Inicia no 1º acesso"}</span>
                <span>1º acesso: {l.primeiro_acesso_em ? fmtDateTime(l.primeiro_acesso_em) : "—"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Ref. {l.codigo_referencia}</span>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={async () => {
                    const ok = await copiarTexto(url);
                    ok ? toast.success("Link copiado") : toast.error("Não foi possível copiar");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => window.open(url, "_blank", "noopener")}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
