import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { contentPosts } from "@/data/mockData";

const statusColors: Record<string, string> = {
  "💡 Ideia": "bg-muted text-muted-foreground",
  "✍️ Roteiro": "bg-accent/20 text-accent-foreground",
  "🎬 Gravado": "bg-primary/10 text-primary",
  "✅ Publicado": "bg-emerald-50 text-emerald-700",
};

export default function Conteudo() {
  const [filtro, setFiltro] = useState("Todos");
  const filtered = filtro === "Todos" ? contentPosts : contentPosts.filter((p) => p.perfil === filtro);

  // Group by date for calendar view
  const byDate = filtered.reduce((acc, post) => {
    if (!acc[post.data]) acc[post.data] = [];
    acc[post.data].push(post);
    return acc;
  }, {} as Record<string, typeof contentPosts>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="section-title">Conteúdo</h2>
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

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendário de Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(byDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, posts]) => (
                <div key={date} className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  {posts.map((post) => (
                    <div key={post.id} className={`rounded-md px-2 py-1.5 text-xs ${statusColors[post.status]}`}>
                      <p className="font-medium truncate">{post.titulo}</p>
                      <p className="text-[10px] opacity-70">{post.status}</p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Bank Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banco de Pautas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Título</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Perfil</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Formato</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Tema</th>
                  <th className="text-left p-3 font-medium">Prioridade</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{post.titulo}</td>
                    <td className="p-3 hidden sm:table-cell">{post.perfil}</td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{post.formato}</Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{post.tema}</td>
                    <td className="p-3">
                      <Badge variant={post.prioridade === "Alta" ? "default" : "secondary"} className="text-xs">
                        {post.prioridade}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">{post.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
