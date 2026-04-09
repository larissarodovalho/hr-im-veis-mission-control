import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import VisaoGeral from "@/pages/VisaoGeral";
import CRMPage from "@/pages/CRMPage";
import TrafegoPago from "@/pages/TrafegoPago";
import Marketing from "@/pages/Marketing";
import RedesSociais from "@/pages/RedesSociais";
import Conteudo from "@/pages/Conteudo";
import Operacional from "@/pages/Operacional";
import SaudeSistema from "@/pages/SaudeSistema";
import ControleDeCreacao from "@/pages/ControleDeCreacao";
import Integracoes from "@/pages/Integracoes";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<VisaoGeral />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/trafego" element={<TrafegoPago />} />
            <Route path="/redes-sociais" element={<RedesSociais />} />
            <Route path="/conteudo" element={<Conteudo />} />
            <Route path="/operacional" element={<Operacional />} />
            <Route path="/saude" element={<SaudeSistema />} />
            <Route path="/controle-criacao" element={<ControleDeCreacao />} />
            <Route path="/integracoes" element={<Integracoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
