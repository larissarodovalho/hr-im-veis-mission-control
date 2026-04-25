import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import SiteLayout from "@/components/site/SiteLayout";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import Imoveis from "@/pages/Imoveis";
import WhatsApp from "@/pages/WhatsApp";
import Meetings from "@/pages/Meetings";
import Calls from "@/pages/Calls";
import Visits from "@/pages/Visits";
import Schedule from "@/pages/Schedule";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
// Site público (mantido)
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
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />

            {/* Site público preservado */}
            <Route path="/site" element={<SiteLayout><HomePage /></SiteLayout>} />
            <Route path="/site/imoveis" element={<SiteLayout><ImoveisPage /></SiteLayout>} />
            <Route path="/site/imovel/:id" element={<SiteLayout><ImovelDetalhePage /></SiteLayout>} />
            <Route path="/site/sobre" element={<SiteLayout><SobrePage /></SiteLayout>} />
            <Route path="/site/contato" element={<SiteLayout><ContatoPage /></SiteLayout>} />

            {/* CRM (clone Brazil Lands) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="contas" element={<Accounts />} />
              <Route path="contas/:id" element={<AccountDetail />} />
              <Route path="imoveis" element={<Imoveis />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="reunioes" element={<Meetings />} />
              <Route path="ligacoes" element={<Calls />} />
              <Route path="visitas" element={<Visits />} />
              <Route path="agenda" element={<Schedule />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
