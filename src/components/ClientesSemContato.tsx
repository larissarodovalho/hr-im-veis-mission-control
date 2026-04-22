import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { Lead } from "@/data/mockData";

interface Props {
  leads: Lead[];
}

const FAIXAS = [7, 15, 30, 60, 90, 120] as const;
type Faixa = typeof FAIXAS[number];

// Cores por severidade (mais dias = mais crítico)
const corFaixa: Record<Faixa, { badge: string; ring: string; text: string; dot: string }> = {
  7:   { badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",       ring: "ring-blue-200 dark:ring-blue-900",       text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500" },
  15:  { badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",       ring: "ring-cyan-200 dark:ring-cyan-900",       text: "text-cyan-700 dark:text-cyan-300",       dot: "bg-cyan-500" },
  30:  { badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",   ring: "ring-amber-200 dark:ring-amber-900",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500" },
  60:  { badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", ring: "ring-orange-200 dark:ring-orange-900", text: "text-orange-700 dark:text-orange-300",   dot: "bg-orange-500" },
  90:  { badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",           ring: "ring-red-200 dark:ring-red-900",         text: "text-red-700 dark:text-red-300",         dot: "bg-red-500" },
  120: { badge: "bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-200",       ring: "ring-rose-300 dark:ring-rose-900",       text: "text-rose-800 dark:text-rose-200",       dot: "bg-rose-600" },
};

function diasDesde(dataStr: string): number {
  const d = new Date(dataStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return 0;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ultimoContatoLead(lead: Lead): { dias: number; data: string } {
  const datas = (lead.historico || []).map(h => h.data).filter(Boolean);
  const ref = datas.length > 0 ? datas[datas.length - 1] : lead.dataEntrada;
  return { dias: diasDesde(ref), data: ref };
}

// Faixa = maior valor <= dias. Ex: 8 dias -> faixa 7. 16 -> 15. 130 -> 120.
function faixaDe(dias: number): Faixa | null {
  let f: Faixa | null = null;
  for (const v of FAIXAS) if (dias >= v) f = v;
  return f;
}

export default function ClientesSemContato({ leads }: Props) {
  const [faixaAtiva, setFaixaAtiva] = useState<Faixa | null>(null);
  const [expandido, setExpandido] = useState(true);

  // Considera apenas leads ativos no funil (exclui desqualificado e fechamento concluído)
  const leadsAtivos = useMemo(
    () => leads.filter(l => l.etapa !== "Desqualificado" && l.etapa !== "Fechamento"),
    [leads]
  );

  const porFaixa = useMemo(() => {
    const map = new Map<Faixa, Array<Lead & { _dias: number; _ultimo: string }>>();
    FAIXAS.forEach(f => map.set(f, []));
    leadsAtivos.forEach(l => {
      const { dias, data } = ultimoContatoLead(l);
      const f = faixaDe(dias);
      if (f !== null) map.get(f)!.push({ ...l, _dias: dias, _ultimo: data });
    });
    // ordena cada faixa do mais antigo p/ mais recente
    map.forEach(arr => arr.sort((a, b) => b._dias - a._dias));
    return map;
  }, [leadsAtivos]);

  const totalAlertas = useMemo(
    () => Array.from(porFaixa.values()).reduce((s, a) => s + a.length, 0),
    [porFaixa]
  );

  const listaSelecionada = faixaAtiva !== null ? porFaixa.get(faixaAtiva) || [] : [];

  return (
    <Card className="border-amber-200 dark:border-amber-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Clientes sem contato do corretor
            <Badge variant="outline" className="ml-1 text-[11px] font-normal">
              {totalAlertas} no total
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setExpandido(e => !e)}
          >
            {expandido ? <><ChevronUp className="h-3.5 w-3.5 mr-1" />Recolher</> : <><ChevronDown className="h-3.5 w-3.5 mr-1" />Expandir</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Acompanhe quanto tempo cada lead está sem retorno do corretor para não perder oportunidades.
        </p>
      </CardHeader>

      {expandido && (
        <CardContent className="space-y-4">
          {/* Cards por faixa */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {FAIXAS.map(f => {
              const qtd = porFaixa.get(f)?.length || 0;
              const ativo = faixaAtiva === f;
              const cor = corFaixa[f];
              return (
                <button
                  key={f}
                  onClick={() => setFaixaAtiva(ativo ? null : f)}
                  className={`text-left rounded-lg border p-3 transition hover:shadow-sm ${ativo ? `ring-2 ${cor.ring}` : "ring-0"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${cor.dot}`} />
                    <span className={`text-[11px] font-medium ${cor.text}`}>
                      {f === 120 ? "+120 dias" : `${f} dias`}
                    </span>
                  </div>
                  <p className="text-xl font-bold font-display leading-none">{qtd}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {qtd === 1 ? "cliente" : "clientes"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Lista da faixa ativa */}
          {faixaAtiva !== null && (
            <div className="rounded-md border bg-muted/20">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <p className="text-xs font-medium">
                  Clientes na faixa de{" "}
                  <span className={corFaixa[faixaAtiva].text}>
                    {faixaAtiva === 120 ? "+120 dias" : `${faixaAtiva} dias`}
                  </span>{" "}
                  sem contato
                </p>
                <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setFaixaAtiva(null)}>
                  Fechar
                </Button>
              </div>
              {listaSelecionada.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  Nenhum cliente nesta faixa. 🎉
                </p>
              ) : (
                <ul className="divide-y">
                  {listaSelecionada.map(l => (
                    <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{l.nome}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span>{l.telefone}</span>
                          <span>•</span>
                          <span>Corretor: {l.corretor}</span>
                          <span>•</span>
                          <span>Etapa: {l.etapa}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${corFaixa[faixaAtiva].badge} border-transparent`}>
                        {l._dias}d sem contato
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                          <a href={`tel:${l.telefone.replace(/\D/g, "")}`} title="Ligar">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                          <a
                            href={`https://wa.me/55${l.telefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {faixaAtiva === null && (
            <p className="text-[11px] text-muted-foreground text-center">
              Clique em uma faixa acima para ver os clientes que precisam de retorno.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
