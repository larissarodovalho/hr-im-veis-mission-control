import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

const RedirectImovel = () => {
  const { id } = useParams();
  return <Navigate to={`/imovel/${id}`} replace />;
};
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StaffRoute from "@/components/StaffRoute";
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
import Tasks from "@/pages/Tasks";
import Documents from "@/pages/Documents";
import Contratos from "@/pages/Contratos";
import DocumentDetail from "@/pages/DocumentDetail";
import Reports from "@/pages/Reports";
import Users from "@/pages/UsuariosAdminPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import Newsletter from "@/pages/Newsletter";
import NotFound from "@/pages/NotFound";
import AgendarPage from "@/pages/AgendarPage";
import AgendarErrorBoundary from "@/components/AgendarErrorBoundary";
import UnsubscribePage from "@/pages/UnsubscribePage";
import CapturaPage from "@/pages/CapturaPage";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/agendar/:token" element={<AgendarErrorBoundary><AgendarPage /></AgendarErrorBoundary>} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/captura" element={<CapturaPage />} />

            {/* Site público na raiz */}
            <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
            <Route path="/imoveis" element={<SiteLayout><ImoveisPage /></SiteLayout>} />
            <Route path="/imovel/:id" element={<SiteLayout><ImovelDetalhePage /></SiteLayout>} />
            <Route path="/sobre" element={<SiteLayout><SobrePage /></SiteLayout>} />
            <Route path="/contato" element={<SiteLayout><ContatoPage /></SiteLayout>} />

            {/* Redirects das URLs antigas do site */}
            <Route path="/site" element={<Navigate to="/" replace />} />
            <Route path="/site/imoveis" element={<Navigate to="/imoveis" replace />} />
            <Route path="/site/imovel/:id" element={<RedirectImovel />} />
            <Route path="/site/sobre" element={<Navigate to="/sobre" replace />} />
            <Route path="/site/contato" element={<Navigate to="/contato" replace />} />

            {/* Landing interno (opcional) */}
            <Route path="/landing" element={<Landing />} />

            {/* CRM */}
            <Route
              path="/crm"
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
              <Route path="tarefas" element={<Tasks />} />
              <Route path="documentos" element={<Documents />} />
              <Route path="documentos/:id" element={<DocumentDetail />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="relatorios" element={<StaffRoute><Reports /></StaffRoute>} />
              <Route path="usuarios" element={<StaffRoute><Users /></StaffRoute>} />
              <Route path="configuracoes" element={<StaffRoute><ConfiguracoesPage /></StaffRoute>} />
              <Route path="newsletter" element={<StaffRoute><Newsletter /></StaffRoute>} />
            </Route>

            {/* Redirect das URLs antigas do CRM */}
            <Route path="/app/*" element={<Navigate to="/crm" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
