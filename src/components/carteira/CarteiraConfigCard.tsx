import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, Loader2 } from "lucide-react";
import { useCarteiraConfig, salvarCarteiraConfig, CarteiraConfig } from "@/hooks/useCarteira";

export default function CarteiraConfigCard() {
  const { config, loading, reload } = useCarteiraConfig();
  const [form, setForm] = useState<CarteiraConfig | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (config) setForm(config); }, [config]);

  const salvar = async () => {
    if (!form) return;
    if (form.dias_devolucao_automatica < 1 || form.dias_sem_proxima_acao < 1) {
      toast.error("Os prazos devem ser de pelo menos 1 dia.");
      return;
    }
    setSalvando(true);
    try {
      await salvarCarteiraConfig(form);
      toast.success("Regras da carteira atualizadas.");
      reload();
    } catch (e: any) {
      toast.error(e.message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Distribuição de Carteira
        </CardTitle>
        <CardDescription>
          Regras da rotina automática que roda todas as madrugadas (horário de Cuiabá).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !form ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Devolução automática por inatividade</Label>
                <p className="text-xs text-muted-foreground">
                  Devolve ao gestor as contas sem nenhuma tentativa após o prazo definido.
                </p>
              </div>
              <Switch
                checked={form.devolucao_automatica}
                onCheckedChange={(v) => setForm({ ...form, devolucao_automatica: v })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="dias-dev">Dias após o prazo para devolver</Label>
                <Input
                  id="dias-dev"
                  type="number"
                  min={1}
                  value={form.dias_devolucao_automatica}
                  onChange={(e) => setForm({ ...form, dias_devolucao_automatica: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dias-acao">Dias sem próxima ação para alertar</Label>
                <Input
                  id="dias-acao"
                  type="number"
                  min={1}
                  value={form.dias_sem_proxima_acao}
                  onChange={(e) => setForm({ ...form, dias_sem_proxima_acao: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Resumos diários por e-mail</Label>
                <p className="text-xs text-muted-foreground">
                  Envia o resumo de pendências para corretores e gestores.
                </p>
              </div>
              <Switch
                checked={form.emails_resumo}
                onCheckedChange={(v) => setForm({ ...form, emails_resumo: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Placar visível para corretores</Label>
                <p className="text-xs text-muted-foreground">
                  Quando ligado, todos os corretores veem o ranking completo. Desligado, cada corretor vê apenas a própria posição.
                </p>
              </div>
              <Switch
                checked={form.ranking_visivel}
                onCheckedChange={(v) => setForm({ ...form, ranking_visivel: v })}
              />
            </div>

            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar regras
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
