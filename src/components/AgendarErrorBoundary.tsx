import React from "react";
import { AlertCircle } from "lucide-react";

interface State { hasError: boolean; message?: string }

export default class AgendarErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AgendarPage] crash", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400 mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold">Ops, algo deu errado</h1>
            <p className="text-sm text-white/60">
              Não conseguimos abrir a página de agendamento neste dispositivo. Tente recarregar, ou peça um novo link à Sofia no WhatsApp.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Recarregar página
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
