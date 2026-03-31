import {
  LayoutDashboard,
  Users,
  Megaphone,
  Share2,
  FileText,
  Settings,
  Activity,
  Plug,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import hrLogo from "@/assets/hr-imoveis-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Visão Geral", url: "/", icon: LayoutDashboard },
  { title: "CRM — Comercial", url: "/crm", icon: Users },
  { title: "Tráfego Pago", url: "/trafego", icon: Megaphone },
  { title: "Redes Sociais", url: "/redes-sociais", icon: Share2 },
  { title: "Conteúdo", url: "/conteudo", icon: FileText },
  { title: "Integrações", url: "/integracoes", icon: Plug },
  { title: "Operacional", url: "/operacional", icon: Settings },
  { title: "Saúde do Sistema", url: "/saude", icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6">
        <div className={`px-4 mb-8 flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-accent-foreground" />
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
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`transition-all duration-200 ${isActive ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/50"}`}
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className={`mr-2 h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
