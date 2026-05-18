import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  renderTemplate, formatCurrency, formatDateBR, formatDateLong,
  generatePdfBlob, valorPorExtenso, numeroPorExtenso, maskDate,
} from "@/lib/contratos";

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
  editing?: any | null;
}

type Item = { id: string; label: string; extra?: any };

const empty = {
  // tipo
  pessoa_juridica: false,
  // PF — contratante 1
  c1_nome: "", c1_sexo: "M", c1_nascimento: "", c1_estado_civil: "", c1_profissao: "",
  c1_rg: "", c1_cpf: "", c1_email: "", c1_telefone: "",
  // contratante 2 opcional
  add_c2: false,
  c2_nome: "", c2_sexo: "M", c2_nascimento: "", c2_estado_civil: "", c2_profissao: "",
  c2_rg: "", c2_cpf: "", c2_email: "", c2_telefone: "",
  // endereço residencial (PF)
  end_logradouro: "", end_numero: "", end_bairro: "", end_cidade: "", end_estado: "", end_cep: "",
  // PJ
  pj_razao_social: "", pj_cnpj: "",
  pj_logradouro: "", pj_numero: "", pj_bairro: "", pj_cidade: "", pj_estado: "", pj_cep: "",
  // sócio representante (PJ)
  socio_nome: "", socio_sexo: "M", socio_nascimento: "", socio_estado_civil: "", socio_profissao: "",
  socio_rg: "", socio_cpf: "", socio_email: "", socio_telefone: "", socio_endereco: "",
  // imóvel
  imovel_lote: "", imovel_quadra: "", imovel_area_total: "", imovel_area_construida: "",
  imovel_matricula: "", imovel_benfeitorias: "",
  imovel_descricao_manual: "",
  // negócio
  valor: "", forma_pagamento: "",
  comissao_percentual: "5",
  prazo_meses: "12",
  protecao_meses: "12",
  cidade_assinatura: "Sinop/MT",
  observacoes: "",
};

// Conjugação por gênero (M/F)
const gen = (sexo: string) => {
  const F = sexo === "F";
  return {
    nacionalidade: F ? "brasileira" : "brasileiro",
    nascido: F ? "nascida" : "nascido",
    portador: F ? "portadora" : "portador",
    inscrito: F ? "inscrita" : "inscrito",
    domiciliado: F ? "domiciliada" : "domiciliado",
  };
};

export default function NovoContratoDialog({ open, onOpenChange, onCreated, editing }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);

  const [leads, setLeads] = useState<Item[]>([]);
  const [contas, setContas] = useState<Item[]>([]);
  const [imoveis, setImoveis] = useState<Item[]>([]);

  const [clienteOrigem, setClienteOrigem] = useState<"lead" | "conta" | "manual">("manual");
  const [leadId, setLeadId] = useState<string>("");
  const [contaId, setContaId] = useState<string>("");
  const [imovelId, setImovelId] = useState<string>("");

  const [f, setF] = useState({ ...empty });
  const set = (patch: Partial<typeof empty>) => setF((s) => ({ ...s, ...patch }));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setF({ ...empty, ...(editing.dados_partes || {}) });
      setLeadId(editing.lead_id || "");
      setContaId(editing.conta_id || "");
      setImovelId(editing.imovel_id || "");
      setClienteOrigem(editing.lead_id ? "lead" : editing.conta_id ? "conta" : "manual");
    } else {
      setF({ ...empty }); setLeadId(""); setContaId(""); setImovelId(""); setClienteOrigem("manual");
    }
    (async () => {
      const [tpl, ld, ct, im] = await Promise.all([
        (supabase.from("contrato_templates" as any) as any)
          .select("id,nome,conteudo").eq("ativo", true).eq("tipo", "autorizacao_venda_exclusividade")
          .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("leads").select("id,nome,telefone,email").order("created_at", { ascending: false }).limit(500),
        supabase.from("contas").select("id,nome,documento,endereco,email,telefone,tipo").order("created_at", { ascending: false }).limit(500),
        supabase.from("imoveis").select("id,codigo,titulo,endereco,numero,complemento,bairro,cidade,estado,cep,valor,area_total,area_construida").order("created_at", { ascending: false }).limit(500),
      ]);
      if (tpl.data) setTemplate(tpl.data);
      if (ld.data) setLeads(ld.data.map((l: any) => ({ id: l.id, label: l.nome, extra: l })));
      if (ct.data) setContas(ct.data.map((c: any) => ({ id: c.id, label: c.nome, extra: c })));
      if (im.data) setImoveis(im.data.map((i: any) => ({ id: i.id, label: `${i.codigo ? i.codigo + " — " : ""}${i.titulo}`, extra: i })));
    })();
  }, [open, editing]);

  // Pré-preenche pelo lead/conta
  useEffect(() => {
    if (clienteOrigem === "lead" && leadId) {
      const l = leads.find((x) => x.id === leadId)?.extra;
      if (l) set({ c1_nome: l.nome || "", c1_email: l.email || "", c1_telefone: l.telefone || "" });
    }
    if (clienteOrigem === "conta" && contaId) {
      const c = contas.find((x) => x.id === contaId)?.extra;
      if (!c) return;
      const isPJ = c.tipo === "PJ";
      if (isPJ) {
        set({
          pessoa_juridica: true, pj_razao_social: c.nome || "", pj_cnpj: c.documento || "",
          socio_email: c.email || "", socio_telefone: c.telefone || "",
        });
      } else {
        set({
          pessoa_juridica: false, c1_nome: c.nome || "", c1_cpf: c.documento || "",
          c1_email: c.email || "", c1_telefone: c.telefone || "",
        });
      }
    }
  }, [clienteOrigem, leadId, contaId, leads, contas]);

  // Pré-preenche imóvel
  useEffect(() => {
    if (!imovelId) return;
    const i = imoveis.find((x) => x.id === imovelId)?.extra;
    if (!i) return;
    set({
      imovel_area_total: i.area_total ? String(i.area_total) : "",
      imovel_area_construida: i.area_construida ? String(i.area_construida) : "",
      valor: !f.valor && i.valor ? String(i.valor) : f.valor,
    });
  }, [imovelId, imoveis]);

  const dataFimDate = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() + Number(f.prazo_meses || 0)); return d;
  }, [f.prazo_meses]);

  const submit = async (acao: "rascunho" | "gerar") => {
    if (!template) return toast.error("Template não carregado");
    if (!user) return toast.error("Sessão expirada");
    if (!f.valor) return toast.error("Informe o valor de venda");
    if (f.pessoa_juridica) {
      if (!f.pj_razao_social || !f.pj_cnpj) return toast.error("Preencha razão social e CNPJ");
      if (!f.socio_nome || !f.socio_cpf) return toast.error("Preencha os dados do sócio representante");
    } else {
      if (!f.c1_nome || !f.c1_cpf) return toast.error("Preencha nome e CPF do contratante");
    }

    setLoading(true);
    try {
      const imovel = imoveis.find((x) => x.id === imovelId)?.extra;
      const imovelEnderecoCadastrado = imovel ? [imovel?.endereco, imovel?.numero, imovel?.complemento, imovel?.bairro,
        imovel?.cidade && imovel?.estado ? `${imovel.cidade}/${imovel.estado}` : (imovel?.cidade || imovel?.estado),
        imovel?.cep ? `CEP ${imovel.cep}` : ""].filter(Boolean).join(", ") : "";
      const imovelEndereco = imovelEnderecoCadastrado || f.imovel_descricao_manual || "";

      const { data: perfil } = await supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle();

      const valorNum = Number(f.valor);
      const prazoNum = Number(f.prazo_meses || 0);
      const protecaoNum = Number(f.protecao_meses || 0);

      const vars: Record<string, any> = {
        ...f,
        c2_nome: f.add_c2 ? f.c2_nome : "",
        c2_nascimento: f.add_c2 ? formatDateBR(f.c2_nascimento) : "",
        c2_estado_civil: f.add_c2 ? f.c2_estado_civil : "",
        c2_profissao: f.add_c2 ? f.c2_profissao : "",
        c2_rg: f.add_c2 ? f.c2_rg : "",
        c2_cpf: f.add_c2 ? f.c2_cpf : "",
        c2_email: f.add_c2 ? f.c2_email : "",
        c2_telefone: f.add_c2 ? f.c2_telefone : "",
        c1_nascimento: formatDateBR(f.c1_nascimento),
        socio_nascimento: formatDateBR(f.socio_nascimento),
        imovel_endereco: imovelEndereco,
        imovel_lote: f.imovel_lote || "—",
        imovel_quadra: f.imovel_quadra || "—",
        imovel_area_total: f.imovel_area_total ? `${f.imovel_area_total} m²` : "—",
        imovel_area_construida: f.imovel_area_construida ? `${f.imovel_area_construida} m²` : "—",
        imovel_matricula: f.imovel_matricula || "—",
        imovel_benfeitorias: f.imovel_benfeitorias || "—",
        valor: formatCurrency(valorNum),
        valor_numero: valorNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        valor_extenso: valorPorExtenso(valorNum),
        comissao_percentual: f.comissao_percentual,
        comissao_extenso: `${numeroPorExtenso(Number(f.comissao_percentual))} por cento`,
        forma_pagamento: f.forma_pagamento || "à vista no ato da assinatura do compromisso de compra e venda",
        prazo_meses: String(prazoNum),
        prazo_meses_extenso: numeroPorExtenso(prazoNum),
        protecao_meses: String(protecaoNum),
        protecao_meses_extenso: numeroPorExtenso(protecaoNum),
        cidade_assinatura: f.cidade_assinatura,
        data_assinatura: formatDateLong(new Date()),
        corretor_nome: perfil?.nome || "",
      };

      // Conjugações por gênero
      const g1 = gen(f.c1_sexo);
      const g2 = gen(f.c2_sexo);
      const gs = gen(f.socio_sexo);
      vars.c1_nacionalidade = g1.nacionalidade;
      vars.c1_nascido = g1.nascido;
      vars.c1_portador = g1.portador;
      vars.c1_inscrito = g1.inscrito;
      vars.c1_domiciliado = g1.domiciliado;
      vars.c2_nacionalidade = g2.nacionalidade;
      vars.c2_nascido = g2.nascido;
      vars.c2_portador = g2.portador;
      vars.c2_inscrito = g2.inscrito;
      vars.c2_domiciliado = g2.domiciliado;
      vars.socio_nacionalidade = gs.nacionalidade;
      vars.socio_nascido = gs.nascido;
      vars.socio_portador = gs.portador;
      vars.socio_inscrito = gs.inscrito;
      vars.socio_domiciliado = gs.domiciliado;

      // Cláusula final "residente/domiciliado" (pluralização e gênero)
      const hasC2 = f.add_c2 && !!f.c2_nome;
      if (hasC2) {
        const ambasF = f.c1_sexo === "F" && f.c2_sexo === "F";
        vars.residentes_prefixo = ambasF ? "ambas " : "ambos ";
        vars.residente_palavra = "residentes";
        vars.domiciliado_palavra = ambasF ? "domiciliadas" : "domiciliados";
      } else {
        vars.residentes_prefixo = "";
        vars.residente_palavra = "residente";
        vars.domiciliado_palavra = g1.domiciliado;
      }

      const conteudo = renderTemplate(template.conteudo, vars);

      let pdfUrl: string | null = null;
      if (acao === "gerar") {
        const blob = generatePdfBlob("CONTRATO DE INTERMEDIAÇÃO IMOBILIÁRIA COM CLÁUSULA DE EXCLUSIVIDADE", conteudo);
        const path = `contratos/${user.id}/${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage.from("signed-documents").upload(path, blob, {
          contentType: "application/pdf", upsert: false,
        });
        if (upErr) throw upErr;
        pdfUrl = path;
      }

      const clienteNome = f.pessoa_juridica ? f.pj_razao_social : f.c1_nome;
      const clienteCpfCnpj = f.pessoa_juridica ? f.pj_cnpj : f.c1_cpf;
      const clienteEmail = f.pessoa_juridica ? f.socio_email : f.c1_email;
      const clienteTelefone = f.pessoa_juridica ? f.socio_telefone : f.c1_telefone;

      const dataInicio = new Date().toISOString().slice(0, 10);
      const dataFim = dataFimDate.toISOString().slice(0, 10);

      const insert: any = {
        tipo: "autorizacao_venda_exclusividade",
        template_id: template.id,
        lead_id: clienteOrigem === "lead" ? leadId || null : null,
        conta_id: clienteOrigem === "conta" ? contaId || null : null,
        imovel_id: imovelId || null,
        cliente_nome: clienteNome,
        cliente_documento: clienteCpfCnpj || null,
        cliente_email: clienteEmail || null,
        cliente_telefone: clienteTelefone || null,
        valor: valorNum,
        comissao_percentual: Number(f.comissao_percentual),
        prazo_dias: prazoNum * 30,
        data_inicio: dataInicio,
        data_fim: dataFim,
        observacoes: f.observacoes || null,
        conteudo_renderizado: conteudo,
        pdf_url: pdfUrl,
        status: acao === "gerar" ? "gerado" : "rascunho",
        corretor_id: user.id,
        created_by: user.id,
        dados_partes: f,
      };

      let error: any = null;
      if (editing?.id) {
        const upd = { ...insert };
        delete upd.created_by;
        // mantém pdf_url antigo se não regerou
        if (acao !== "gerar") delete upd.pdf_url;
        const r = await (supabase.from("contratos" as any) as any).update(upd).eq("id", editing.id);
        error = r.error;
      } else {
        const r = await (supabase.from("contratos" as any) as any).insert(insert);
        error = r.error;
      }
      if (error) throw error;

      toast.success(editing ? "Contrato atualizado" : (acao === "gerar" ? "Contrato gerado" : "Rascunho salvo"));
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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo contrato — Intermediação com exclusividade</DialogTitle>
          <DialogDescription>Preencha os dados das partes, do imóvel e do negócio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo + vínculo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo de contratante</Label>
              <Select
                value={f.pessoa_juridica ? "pj" : "pf"}
                onValueChange={(v) => set({ pessoa_juridica: v === "pj" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pf">Pessoa Física</SelectItem>
                  <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pré-preencher de</Label>
              <Select value={clienteOrigem} onValueChange={(v: any) => setClienteOrigem(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Preenchimento manual</SelectItem>
                  <SelectItem value="conta">Conta cadastrada</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {clienteOrigem !== "manual" && (
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
            )}
          </div>

          <Accordion type="multiple" defaultValue={["contratante", "imovel", "negocio"]} className="w-full">
            {/* CONTRATANTE */}
            <AccordionItem value="contratante">
              <AccordionTrigger>Dados do contratante</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {f.pessoa_juridica ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Razão social *" value={f.pj_razao_social} onChange={(v: string) => set({ pj_razao_social: v })} />
                      <Field label="CNPJ *" value={f.pj_cnpj} onChange={(v: string) => set({ pj_cnpj: v })} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Sede da empresa</p>
                    <div className="grid grid-cols-6 gap-3">
                      <Field className="col-span-4" label="Logradouro" value={f.pj_logradouro} onChange={(v: string) => set({ pj_logradouro: v })} />
                      <Field className="col-span-2" label="Número" value={f.pj_numero} onChange={(v: string) => set({ pj_numero: v })} />
                      <Field className="col-span-2" label="Bairro" value={f.pj_bairro} onChange={(v: string) => set({ pj_bairro: v })} />
                      <Field className="col-span-2" label="Cidade" value={f.pj_cidade} onChange={(v: string) => set({ pj_cidade: v })} />
                      <Field label="UF" value={f.pj_estado} onChange={(v: string) => set({ pj_estado: v })} />
                      <Field label="CEP" value={f.pj_cep} onChange={(v: string) => set({ pj_cep: v })} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Sócio(a) representante</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nome completo *" value={f.socio_nome} onChange={(v: string) => set({ socio_nome: v })} />
                      <Field label="CPF *" value={f.socio_cpf} onChange={(v: string) => set({ socio_cpf: v })} />
                      <div>
                        <Label>Sexo</Label>
                        <Select value={f.socio_sexo} onValueChange={(v) => set({ socio_sexo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Field label="Data de nascimento" placeholder="DD/MM/AAAA" value={f.socio_nascimento} onChange={(v: string) => set({ socio_nascimento: maskDate(v) })} />
                      <Field label="RG" value={f.socio_rg} onChange={(v: string) => set({ socio_rg: v })} />
                      <Field label="Estado civil" value={f.socio_estado_civil} onChange={(v: string) => set({ socio_estado_civil: v })} />
                      <Field label="Profissão" value={f.socio_profissao} onChange={(v: string) => set({ socio_profissao: v })} />
                      <Field label="E-mail" value={f.socio_email} onChange={(v: string) => set({ socio_email: v })} />
                      <Field label="Telefone" value={f.socio_telefone} onChange={(v: string) => set({ socio_telefone: v })} />
                      <Field className="col-span-2" label="Endereço residencial completo" value={f.socio_endereco} onChange={(v: string) => set({ socio_endereco: v })} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Contratante</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nome completo *" value={f.c1_nome} onChange={(v: string) => set({ c1_nome: v })} />
                      <Field label="CPF *" value={f.c1_cpf} onChange={(v: string) => set({ c1_cpf: v })} />
                      <div>
                        <Label>Sexo</Label>
                        <Select value={f.c1_sexo} onValueChange={(v) => set({ c1_sexo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Field label="Data de nascimento" placeholder="DD/MM/AAAA" value={f.c1_nascimento} onChange={(v: string) => set({ c1_nascimento: maskDate(v) })} />
                      <Field label="RG" value={f.c1_rg} onChange={(v: string) => set({ c1_rg: v })} />
                      <Field label="Estado civil" value={f.c1_estado_civil} onChange={(v: string) => set({ c1_estado_civil: v })} />
                      <Field label="Profissão" value={f.c1_profissao} onChange={(v: string) => set({ c1_profissao: v })} />
                      <Field label="E-mail" value={f.c1_email} onChange={(v: string) => set({ c1_email: v })} />
                      <Field label="Telefone" value={f.c1_telefone} onChange={(v: string) => set({ c1_telefone: v })} />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Switch checked={f.add_c2} onCheckedChange={(v) => set({ add_c2: v })} id="add-c2" />
                      <Label htmlFor="add-c2">Adicionar segundo contratante (cônjuge / coproprietário)</Label>
                    </div>
                    {f.add_c2 && (
                      <div className="grid grid-cols-2 gap-3 border-l-2 pl-3">
                        <Field label="Nome completo" value={f.c2_nome} onChange={(v: string) => set({ c2_nome: v })} />
                        <Field label="CPF" value={f.c2_cpf} onChange={(v: string) => set({ c2_cpf: v })} />
                        <div>
                          <Label>Sexo</Label>
                          <Select value={f.c2_sexo} onValueChange={(v) => set({ c2_sexo: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Field label="Data de nascimento" placeholder="DD/MM/AAAA" value={f.c2_nascimento} onChange={(v: string) => set({ c2_nascimento: maskDate(v) })} />
                        <Field label="RG" value={f.c2_rg} onChange={(v: string) => set({ c2_rg: v })} />
                        <Field label="Estado civil" value={f.c2_estado_civil} onChange={(v: string) => set({ c2_estado_civil: v })} />
                        <Field label="Profissão" value={f.c2_profissao} onChange={(v: string) => set({ c2_profissao: v })} />
                        <Field label="E-mail" value={f.c2_email} onChange={(v: string) => set({ c2_email: v })} />
                        <Field label="Telefone" value={f.c2_telefone} onChange={(v: string) => set({ c2_telefone: v })} />
                      </div>
                    )}

                    <p className="text-sm font-medium text-muted-foreground pt-2">Endereço residencial</p>
                    <div className="grid grid-cols-6 gap-3">
                      <Field className="col-span-4" label="Logradouro" value={f.end_logradouro} onChange={(v: string) => set({ end_logradouro: v })} />
                      <Field className="col-span-2" label="Número" value={f.end_numero} onChange={(v: string) => set({ end_numero: v })} />
                      <Field className="col-span-2" label="Bairro" value={f.end_bairro} onChange={(v: string) => set({ end_bairro: v })} />
                      <Field className="col-span-2" label="Cidade" value={f.end_cidade} onChange={(v: string) => set({ end_cidade: v })} />
                      <Field label="UF" value={f.end_estado} onChange={(v: string) => set({ end_estado: v })} />
                      <Field label="CEP" value={f.end_cep} onChange={(v: string) => set({ end_cep: v })} />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* IMÓVEL */}
            <AccordionItem value="imovel">
              <AccordionTrigger>Imóvel</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <Label>Imóvel cadastrado</Label>
                  <Select value={imovelId || "__none__"} onValueChange={(v) => setImovelId(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o imóvel (opcional)..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Nenhum (preencher manualmente) —</SelectItem>
                      {imoveis.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!imovelId && (
                  <div>
                    <Label>Descrição manual do imóvel</Label>
                    <Textarea
                      rows={3}
                      placeholder="Endereço completo, características e identificação do imóvel..."
                      value={f.imovel_descricao_manual}
                      onChange={(e) => set({ imovel_descricao_manual: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-3">
                  <Field label="Lote" value={f.imovel_lote} onChange={(v: string) => set({ imovel_lote: v })} />
                  <Field label="Quadra" value={f.imovel_quadra} onChange={(v: string) => set({ imovel_quadra: v })} />
                  <Field label="Área total (m²)" type="number" value={f.imovel_area_total} onChange={(v: string) => set({ imovel_area_total: v })} />
                  <Field label="Área construída (m²)" type="number" value={f.imovel_area_construida} onChange={(v: string) => set({ imovel_area_construida: v })} />
                  <Field className="col-span-2" label="Matrícula nº" value={f.imovel_matricula} onChange={(v: string) => set({ imovel_matricula: v })} />
                  <div className="col-span-4">
                    <Label>Benfeitorias</Label>
                    <Textarea rows={2} value={f.imovel_benfeitorias} onChange={(e) => set({ imovel_benfeitorias: e.target.value })} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* NEGÓCIO */}
            <AccordionItem value="negocio">
              <AccordionTrigger>Negócio</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Label>Valor de venda (R$) *</Label>
                    <Input type="number" step="0.01" value={f.valor} onChange={(e) => set({ valor: e.target.value })} />
                    {f.valor && <p className="text-xs text-muted-foreground mt-1">{valorPorExtenso(Number(f.valor))}</p>}
                  </div>
                  <Field label="Comissão (%)" type="number" value={f.comissao_percentual} onChange={(v: string) => set({ comissao_percentual: v })} />
                  <Field label="Prazo exclusividade (meses)" type="number" value={f.prazo_meses} onChange={(v: string) => set({ prazo_meses: v })} />
                  <Field label="Proteção pós-contratual (meses)" type="number" value={f.protecao_meses} onChange={(v: string) => set({ protecao_meses: v })} />
                  <Field className="col-span-3" label="Cidade/UF da assinatura" value={f.cidade_assinatura} onChange={(v: string) => set({ cidade_assinatura: v })} />
                </div>
                <div>
                  <Label>Forma de pagamento da comissão</Label>
                  <Textarea rows={2} placeholder="Ex: à vista no ato da assinatura do compromisso de compra e venda"
                    value={f.forma_pagamento} onChange={(e) => set({ forma_pagamento: e.target.value })} />
                </div>
                <div>
                  <Label>Observações internas</Label>
                  <Textarea rows={2} value={f.observacoes} onChange={(e) => set({ observacoes: e.target.value })} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => submit("rascunho")}>Salvar rascunho</Button>
          <Button disabled={loading} onClick={() => submit("gerar")}>Gerar contrato (PDF)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
