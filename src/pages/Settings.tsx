import { Card } from "@/components/ui/card";

export default function Settings() {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold">Configurações</h1>

      <Card className="p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">Backend</h2>
        <p className="text-sm text-muted-foreground">URL: <code className="bg-muted px-1 rounded text-xs">{projectUrl}</code></p>
        <p className="text-sm text-muted-foreground">Para gerenciar webhooks, integrações ou API keys, contate o administrador.</p>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-display text-xl font-semibold">Sobre</h2>
        <p className="text-sm text-muted-foreground">CRM HR Imóveis · Grupo Rodovalho</p>
      </Card>
    </div>
  );
}
