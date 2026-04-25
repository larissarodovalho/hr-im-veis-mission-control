import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "admin" | "gestor" | "corretor";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    // Verify caller and check admin role
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
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
      const finalRole: Role = role && ["admin", "gestor", "corretor"].includes(role) ? role : "corretor";

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
        await admin.from("user_roles").delete().eq("user_id", newId);
        await admin.from("user_roles").insert({ user_id: newId, role: finalRole });
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
      const { user_id, role } = body as { user_id?: string; role?: Role };
      if (!user_id || !role) return json({ error: "user_id e role obrigatórios" }, 400);
      if (!["admin", "gestor", "corretor"].includes(role)) return json({ error: "Role inválido" }, 400);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      const { error: rErr } = await admin.from("user_roles").insert({ user_id, role });
      if (rErr) return json({ error: rErr.message }, 400);
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
