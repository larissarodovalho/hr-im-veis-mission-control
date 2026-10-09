import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { clicksignFetch } from "../_shared/clicksign.ts";

interface SignerInput {
  name: string;
  email: string;
  cpf?: string;
  role?: string;
}

interface Body {
  name: string;
  file_base64: string;
  file_mime?: string;
  signers: SignerInput[];
  message?: string;
  deadline_at?: string | null;
  lead_id?: string | null;
  conta_id?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);
    const token = auth.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Não autorizado" }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json() as Body;
    if (!body?.name || !body?.file_base64 || !Array.isArray(body.signers) || body.signers.length === 0) {
      return json({ error: "Dados inválidos: name, file_base64 e ao menos 1 signatário são obrigatórios" }, 400);
    }

    // Clicksign exige nome + sobrenome (ao menos 2 palavras com 2+ letras cada)
    for (const s of body.signers) {
      const parts = (s.name || "").trim().split(/\s+/).filter((p) => p.length >= 2);
      if (parts.length < 2) {
        return json({
          error: `Signatário "${s.name || s.email}" precisa ter nome e sobrenome (ex: "João Silva").`,
        }, 400);
      }
    }

    // Apenas equipe interna pode enviar documentos para assinatura
    const { data: isStaff } = await userClient.rpc("is_staff");
    if (!isStaff) return json({ error: "Sem permissão para enviar documentos" }, 403);

    // Signatários: e-mails válidos e quantidade limitada
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.signers.length > 10) return json({ error: "Máximo de 10 signatários por documento" }, 400);
    for (const s of body.signers) {
      if (typeof s.email !== "string" || !EMAIL_RE.test(s.email.trim()) || s.email.length > 254) {
        return json({ error: `E-mail inválido para o signatário "${s.name}".` }, 400);
      }
    }

    // A conta/lead vinculada precisa estar acessível para quem envia
    if (body.lead_id) {
      const { data: lead } = await userClient.from("leads").select("id").eq("id", body.lead_id).maybeSingle();
      if (!lead) return json({ error: "Lead não encontrado ou sem acesso" }, 403);
    }
    if (body.conta_id) {
      const { data: conta } = await userClient.from("contas").select("id").eq("id", body.conta_id).maybeSingle();
      if (!conta) return json({ error: "Conta não encontrada ou sem acesso" }, 403);
    }

    let b64 = String(body.file_base64);
    const m = b64.match(/^data:([^;]+);base64,(.*)$/);
    if (m) b64 = m[2];
    // Somente PDF, até 15 MB
    const MAX_BYTES = 15 * 1024 * 1024;
    if (b64.length > Math.ceil(MAX_BYTES / 3) * 4 + 4) return json({ error: "Arquivo maior que 15 MB" }, 400);
    const mime = "application/pdf";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Upload do PDF original
    let fileBytes: Uint8Array;
    try { fileBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }
    catch { return json({ error: "Arquivo inválido" }, 400); }
    // Assinatura de PDF: "%PDF-"
    if (fileBytes.length < 5 || String.fromCharCode(...fileBytes.slice(0, 5)) !== "%PDF-") {
      return json({ error: "Envie um arquivo PDF" }, 400);
    }
    const contentBase64 = `data:${mime};base64,${b64}`;
    const docId = crypto.randomUUID();
    const originalPath = `${userId}/${docId}/original.pdf`;
    const upload = await admin.storage.from("signed-documents").upload(originalPath, fileBytes, {
      contentType: mime, upsert: false,
    });
    if (upload.error) throw new Error(`Upload falhou: ${upload.error.message}`);

    // 2) Cria documento na Clicksign
    const filename = body.name.endsWith(".pdf") ? body.name : `${body.name}.pdf`;
    const ckDoc = await clicksignFetch("/documents", {
      method: "POST",
      body: JSON.stringify({
        document: {
          path: `/${filename}`,
          content_base64: contentBase64,
          deadline_at: body.deadline_at || undefined,
          auto_close: true,
          locale: "pt-BR",
        },
      }),
    });
    const docKey = ckDoc?.document?.key as string;
    if (!docKey) throw new Error("Clicksign não retornou document key");

    // 3) Insere o documento no DB
    const { data: insertedDoc, error: insErr } = await admin
      .from("signed_documents")
      .insert({
        id: docId,
        name: body.name,
        file_url: originalPath,
        status: "sent",
        clicksign_document_key: docKey,
        lead_id: body.lead_id || null,
        conta_id: body.conta_id || null,
        created_by: userId,
        message: body.message || null,
        deadline_at: body.deadline_at || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insErr) throw new Error(`DB insert: ${insErr.message}`);

    // 4) Cria signers + lists + notificações
    const createdSigners: any[] = [];
    for (const s of body.signers) {
      const ckSigner = await clicksignFetch("/signers", {
        method: "POST",
        body: JSON.stringify({
          signer: {
            email: s.email,
            name: s.name,
            documentation: (s.cpf || "").replace(/\D/g, "") || undefined,
            auths: ["email"],
            communicate_by: "email",
            has_documentation: !!s.cpf,
          },
        }),
      });
      const signerKey = ckSigner?.signer?.key as string;

      const list = await clicksignFetch("/lists", {
        method: "POST",
        body: JSON.stringify({
          list: {
            document_key: docKey,
            signer_key: signerKey,
            sign_as: s.role === "testemunha" ? "witness" : "party",
            message: body.message || undefined,
          },
        }),
      });

      try {
        await clicksignFetch(`/notifications`, {
          method: "POST",
          body: JSON.stringify({ request_signature_key: list?.list?.request_signature_key }),
        });
      } catch (_) { /* ignore */ }

      const signUrl = list?.list?.request_signature_key
        ? `https://${Deno.env.get("CLICKSIGN_ENV") === "production" ? "app" : "sandbox"}.clicksign.com/sign/${list.list.request_signature_key}`
        : null;

      const { data: dbSigner } = await admin.from("document_signers").insert({
        document_id: docId,
        name: s.name,
        email: s.email,
        cpf: s.cpf || null,
        role: s.role || "parte",
        clicksign_signer_key: signerKey,
        sign_url: signUrl,
        status: "pending",
      }).select().single();
      createdSigners.push(dbSigner);
    }

    await admin.from("document_events").insert({
      document_id: docId,
      event_type: "document_sent",
      event_data: { signers_count: createdSigners.length },
    });

    return json({ ok: true, document: insertedDoc, signers: createdSigners });
  } catch (e: any) {
    console.error("clicksign-create-document error:", e);
    console.error("clicksign-create-document error:", e);
    return json({ error: "Não foi possível concluir a operação. Tente novamente." }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
