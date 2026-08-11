import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useMinhaPosicao, selosDoRanking } from "@/hooks/useCarteira";

function medalha(pos: number) {
  if (pos === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (pos === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (pos === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-lg font-bold tabular-nums">{pos}</span>;
}

function MetaBarra({ valor, meta, label }: { valor: number; meta: number; label: string }) {
  if (meta <= 0) return null;
  const pct = Math.min(100, (valor / meta) * 100);
  const cor = pct >= 100 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-amber-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{valor}/{meta}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${cor}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}

export default function CarteiraMinhaPosicao({ corretorId }: { corretorId?: string | null }) {
  const { dados } = useMinhaPosicao(corretorId ?? null);

  if (!dados || dados.recebidas === 0) return null;

  const selos = selosDoRanking(dados);

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-muted">
            {medalha(dados.posicao)}
            <span className="text-[10px] text-muted-foreground mt-0.5">de {dados.total_corretores}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sua posição no mês</p>
            <p className="text-2xl font-bold tabular-nums">{dados.score.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">pts</span></p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Recebidas</p>
            <p className="text-lg font-semibold tabular-nums">{dados.recebidas}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contato feito</p>
            <p className="text-lg font-semibold tabular-nums">{dados.contato_estabelecido}<span className="text-xs text-muted-foreground"> ({dados.pct_contato.toFixed(0)}%)</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Oportunidades</p>
            <p className="text-lg font-semibold tabular-nums">{dados.oportunidades}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fechamentos</p>
            <p className="text-lg font-semibold tabular-nums">{dados.fechamentos}</p>
          </div>
        </div>

        {(dados.meta_contatos > 0 || dados.meta_oportunidades > 0 || dados.meta_fechamentos > 0) && (
          <div className="flex-1 space-y-2 min-w-[180px]">
            <MetaBarra valor={dados.contato_estabelecido} meta={dados.meta_contatos} label="Meta de contatos" />
            <MetaBarra valor={dados.oportunidades} meta={dados.meta_oportunidades} label="Meta de oportunidades" />
            <MetaBarra valor={dados.fechamentos} meta={dados.meta_fechamentos} label="Meta de fechamentos" />
          </div>
        )}
      </div>

      {selos.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground mr-1">Selos:</span>
          {selos.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
        </div>
      )}
    </Card>
  );
}
