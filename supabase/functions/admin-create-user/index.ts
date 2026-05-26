import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "gestor" | "corretor" | "marketing" | "secretaria";
type UiRole = Role | "gestor_corretor";

const VALID_UI_ROLES: UiRole[] = ["admin", "gestor", "corretor", "gestor_corretor", "marketing", "secretaria"];

async function applyRoles(admin: ReturnType<typeof createClient>, userId: string, role: UiRole) {
  await admin.from("user_roles").delete().eq("user_id", userId);
  const rows = role === "gestor_corretor"
    ? [{ user_id: userId, role: "gestor" }, { user_id: userId, role: "corretor" }]
    : [{ user_id: userId, role }];
  const { error } = await admin.from("user_roles").insert(rows);
  if (error) throw new Error(error.message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    // Verify caller using service role (works with new asymmetric signing keys)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) {
      console.error("getUser failed:", userErr?.message);
      return json({ error: "Unauthorized", detail: userErr?.message }, 401);
    }
    const callerId = userData.user.id;
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "create";

    if (action === "create") {
      const { email, password, nome, telefone, cargo, role } = body as {
        email?: string; password?: string; nome?: string;
        telefone?: string; cargo?: string; role?: Role;
      };
      if (!email || !password || !nome) return json({ error: "email, password, nome obrigatórios" }, 400);
      if (password.length < 8) return json({ error: "Senha mínima 8 caracteres" }, 400);
      const finalRole: UiRole = role && VALID_UI_ROLES.includes(role as UiRole) ? (role as UiRole) : "corretor";

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      });
      if (cErr || !created.user) return json({ error: cErr?.message ?? "Falha ao criar usuário" }, 400);
      const newId = created.user.id;

      // Trigger handle_new_user already inserts profile + 'corretor' role.
      await admin.from("profiles").update({ nome, telefone, cargo }).eq("user_id", newId);

      if (finalRole !== "corretor") {
        try { await applyRoles(admin, newId, finalRole); }
        catch (e) { return json({ error: (e as Error).message }, 400); }
      }

      // Envia e-mail de boas-vindas com senha temporária (best-effort)
      const origin = req.headers.get("origin") ?? "https://www.hrimoveis.com";
      const loginUrl = `${origin.replace(/\/$/, "")}/app`;
      try {
        console.log("Enviando e-mail de boas-vindas para", email);
        const mailRes = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE}`,
            apikey: SERVICE_ROLE,
          },
          body: JSON.stringify({
            templateName: "user-welcome",
            recipientEmail: email,
            idempotencyKey: `user-welcome-${newId}`,
            purpose: "transactional",
            templateData: { nome, email, senha: password, loginUrl },
          }),
        });
        const mailText = await mailRes.text();
        console.log("send-transactional-email status:", mailRes.status, mailText);
      } catch (mailErr) {
        console.error("Falha ao enviar e-mail de boas-vindas:", mailErr);
      }

      return json({ ok: true, user_id: newId });
    }

    if (action === "delete") {
      const { user_id } = body as { user_id?: string };
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);
      if (user_id === callerId) return json({ error: "Você não pode remover a si mesmo" }, 400);
      const { error: dErr } = await admin.auth.admin.deleteUser(user_id);
      if (dErr) return json({ error: dErr.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_role") {
      const { user_id, role } = body as { user_id?: string; role?: UiRole };
      if (!user_id || !role) return json({ error: "user_id e role obrigatórios" }, 400);
      if (!VALID_UI_ROLES.includes(role)) return json({ error: "Role inválido" }, 400);
      try { await applyRoles(admin, user_id, role); }
      catch (e) { return json({ error: (e as Error).message }, 400); }
      return json({ ok: true });
    }

    if (action === "update_profile") {
      const { user_id, nome, email, telefone, cargo, role } = body as {
        user_id?: string; nome?: string; email?: string;
        telefone?: string; cargo?: string; role?: UiRole;
      };
      if (!user_id) return json({ error: "user_id obrigatório" }, 400);

      if (email) {
        const { error: eErr } = await admin.auth.admin.updateUserById(user_id, { email });
        if (eErr) return json({ error: eErr.message }, 400);
      }

      const profileUpdate: Record<string, unknown> = {};
      if (nome !== undefined) profileUpdate.nome = nome;
      if (email !== undefined) profileUpdate.email = email;
      if (telefone !== undefined) profileUpdate.telefone = telefone;
      if (cargo !== undefined) profileUpdate.cargo = cargo;
      if (Object.keys(profileUpdate).length > 0) {
        const { error: pErr } = await admin.from("profiles").update(profileUpdate).eq("user_id", user_id);
        if (pErr) return json({ error: pErr.message }, 400);
      }

      if (role && VALID_UI_ROLES.includes(role)) {
        if (user_id === callerId && role !== "admin") {
          return json({ error: "Você não pode remover seu próprio papel de admin" }, 400);
        }
        try { await applyRoles(admin, user_id, role); }
        catch (e) { return json({ error: (e as Error).message }, 400); }
      }

      return json({ ok: true });
    }

    if (action === "reset_password") {
      const { user_id, password } = body as { user_id?: string; password?: string };
      if (!user_id || !password) return json({ error: "user_id e password obrigatórios" }, 400);
      if (password.length < 8) return json({ error: "Senha mínima 8 caracteres" }, 400);
      const { error: pErr } = await admin.auth.admin.updateUserById(user_id, { password });
      if (pErr) return json({ error: pErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
