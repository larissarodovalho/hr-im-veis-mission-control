import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { renderTemplate, formatCurrency, formatDateBR, generatePdfBlob } from "@/lib/contratos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

type Item = { id: string; label: string; extra?: any };

export default function NovoContratoDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [template, setTemplate] = useState<any>(null);
  const [leads, setLeads] = useState<Item[]>([]);
  const [contas, setContas] = useState<Item[]>([]);
  const [imoveis, setImoveis] = useState<Item[]>([]);

  const [clienteOrigem, setClienteOrigem] = useState<"lead" | "conta">("conta");
  const [leadId, setLeadId] = useState<string>("");
  const [contaId, setContaId] = useState<string>("");
  const [imovelId, setImovelId] = useState<string>("");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [valor, setValor] = useState<string>("");
  const [comissao, setComissao] = useState<string>("5");
  const [prazoDias, setPrazoDias] = useState<string>("365");
  const [dataInicio, setDataInicio] = useState<string>(new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState("");

  const dataFim = useMemo(() => {
    if (!dataInicio || !prazoDias) return "";
    const d = new Date(dataInicio + "T00:00:00");
    d.setDate(d.getDate() + Number(prazoDias));
    return d.toISOString().slice(0, 10);
  }, [dataInicio, prazoDias]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [tpl, ld, ct, im] = await Promise.all([
        (supabase.from("contrato_templates" as any) as any)
          .select("id,nome,conteudo").eq("ativo", true).eq("tipo", "autorizacao_venda_exclusividade")
          .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("leads").select("id,nome,telefone,email").order("created_at", { ascending: false }).limit(500),
        supabase.from("contas").select("id,nome,documento,endereco,email,telefone").order("created_at", { ascending: false }).limit(500),
        supabase.from("imoveis").select("id,codigo,titulo,endereco,numero,bairro,cidade,estado,valor,area_total").order("created_at", { ascending: false }).limit(500),
      ]);
      if (tpl.data) setTemplate(tpl.data);
      if (ld.data) setLeads(ld.data.map((l: any) => ({ id: l.id, label: l.nome, extra: l })));
      if (ct.data) setContas(ct.data.map((c: any) => ({ id: c.id, label: c.nome, extra: c })));
      if (im.data) setImoveis(im.data.map((i: any) => ({ id: i.id, label: `${i.codigo ? i.codigo + " — " : ""}${i.titulo}`, extra: i })));
    })();
  }, [open]);

  // Preencher cliente ao escolher lead/conta
  useEffect(() => {
    if (clienteOrigem === "lead" && leadId) {
      const l = leads.find((x) => x.id === leadId)?.extra;
      if (l) { setClienteNome(l.nome || ""); setClienteEmail(l.email || ""); setClienteTelefone(l.telefone || ""); }
    }
    if (clienteOrigem === "conta" && contaId) {
      const c = contas.find((x) => x.id === contaId)?.extra;
      if (c) {
        setClienteNome(c.nome || ""); setClienteDocumento(c.documento || "");
        setClienteEndereco(c.endereco || ""); setClienteEmail(c.email || ""); setClienteTelefone(c.telefone || "");
      }
    }
  }, [clienteOrigem, leadId, contaId, leads, contas]);

  // Preencher valor com o imóvel
  useEffect(() => {
    if (!imovelId) return;
    const i = imoveis.find((x) => x.id === imovelId)?.extra;
    if (i && !valor && i.valor) setValor(String(i.valor));
  }, [imovelId, imoveis]);

  const reset = () => {
    setLeadId(""); setContaId(""); setImovelId("");
    setClienteNome(""); setClienteDocumento(""); setClienteEndereco(""); setClienteEmail(""); setClienteTelefone("");
    setValor(""); setComissao("5"); setPrazoDias("365");
    setDataInicio(new Date().toISOString().slice(0, 10)); setObservacoes("");
  };

  const submit = async (acao: "rascunho" | "gerar") => {
    if (!clienteNome.trim()) return toast.error("Informe o nome do cliente");
    if (!imovelId) return toast.error("Selecione o imóvel");
    if (!valor) return toast.error("Informe o valor");
    if (!template) return toast.error("Nenhum template ativo encontrado");
    if (!user) return toast.error("Sessão expirada");

    setLoading(true);
    try {
      const imovel = imoveis.find((x) => x.id === imovelId)?.extra;
      const imovelEndereco = [imovel?.endereco, imovel?.numero, imovel?.bairro, imovel?.cidade, imovel?.estado]
        .filter(Boolean).join(", ");

      // buscar nome corretor
      const { data: perfil } = await supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle();

      const vars = {
        cliente_nome: clienteNome,
        cliente_documento: clienteDocumento,
        cliente_endereco: clienteEndereco,
        cliente_email: clienteEmail,
        cliente_telefone: clienteTelefone,
        imovel_endereco: imovelEndereco,
        imovel_codigo: imovel?.codigo || "",
        imovel_area: imovel?.area_total ? `${imovel.area_total} m²` : "",
        valor: formatCurrency(Number(valor)),
        comissao_percentual: comissao,
        prazo_dias: prazoDias,
        data_inicio: formatDateBR(dataInicio),
        data_fim: formatDateBR(dataFim),
        corretor_nome: perfil?.nome || "",
        observacoes: observacoes || "—",
        cidade_data: `${imovel?.cidade || ""}${imovel?.cidade ? ", " : ""}${formatDateBR(new Date())}`,
      };

      const conteudo = renderTemplate(template.conteudo, vars);

      let pdfUrl: string | null = null;
      if (acao === "gerar") {
        const blob = generatePdfBlob("CONTRATO DE AUTORIZAÇÃO DE VENDA COM EXCLUSIVIDADE", conteudo);
        const path = `contratos/${user.id}/${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage.from("signed-documents").upload(path, blob, {
          contentType: "application/pdf", upsert: false,
        });
        if (upErr) throw upErr;
        pdfUrl = path;
      }

      const insert: any = {
        tipo: "autorizacao_venda_exclusividade",
        template_id: template.id,
        lead_id: clienteOrigem === "lead" ? leadId || null : null,
        conta_id: clienteOrigem === "conta" ? contaId || null : null,
        imovel_id: imovelId,
        cliente_nome: clienteNome,
        cliente_documento: clienteDocumento || null,
        cliente_endereco: clienteEndereco || null,
        cliente_email: clienteEmail || null,
        cliente_telefone: clienteTelefone || null,
        valor: Number(valor),
        comissao_percentual: Number(comissao),
        prazo_dias: Number(prazoDias),
        data_inicio: dataInicio,
        data_fim: dataFim,
        observacoes: observacoes || null,
        conteudo_renderizado: conteudo,
        pdf_url: pdfUrl,
        status: acao === "gerar" ? "gerado" : "rascunho",
        corretor_id: user.id,
        created_by: user.id,
      };

      const { error } = await (supabase.from("contratos" as any) as any).insert(insert);
      if (error) throw error;

      toast.success(acao === "gerar" ? "Contrato gerado" : "Rascunho salvo");
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao salvar contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo contrato — Autorização de venda com exclusividade</DialogTitle>
          <DialogDescription>Preencha os dados do cliente, do imóvel e gere o contrato.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente é</Label>
              <Select value={clienteOrigem} onValueChange={(v: any) => setClienteOrigem(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conta">Conta</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{clienteOrigem === "lead" ? "Lead" : "Conta"}</Label>
              <Select
                value={clienteOrigem === "lead" ? leadId : contaId}
                onValueChange={(v) => clienteOrigem === "lead" ? setLeadId(v) : setContaId(v)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(clienteOrigem === "lead" ? leads : contas).map((it) => (
                    <SelectItem key={it.id} value={it.id}>{it.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome do cliente *</Label>
              <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={clienteDocumento} onChange={(e) => setClienteDocumento(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Endereço do cliente</Label>
              <Input value={clienteEndereco} onChange={(e) => setClienteEndereco(e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Imóvel *</Label>
            <Select value={imovelId} onValueChange={setImovelId}>
              <SelectTrigger><SelectValue placeholder="Selecione o imóvel..." /></SelectTrigger>
              <SelectContent>
                {imoveis.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label>Valor de venda (R$) *</Label>
              <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <Label>Comissão (%)</Label>
              <Input type="number" step="0.01" value={comissao} onChange={(e) => setComissao(e.target.value)} />
            </div>
            <div>
              <Label>Prazo (dias)</Label>
              <Input type="number" value={prazoDias} onChange={(e) => setPrazoDias(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Data início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Data fim</Label>
              <Input type="date" value={dataFim} readOnly />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => submit("rascunho")}>Salvar rascunho</Button>
          <Button disabled={loading} onClick={() => submit("gerar")}>Gerar contrato (PDF)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
