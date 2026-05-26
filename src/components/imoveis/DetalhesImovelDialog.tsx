import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { Home as HomeIcon, MapPin, Ruler, BedDouble, Bath, Car, FileText } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: any | null;
  corretorNome?: string;
  proprietarioNome?: string;
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-sm text-foreground">{value || "—"}</div>
  </div>
);

export default function DetalhesImovelDialog({ open, onOpenChange, imovel, corretorNome, proprietarioNome }: Props) {
  if (!imovel) return null;
  const i = imovel;
  const endereco = [i.endereco, i.numero, i.complemento].filter(Boolean).join(", ");
  const localidade = [i.bairro, i.cidade && i.estado ? `${i.cidade}/${i.estado}` : i.cidade || i.estado].filter(Boolean).join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-primary" />
            {i.titulo}
            {i.codigo && <Badge variant="outline" className="text-[10px]">{i.codigo}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {i.fotos?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {i.fotos.map((url: string, idx: number) => (
                <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                  <img src={url} alt={`${i.titulo} ${idx + 1}`} className="w-full h-32 object-cover rounded-md border" />
                </a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{i.status}</Badge>
            <Badge variant="secondary">{i.finalidade}</Badge>
            <Badge variant="secondary">{i.tipo}</Badge>
            {i.destaque && <Badge className="bg-amber-500 text-white border-0">Destaque</Badge>}
            {i.publicado === false && <Badge variant="outline">Não publicado</Badge>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Valor" value={<span className="font-semibold text-primary">{formatBRL(i.valor)}</span>} />
            <Field label="Condomínio" value={i.valor_condominio != null ? formatBRL(i.valor_condominio) : "—"} />
            <Field label="IPTU" value={i.valor_iptu != null ? formatBRL(i.valor_iptu) : "—"} />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" /> Endereço
            </div>
            <div className="text-sm">{endereco || "—"}</div>
            <div className="text-xs text-muted-foreground">{localidade}{i.cep ? ` · CEP ${i.cep}` : ""}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Área útil" value={i.area_util ? `${i.area_util} m²` : "—"} />
            <Field label="Área total" value={i.area_total ? `${i.area_total} m²` : "—"} />
            <Field label="Área construída" value={i.area_construida ? `${i.area_construida} m²` : "—"} />
            <Field label="Matrícula" value={i.matricula} />
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-muted-foreground" /> {i.quartos || 0} quartos{i.suites ? ` (${i.suites} suíte${i.suites > 1 ? "s" : ""})` : ""}</span>
            <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-muted-foreground" /> {i.banheiros || 0} banheiros</span>
            <span className="flex items-center gap-1.5"><Car className="h-4 w-4 text-muted-foreground" /> {i.vagas || 0} vagas</span>
          </div>

          {i.caracteristicas?.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Características</div>
              <div className="flex flex-wrap gap-1.5">
                {i.caracteristicas.map((c: string) => (
                  <Badge key={c} variant="outline" className="text-[11px]">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {i.descricao && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" /> Descrição
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{i.descricao}</p>
            </div>
          )}

          {(i.exclusividade_inicio || i.exclusividade_fim || i.exclusividade_observacoes) && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Exclusividade</div>
              <div className="text-sm">
                {i.exclusividade_inicio || "—"} → {i.exclusividade_fim || "—"}
              </div>
              {i.exclusividade_observacoes && <p className="text-xs text-muted-foreground">{i.exclusividade_observacoes}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <Field label="Corretor" value={corretorNome} />
            <Field label="Proprietário" value={proprietarioNome} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
