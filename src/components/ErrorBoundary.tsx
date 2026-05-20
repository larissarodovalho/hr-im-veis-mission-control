import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="p-6 max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-display text-lg font-semibold">Algo deu errado nesta página</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado ao carregar este conteúdo. Tente novamente; se persistir, recarregue a página.
            </p>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <Button onClick={this.reset}>Tentar novamente</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>Recarregar página</Button>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
