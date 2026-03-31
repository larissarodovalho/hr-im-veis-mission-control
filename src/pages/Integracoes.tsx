import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Facebook, Instagram, MessageSquare, Globe, Zap, Mail, Phone, BarChart3,
  Key, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Integracao {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icon: React.ElementType;
  status: "conectado" | "desconectado" | "erro";
  ativa: boolean;
  ultimaSync?: string;
  detalhes?: string;
}

const INTEGRACOES_INICIAIS: Integracao[] = [
  {
    id: "meta-ads", nome: "Meta Ads", descricao: "Gerencie campanhas de Facebook e Instagram Ads",
    categoria: "Tráfego Pago", icon: Facebook, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:30", detalhes: "Conta: HR Imóveis • ID: 1234567890"
  },
  {
    id: "meta-pixel", nome: "Meta Pixel", descricao: "Rastreie conversões e eventos do site",
    categoria: "Tráfego Pago", icon: Facebook, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:30", detalhes: "Pixel ID: 9876543210"
  },
  {
    id: "google-ads", nome: "Google Ads", descricao: "Campanhas de busca, display e YouTube",
    categoria: "Tráfego Pago", icon: Globe, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 13:45", detalhes: "Conta: 123-456-7890"
  },
  {
    id: "google-analytics", nome: "Google Analytics 4", descricao: "Análise de tráfego e comportamento no site",
    categoria: "Analytics", icon: BarChart3, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:00", detalhes: "Propriedade: HR Imóveis Site"
  },
  {
    id: "google-tag", nome: "Google Tag Manager", descricao: "Gerenciamento centralizado de tags e scripts",
    categoria: "Analytics", icon: Globe, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 12:00", detalhes: "Container: GTM-XXXXXXX"
  },
  {
    id: "instagram", nome: "Instagram Business", descricao: "Publicação automática e métricas do perfil",
    categoria: "Redes Sociais", icon: Instagram, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:15", detalhes: "@hrimoveissinop • 12.4k seguidores"
  },
  {
    id: "whatsapp-api", nome: "WhatsApp Business API", descricao: "Automação de mensagens e atendimento via WhatsApp",
    categoria: "Comunicação", icon: MessageSquare, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:28", detalhes: "+55 66 99901-0000 • 340 conversas/mês"
  },
  {
    id: "rdstation", nome: "RD Station", descricao: "Automação de marketing e nutrição de leads",
    categoria: "Automação", icon: Zap, status: "desconectado", ativa: false,
    detalhes: "Não configurado"
  },
  {
    id: "email-smtp", nome: "SMTP / E-mail Marketing", descricao: "Envio de e-mails transacionais e campanhas",
    categoria: "Comunicação", icon: Mail, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 10:00", detalhes: "contato@hrimoveis.com.br • 98% deliverability"
  },
  {
    id: "telefonia-voip", nome: "Telefonia VoIP", descricao: "Rastreamento de ligações e gravação de chamadas",
    categoria: "Comunicação", icon: Phone, status: "erro", ativa: true,
    ultimaSync: "30/03/2026 18:00", detalhes: "Erro de autenticação — token expirado"
  },
  {
    id: "webhook-site", nome: "Webhook do Site", descricao: "Recebe leads do formulário do site automaticamente",
    categoria: "API", icon: Globe, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:32", detalhes: "hrimoveis.com.br/contato • 12 leads hoje"
  },
  {
    id: "api-portais", nome: "API Portais Imobiliários", descricao: "Sincronização de imóveis com ZAP, Viva Real, OLX",
    categoria: "API", icon: Key, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 08:00", detalhes: "ZAP ✓ • Viva Real ✓ • OLX ✓"
  },
  {
    id: "n8n", nome: "n8n / Make", descricao: "Automações e fluxos entre sistemas (no-code)",
    categoria: "Automação", icon: Zap, status: "conectado", ativa: true,
    ultimaSync: "31/03/2026 14:00", detalhes: "5 workflows ativos • 1.2k execuções/mês"
  },
];

const CATEGORIAS = ["Todos", "Tráfego Pago", "Analytics", "Redes Sociais", "Comunicação", "Automação", "API"];

const statusBadge = (s: Integracao["status"]) => {
  if (s === "conectado") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</Badge>;
  if (s === "erro") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-[10px]"><Clock className="h-3 w-3 mr-1" />Desconectado</Badge>;
};

export default function Integracoes() {
  const [integracoes, setIntegracoes] = useState(INTEGRACOES_INICIAIS);
  const [catFiltro, setCatFiltro] = useState("Todos");

  const toggleAtiva = (id: string) => {
    setIntegracoes(prev => prev.map(i =>
      i.id === id ? { ...i, ativa: !i.ativa, status: !i.ativa ? "conectado" : "desconectado" } : i
    ));
    const integ = integracoes.find(i => i.id === id);
    toast.success(integ?.ativa ? `${integ.nome} desativada` : `${integ?.nome} ativada`);
  };

  const reconectar = (id: string) => {
    setIntegracoes(prev => prev.map(i =>
      i.id === id ? { ...i, status: "conectado", ultimaSync: new Date().toLocaleString("pt-BR") } : i
    ));
    toast.success("Reconectado com sucesso!");
  };

  const filtradas = catFiltro === "Todos" ? integracoes : integracoes.filter(i => i.categoria === catFiltro);
  const conectadas = integracoes.filter(i => i.status === "conectado").length;
  const comErro = integracoes.filter(i => i.status === "erro").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Integrações</h2>
        <p className="text-sm text-muted-foreground">Gerencie todas as conexões com plataformas e APIs externas</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{integracoes.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{conectadas}</p>
            <p className="text-xs text-muted-foreground">Conectadas</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{comErro}</p>
            <p className="text-xs text-muted-foreground">Com Erro</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{integracoes.length - conectadas - comErro}</p>
            <p className="text-xs text-muted-foreground">Desconectadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro por categoria */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map(cat => (
          <Button
            key={cat}
            size="sm"
            variant={catFiltro === cat ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setCatFiltro(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Lista de integrações */}
      <div className="grid gap-3">
        {filtradas.map(integ => (
          <Card key={integ.id} className={`border-border/50 transition-all ${integ.status === "erro" ? "border-red-500/40" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  integ.status === "conectado" ? "bg-primary/10" : integ.status === "erro" ? "bg-red-500/10" : "bg-muted"
                }`}>
                  <integ.icon className={`h-5 w-5 ${
                    integ.status === "conectado" ? "text-primary" : integ.status === "erro" ? "text-red-400" : "text-muted-foreground"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold">{integ.nome}</h3>
                    {statusBadge(integ.status)}
                    <Badge variant="outline" className="text-[10px]">{integ.categoria}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{integ.descricao}</p>
                  {integ.detalhes && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{integ.detalhes}</p>
                  )}
                  {integ.ultimaSync && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                      <RefreshCw className="h-2.5 w-2.5" /> Última sync: {integ.ultimaSync}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {integ.status === "erro" && (
                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => reconectar(integ.id)}>
                      <RefreshCw className="h-3 w-3" /> Reconectar
                    </Button>
                  )}
                  {integ.status === "desconectado" && (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => reconectar(integ.id)}>
                      <ExternalLink className="h-3 w-3" /> Conectar
                    </Button>
                  )}
                  <Switch checked={integ.ativa} onCheckedChange={() => toggleAtiva(integ.id)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
