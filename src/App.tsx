import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import SiteLayout from "@/components/site/SiteLayout";
import VisaoGeral from "@/pages/VisaoGeral";
import CRMPage from "@/pages/CRMPage";
import Marketing from "@/pages/Marketing";
import Operacional from "@/pages/Operacional";
import SaudeSistema from "@/pages/SaudeSistema";
import ControleDeCreacao from "@/pages/ControleDeCreacao";
import Integracoes from "@/pages/Integracoes";
import AuthPage from "@/pages/AuthPage";
import UsuariosAdminPage from "@/pages/UsuariosAdminPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import NotFound from "@/pages/NotFound";
import HomePage from "@/pages/site/HomePage";
import ImoveisPage from "@/pages/site/ImoveisPage";
import ImovelDetalhePage from "@/pages/site/ImovelDetalhePage";
import SobrePage from "@/pages/site/SobrePage";
import ContatoPage from "@/pages/site/ContatoPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Site público */}
            <Route path="/site" element={<SiteLayout><HomePage /></SiteLayout>} />
            <Route path="/site/imoveis" element={<SiteLayout><ImoveisPage /></SiteLayout>} />
            <Route path="/site/imovel/:id" element={<SiteLayout><ImovelDetalhePage /></SiteLayout>} />
            <Route path="/site/sobre" element={<SiteLayout><SobrePage /></SiteLayout>} />
            <Route path="/site/contato" element={<SiteLayout><ContatoPage /></SiteLayout>} />
            <Route path="/site/*" element={<SiteLayout><Routes><Route path="*" element={<NotFound />} /></Routes></SiteLayout>} />

            {/* Painel CRM (protegido) */}
            <Route path="/*" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<VisaoGeral />} />
                    <Route path="/crm" element={<CRMPage />} />
                    <Route path="/marketing" element={<Marketing />} />
                    <Route path="/operacional" element={<Operacional />} />
                    <Route path="/saude" element={<SaudeSistema />} />
                    <Route path="/controle-criacao" element={<ControleDeCreacao />} />
                    <Route path="/integracoes" element={<Integracoes />} />
                    <Route path="/usuarios" element={<UsuariosAdminPage />} />
                    <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
