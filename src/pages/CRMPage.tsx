import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadsTab from "@/components/LeadsTab";
import ContatosTab from "@/components/ContatosTab";
import ContasTab from "@/components/ContasTab";
import WhatsAppTab from "@/components/WhatsAppTab";
import EmptyState from "@/components/EmptyState";

const CORRETOR_TABS = ["leads", "contas", "contatos", "whatsapp"] as const;
const STAFF_EXTRA_TABS = ["imoveis", "funil", "criacao", "analise", "oportunidades", "visitas", "tarefas", "relatorios", "propostas"] as const;

const TAB_LABELS: Record<string, string> = {
  leads: "Leads",
  contas: "Contas",
  contatos: "Contatos",
  whatsapp: "WhatsApp",
  kanban: "Kanban",
  imoveis: "Imóveis",
  funil: "Funil",
  criacao: "Criação",
  analise: "Análise",
  oportunidades: "Oportunidades",
  visitas: "Visitas",
  tarefas: "Tarefas",
  relatorios: "Relatórios",
  propostas: "Propostas",
};

export default function CRM() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isGestor } = useAuth();
  const isStaff = isAdmin || isGestor;

  const allowedTabs = isStaff
    ? [...CORRETOR_TABS, ...STAFF_EXTRA_TABS]
    : [...CORRETOR_TABS];

  const requested = searchParams.get("tab") || "leads";
  const activeTab = allowedTabs.includes(requested as any) ? requested : "leads";

  useEffect(() => {
    if (requested !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [requested, activeTab, setSearchParams]);

  return (
    <div className="space-y-6">
      <h2 className="section-title">CRM Comercial</h2>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="flex flex-wrap h-auto">
          {allowedTabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          <LeadsTab />
        </TabsContent>

        <TabsContent value="contas" className="space-y-6">
          <ContasTab />
        </TabsContent>

        <TabsContent value="contatos" className="space-y-6">
          <ContatosTab />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppTab />
        </TabsContent>

        {STAFF_EXTRA_TABS.map((t) => (
          <TabsContent key={t} value={t} className="space-y-4">
            <EmptyState
              title={`${TAB_LABELS[t]} aguardando dados reais`}
              description="Esta área será reativada assim que estiver conectada ao banco de dados real."
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
