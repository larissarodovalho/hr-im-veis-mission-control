import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users as UsersIcon,
  MessageSquare,
  Calendar,
  Phone,
  MapPin,
  LogOut,
  Settings,
  BarChart3,
  UserCog,
  CalendarRange,
  Menu,
  Building2,
  Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/brand/hr-imoveis-logo-white.png";
import logoBlack from "@/assets/brand/hr-imoveis-logo.png";

type NavItem = { to: string; icon: any; label: string; end?: boolean };
const baseNav: NavItem[] = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/leads", icon: UsersIcon, label: "Leads" },
  { to: "/app/contas", icon: Building2, label: "Contas" },
  { to: "/app/imoveis", icon: Home, label: "Imóveis" },
  { to: "/app/whatsapp", icon: MessageSquare, label: "WhatsApp" },
  { to: "/app/reunioes", icon: Calendar, label: "Reuniões" },
  { to: "/app/ligacoes", icon: Phone, label: "Ligações" },
  { to: "/app/visitas", icon: MapPin, label: "Visitas" },
  { to: "/app/agenda", icon: CalendarRange, label: "Agenda" },
];
const adminNav: NavItem[] = [
  { to: "/app/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/app/usuarios", icon: UserCog, label: "Usuários" },
  { to: "/app/configuracoes", icon: Settings, label: "Configurações" },
];

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const { isAdmin, isGestor } = useRole();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const nav = isAdmin || isGestor ? [...baseNav, ...adminNav] : baseNav;

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex items-center justify-center px-5 py-6 border-b border-sidebar-border bg-sidebar">
        <img src={logoWhite} alt="HR Imóveis" className="h-20 w-auto object-contain" />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background overscroll-none">
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 overflow-hidden",
          desktopOpen ? "w-64" : "w-0"
        )}
      >
        <div className="w-64 flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="flex items-center gap-2 border-b bg-background px-3 py-2 shrink-0 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setMobileOpen(true);
              } else {
                setDesktopOpen((v) => !v);
              }
            }}
            aria-label="Alternar menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={logoBlack} alt="HR Imóveis" className="h-8 w-auto object-contain md:hidden" />
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
