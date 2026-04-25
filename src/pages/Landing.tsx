import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, TrendingUp } from "lucide-react";
import logoCompleta from "@/assets/brand/hr-imoveis-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex items-center justify-between py-5">
        <img src={logoCompleta} alt="HR Imóveis" className="h-16 w-auto object-contain" />
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/site">Ver site público</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Acessar CRM</Link>
          </Button>
        </div>
      </header>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 text-center">
          <div className="mx-auto bg-background rounded-2xl p-8 inline-block shadow-card">
            <img
              src={logoCompleta}
              alt="HR Imóveis"
              className="h-48 md:h-64 w-auto object-contain"
            />
          </div>
          <p className="mt-8 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Plataforma interna de gestão de leads, imóveis e atendimento — venda e locação com WhatsApp integrado.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Começar agora</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              asChild
            >
              <Link to="/site">Ir para o site</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, title: "Funil de leads", desc: "Kanban com etapas customizadas e SLA visual de atendimento." },
            { icon: MessageSquare, title: "WhatsApp integrado", desc: "Atendimento centralizado com histórico por lead." },
            { icon: TrendingUp, title: "Captação 24/7", desc: "Webhooks de Meta/Google e formulários do site convertem em leads." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl bg-card p-6 shadow-card border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
