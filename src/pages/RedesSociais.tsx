import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { socialProfiles, engajamentoPorPerfil } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Eye, Heart, FileText } from "lucide-react";

export default function RedesSociais() {
  const [filtro, setFiltro] = useState("Todos");
  const filtered = filtro === "Todos" ? socialProfiles : socialProfiles.filter((p) => p.nome === filtro);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="section-title">Redes Sociais</h2>
        <div className="flex gap-2">
          {["Todos", "Larissa", "Hans", "HR Imóveis"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((profile) => (
          <Card key={profile.nome}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {profile.nome}
                <span className="text-xs text-muted-foreground font-normal">{profile.handle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Seguidores", value: profile.seguidores.toLocaleString(), icon: Users },
                  { label: "Alcance", value: profile.alcance.toLocaleString(), icon: Eye },
                  { label: "Engajamento", value: profile.engajamento.toLocaleString(), icon: Heart },
                  { label: "Posts", value: profile.posts.toString(), icon: FileText },
                ].map((m) => (
                  <div key={m.label} className="text-center p-2 bg-muted/50 rounded-lg">
                    <m.icon className="h-3 w-3 mx-auto mb-1 text-primary" />
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className="font-bold text-sm">{m.value}</p>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={profile.variacaoSemanal}>
                  <XAxis dataKey="semana" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="alcance" fill="hsl(224, 73%, 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engajamento" fill="hsl(43, 76%, 52%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engajamento por Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={engajamentoPorPerfil}>
              <XAxis dataKey="perfil" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="curtidas" fill="hsl(224, 73%, 40%)" name="Curtidas" radius={[6, 6, 0, 0]} />
              <Bar dataKey="comentarios" fill="hsl(43, 76%, 52%)" name="Comentários" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
