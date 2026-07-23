import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("E-mail inválido").max(160),
  mensagem: z.string().trim().min(3, "Escreva uma mensagem").max(1000),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ContactFormDialog({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", mensagem: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Preencha os campos corretamente");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      email: parsed.data.email,
      observacoes: parsed.data.mensagem,
      origem: "Formulário Site",
      status: "novo",
      etapa_funil: "Novo Lead",
      tags: ["site"],
    } as any);
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      return;
    }
    toast.success("Mensagem enviada! Entraremos em contato em breve.");
    setForm({ nome: "", telefone: "", email: "", mensagem: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-extralight text-2xl">Fale conosco</DialogTitle>
          <DialogDescription className="text-white/60">
            Preencha o formulário e um corretor entrará em contato.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-nome" className="text-white/70 text-xs uppercase tracking-wider">Nome</Label>
            <Input id="cf-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} className="bg-white/5 border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-tel" className="text-white/70 text-xs uppercase tracking-wider">Telefone</Label>
            <Input id="cf-tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} maxLength={20} placeholder="(66) 99999-9999" className="bg-white/5 border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-email" className="text-white/70 text-xs uppercase tracking-wider">E-mail</Label>
            <Input id="cf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={160} className="bg-white/5 border-white/10 text-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-msg" className="text-white/70 text-xs uppercase tracking-wider">Mensagem</Label>
            <Textarea id="cf-msg" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} maxLength={1000} rows={4} className="bg-white/5 border-white/10 text-white" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-60 transition-all"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
