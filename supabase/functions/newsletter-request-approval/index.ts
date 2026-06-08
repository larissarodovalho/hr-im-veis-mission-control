// Marca uma campanha como aguardando aprovação e avisa os admins por e-mail.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { campanha_id } = await req.json()
    if (!campanha_id || typeof campanha_id !== 'string') {
      return new Response(JSON.stringify({ error: 'campanha_id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verifica usuário e papel admin/gestor
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id)
    const allowed = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'gestor')
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'permissão negada' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: camp, error: campErr } = await supabase
      .from('newsletter_campanhas').select('*').eq('id', campanha_id).maybeSingle()
    if (campErr || !camp) {
      return new Response(JSON.stringify({ error: 'campanha não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { count: ativos } = await supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    await supabase.from('newsletter_campanhas').update({
      status: 'aguardando_aprovacao',
      total_destinatarios: ativos ?? 0,
    }).eq('id', campanha_id)

    // Busca admins/gestores com e-mail
    const { data: adminRoles } = await supabase
      .from('user_roles').select('user_id').in('role', ['admin', 'gestor'])
    const adminIds = Array.from(new Set((adminRoles ?? []).map((r: any) => r.user_id)))
    if (adminIds.length) {
      const { data: profiles } = await supabase
        .from('profiles').select('user_id,email,nome').in('user_id', adminIds)
      for (const p of profiles ?? []) {
        if (!p.email) continue
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'newsletter-weekly-approval',
            recipientEmail: p.email,
            idempotencyKey: `nl-approval-${campanha_id}-${p.user_id}`,
            // Reaproveita template newsletter-weekly como aviso simples:
            templateData: {
              assunto: `Aprovar campanha: ${camp.assunto}`,
              manchete: 'Nova campanha aguardando aprovação',
              corpo:
                `Olá ${p.nome ?? ''},\n\nUma nova campanha foi enviada para aprovação:\n\n"${camp.assunto}"\n\nDestinatários estimados: ${ativos ?? 0}\n\nAbra o CRM em Newsletter → Campanhas para revisar e aprovar.`,
              imoveis: [],
            },
          },
        }).catch((e) => console.error('aviso admin falhou', p.email, e))
      }
    }

    return new Response(JSON.stringify({ ok: true, total_destinatarios: ativos ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('newsletter-request-approval erro', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
