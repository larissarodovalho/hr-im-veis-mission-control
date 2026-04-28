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

    let b64 = body.file_base64;
    let mime = body.file_mime || "application/pdf";
    const m = b64.match(/^data:([^;]+);base64,(.*)$/);
    if (m) { mime = m[1]; b64 = m[2]; }
    const contentBase64 = `data:${mime};base64,${b64}`;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Upload do PDF original
    const fileBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
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
    return json({ error: e.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
