import {
  LayoutDashboard,
  Users,
  Megaphone,
  Share2,
  FileText,
  Settings,
  Activity,
  Plug,
  Phone,
  Building2,
  Home,
  TrendingUp,
  ClipboardList,
  BarChart2,
  HandCoins,
  CalendarCheck,
  CheckCircle2,
  FileDown,
  FileText as FileTextIcon,
  MessageCircle,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import hrLogo from "@/assets/hr-imoveis-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const CRM_SUBTABS = [
  { label: "Leads", value: "leads", icon: Users },
  { label: "Contatos", value: "contatos", icon: Phone },
  { label: "Kanban", value: "kanban", icon: Building2 },
  { label: "Imóveis", value: "imoveis", icon: Home },
  { label: "Funil de Vendas", value: "funil", icon: TrendingUp },
  { label: "Controle de Criação", value: "criacao", icon: ClipboardList },
  { label: "Análise de Leads", value: "analise", icon: BarChart2 },
  { label: "Oportunidades", value: "oportunidades", icon: HandCoins },
  { label: "Visitas", value: "visitas", icon: CalendarCheck },
  { label: "Tarefas", value: "tarefas", icon: CheckCircle2 },
  { label: "Relatórios", value: "relatorios", icon: FileDown },
  { label: "Propostas", value: "propostas", icon: FileTextIcon },
  { label: "WhatsApp", value: "whatsapp", icon: MessageCircle },
];

const MARKETING_SUBTABS = [
  { label: "Visão Geral", value: "geral", icon: LayoutDashboard },
  { label: "Tráfego Pago", value: "trafego", icon: Megaphone },
  { label: "Redes Sociais", value: "redes-sociais", icon: Share2 },
  { label: "Conteúdo", value: "conteudo", icon: FileText },
];

const items = [
  { title: "Visão Geral", url: "/", icon: LayoutDashboard },
  { title: "CRM — Comercial", url: "/crm", icon: Users },
  { title: "Marketing", url: "/marketing", icon: TrendingUp },
  { title: "Integrações", url: "/integracoes", icon: Plug },
  { title: "Operacional", url: "/operacional", icon: Settings },
  { title: "Saúde do Sistema", url: "/saude", icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCRM = location.pathname === "/crm";
  const isMarketing = location.pathname === "/marketing";
  const activeTab = searchParams.get("tab") || (isCRM ? "leads" : "geral");

  const adminItems = [
    { title: "Usuários", url: "/usuarios", icon: Shield },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6">
        <div className={`px-4 mb-8 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={hrLogo} alt="HR Imóveis" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground font-display tracking-tight">HR Imóveis</h1>
              <p className="text-xs text-sidebar-foreground/50">Mission Control</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === "/crm" ? isCRM : item.url === "/marketing" ? isMarketing : location.pathname === item.url;
                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url === "/crm" ? "/crm?tab=leads" : item.url === "/marketing" ? "/marketing?tab=geral" : item.url}
                          end={item.url === "/"}
                          className={`transition-all duration-200 ${isActive ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/50"}`}
                        >
                          <item.icon className={`mr-2 h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* CRM sub-tabs */}
                    {item.url === "/crm" && isCRM && !collapsed && (
                      <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-sidebar-accent pl-3">
                        {CRM_SUBTABS.map((sub) => {
                          const isSubActive = activeTab === sub.value;
                          return (
                            <button
                              key={sub.value}
                              onClick={() => navigate(`/crm?tab=${sub.value}`)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 ${
                                isSubActive
                                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                              }`}
                            >
                              <sub.icon className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Marketing sub-tabs */}
                    {item.url === "/marketing" && isMarketing && !collapsed && (
                      <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-sidebar-accent pl-3">
                        {MARKETING_SUBTABS.map((sub) => {
                          const isSubActive = activeTab === sub.value;
                          return (
                            <button
                              key={sub.value}
                              onClick={() => navigate(`/marketing?tab=${sub.value}`)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-150 ${
                                isSubActive
                                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                              }`}
                            >
                              <sub.icon className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
