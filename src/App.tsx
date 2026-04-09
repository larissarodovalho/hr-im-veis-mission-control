import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import SiteLayout from "@/components/site/SiteLayout";
import VisaoGeral from "@/pages/VisaoGeral";
import CRMPage from "@/pages/CRMPage";
import Marketing from "@/pages/Marketing";
import Operacional from "@/pages/Operacional";
import SaudeSistema from "@/pages/SaudeSistema";
import ControleDeCreacao from "@/pages/ControleDeCreacao";
import Integracoes from "@/pages/Integracoes";
import NotFound from "@/pages/NotFound";
import HomePage from "@/pages/site/HomePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Site público */}
          <Route path="/site" element={<SiteLayout><HomePage /></SiteLayout>} />
          <Route path="/site/*" element={<SiteLayout><Routes><Route path="*" element={<NotFound />} /></Routes></SiteLayout>} />

          {/* Painel CRM */}
          <Route path="/*" element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<VisaoGeral />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/operacional" element={<Operacional />} />
                <Route path="/saude" element={<SaudeSistema />} />
                <Route path="/controle-criacao" element={<ControleDeCreacao />} />
                <Route path="/integracoes" element={<Integracoes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DashboardLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
