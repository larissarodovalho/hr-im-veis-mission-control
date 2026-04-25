import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "nome", label: "Nome", required: true },
  { key: "tipo", label: "Tipo (PF/PJ)" },
  { key: "documento", label: "CPF/CNPJ" },
  { key: "email", label: "E-mail" },
  { key: "telefone", label: "Telefone" },
  { key: "endereco", label: "Endereço" },
  { key: "observacoes", label: "Observações" },
];

const NONE = "__none__";

function guessMapping(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const hints: Record<string, string[]> = {
    nome: ["nome", "cliente", "razao social", "razao", "name"],
    tipo: ["tipo", "pf/pj", "pessoa"],
    documento: ["cpf", "cnpj", "documento", "doc"],
    email: ["email", "e-mail", "mail"],
    telefone: ["telefone", "celular", "fone", "whatsapp", "phone"],
    endereco: ["endereco", "address", "logradouro", "rua"],
    observacoes: ["observacoes", "observacao", "obs", "notas", "comentario"],
  };
  for (const f of FIELDS) {
    const h = headers.find((header) => hints[f.key]?.some((hint) => norm(header).includes(hint)));
    if (h) map[f.key] = h;
  }
  return map;
}

export default function ImportarContasDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      if (!json.length) {
        toast.error("Arquivo vazio");
        return;
      }
      const hs = Object.keys(json[0]);
      setHeaders(hs);
      setRows(json);
      setMapping(guessMapping(hs));
      setFileName(file.name);
    } catch (e: any) {
      toast.error("Falha ao ler arquivo: " + e.message);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "Tipo", "CPF/CNPJ", "Email", "Telefone", "Endereço", "Observações"],
      ["João da Silva", "PF", "123.456.789-00", "joao@email.com", "(11) 99999-0000", "Rua A, 123", "Cliente VIP"],
      ["Empresa LTDA", "PJ", "12.345.678/0001-90", "contato@empresa.com", "(11) 3333-0000", "Av. B, 456", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas");
    XLSX.writeFile(wb, "modelo-contas.xlsx");
  };

  const importNow = async () => {
    if (!mapping.nome) return toast.error("Mapeie ao menos a coluna Nome");
    setImporting(true);
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

    // Carrega base atual para dedupe (leads + contas)
    const [{ data: existingContas }, { data: existingLeads }] = await Promise.all([
      supabase.from("contas").select("email,telefone,documento"),
      supabase.from("leads").select("email,telefone"),
    ]);
    const emailSet = new Set<string>();
    const telSet = new Set<string>();
    const docSet = new Set<string>();
    const addExisting = (email?: string | null, telefone?: string | null, documento?: string | null) => {
      if (email) emailSet.add(email.trim().toLowerCase());
      const t = onlyDigits(telefone || "");
      if (t.length >= 8) telSet.add(t.slice(-8));
      const d = onlyDigits(documento || "");
      if (d) docSet.add(d);
    };
    (existingContas ?? []).forEach((r: any) => addExisting(r.email, r.telefone, r.documento));
    (existingLeads ?? []).forEach((r: any) => addExisting(r.email, r.telefone, null));

    let skipped = 0;
    const payload = rows
      .map((r) => {
        const get = (k: string) => {
          const col = mapping[k];
          if (!col || col === NONE) return null;
          const v = r[col];
          return v === "" || v === undefined || v === null ? null : String(v).trim();
        };
        const nome = get("nome");
        if (!nome) return null;
        let tipo = (get("tipo") || "PF").toUpperCase();
        if (!["PF", "PJ"].includes(tipo)) {
          const doc = get("documento") || "";
          tipo = doc.replace(/\D/g, "").length > 11 ? "PJ" : "PF";
        }
        const email = get("email");
        const telefone = get("telefone");
        const documento = get("documento");

        // Verifica duplicidade
        const emailKey = email?.toLowerCase();
        const telKey = onlyDigits(telefone || "").slice(-8);
        const docKey = onlyDigits(documento || "");
        const isDup =
          (emailKey && emailSet.has(emailKey)) ||
          (telKey.length >= 8 && telSet.has(telKey)) ||
          (docKey && docSet.has(docKey));
        if (isDup) {
          skipped++;
          return null;
        }
        // Adiciona aos sets para evitar duplicar dentro do próprio arquivo
        if (emailKey) emailSet.add(emailKey);
        if (telKey.length >= 8) telSet.add(telKey);
        if (docKey) docSet.add(docKey);

        return {
          nome,
          tipo,
          documento,
          email,
          telefone,
          endereco: get("endereco"),
          observacoes: get("observacoes"),
          created_by: userId,
          responsavel_id: userId,
        };
      })
      .filter(Boolean);

    if (!payload.length) {
      setImporting(false);
      if (skipped) return toast.error(`Nenhuma conta nova. ${skipped} duplicada(s) ignorada(s).`);
      return toast.error("Nenhuma linha válida encontrada");
    }

    // batch insert in chunks of 200
    let inserted = 0;
    let failed = 0;
    for (let i = 0; i < payload.length; i += 200) {
      const chunk = payload.slice(i, i + 200);
      const { error, data } = await supabase.from("contas").insert(chunk as any).select("id");
      if (error) {
        failed += chunk.length;
        console.error(error);
      } else {
        inserted += data?.length ?? chunk.length;
      }
    }

    setImporting(false);
    const parts: string[] = [];
    if (inserted) parts.push(`${inserted} importada(s)`);
    if (skipped) parts.push(`${skipped} duplicada(s) ignorada(s)`);
    if (failed) parts.push(`${failed} falha(s)`);
    if (inserted) toast.success(parts.join(" · "));
    else toast.error(parts.join(" · ") || "Falha ao importar");
    reset();
    onOpenChange(false);
    onImported();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Importar contas
          </DialogTitle>
          <DialogDescription>
            Suporta Excel (.xlsx, .xls) e CSV. As colunas serão mapeadas para os campos do CRM.
          </DialogDescription>
        </DialogHeader>

        {!rows.length ? (
          <div className="py-6 space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Clique para selecionar arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls ou .csv</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>
            <Button variant="link" size="sm" className="px-0" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-1" /> Baixar modelo de planilha
            </Button>
          </div>
        ) : (
          <div className="py-2 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{fileName}</span> · {rows.length} linhas
              </span>
              <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mapeamento de colunas</p>
              <div className="grid gap-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="grid grid-cols-2 gap-3 items-center">
                    <Label className="text-sm">
                      {f.label} {f.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={mapping[f.key] || NONE}
                      onValueChange={(v) =>
                        setMapping((p) => ({ ...p, [f.key]: v === NONE ? "" : v }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="— ignorar —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— ignorar —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {mapping.nome && (
              <div className="border border-border rounded-md overflow-hidden">
                <p className="text-xs font-medium px-3 py-2 bg-muted/50">Pré-visualização (3 primeiras)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30">
                      <tr>
                        {FIELDS.filter((f) => mapping[f.key]).map((f) => (
                          <th key={f.key} className="p-2 text-left font-medium">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((r, i) => (
                        <tr key={i} className="border-t">
                          {FIELDS.filter((f) => mapping[f.key]).map((f) => (
                            <td key={f.key} className="p-2 text-muted-foreground">
                              {String(r[mapping[f.key]] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>
          {!!rows.length && (
            <Button onClick={importNow} disabled={importing || !mapping.nome}>
              {importing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
              ) : (
                `Importar ${rows.length} conta(s)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
