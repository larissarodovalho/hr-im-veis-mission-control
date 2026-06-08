// Aprova e dispara o envio da campanha de newsletter para todos os inscritos ativos.
// Cria uma linha em newsletter_envios por destinatário e enfileira o e-mail individual
// no send-transactional-email (idempotente por campanha+email).
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

    // Carrega campanha
    const { data: camp, error: campErr } = await supabase
      .from('newsletter_campanhas').select('*').eq('id', campanha_id).maybeSingle()
    if (campErr || !camp) {
      return new Response(JSON.stringify({ error: 'campanha não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!['aguardando_aprovacao', 'aprovada', 'rascunho'].includes(camp.status)) {
      return new Response(JSON.stringify({ error: `status inválido: ${camp.status}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Carrega imóveis selecionados (em ordem)
    const ids: string[] = camp.imoveis_ids ?? []
    let imoveisData: any[] = []
    if (ids.length) {
      const { data } = await supabase
        .from('imoveis')
        .select('id,titulo,cidade,bairro,valor,fotos,codigo,quartos,vagas,area_util')
        .in('id', ids)
      const map = new Map((data ?? []).map((d: any) => [d.id, d]))
      imoveisData = ids.map((id) => map.get(id)).filter(Boolean).map((im: any) => ({
        id: im.id,
        titulo: im.titulo,
        cidade: im.cidade,
        bairro: im.bairro,
        valor: im.valor,
        foto: Array.isArray(im.fotos) && im.fotos.length ? im.fotos[0] : null,
        codigo: im.codigo,
        quartos: im.quartos,
        vagas: im.vagas,
        area_util: im.area_util,
      }))
    }

    // Marca aprovada/enviando
    await supabase.from('newsletter_campanhas').update({
      status: 'enviando',
      aprovada_por: user.id,
      aprovada_em: new Date().toISOString(),
    }).eq('id', campanha_id)

    // Inscritos ativos não suprimidos
    const { data: subs } = await supabase
      .from('newsletter_subscribers')
      .select('id,email,nome')
      .eq('status', 'active')

    const { data: suppressedRows } = await supabase
      .from('suppressed_emails')
      .select('email')
    const suppressed = new Set((suppressedRows ?? []).map((s: any) => String(s.email).toLowerCase()))

    let enviados = 0
    let falhas = 0
    let suprimidos = 0

    for (const s of subs ?? []) {
      const emailLower = String(s.email).toLowerCase()
      const isSupp = suppressed.has(emailLower)

      // Cria/atualiza envio (único por campanha_id+email)
      const { error: insErr } = await supabase.from('newsletter_envios').upsert({
        campanha_id,
        subscriber_id: s.id,
        email: s.email,
        status: isSupp ? 'suppressed' : 'pending',
      }, { onConflict: 'campanha_id,email' })

      if (insErr) {
        console.error('upsert envio falhou', insErr, s.email)
        falhas++
        continue
      }
      if (isSupp) { suprimidos++; continue }

      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'newsletter-weekly',
          recipientEmail: s.email,
          idempotencyKey: `newsletter-${campanha_id}-${s.id}`,
          templateData: {
            assunto: camp.assunto,
            manchete: camp.manchete ?? '',
            corpo: camp.corpo ?? '',
            imoveis: imoveisData,
          },
        },
      })

      if (sendErr) {
        falhas++
        await supabase.from('newsletter_envios').update({
          status: 'failed', error_message: sendErr.message,
        }).eq('campanha_id', campanha_id).eq('email', s.email)
      } else {
        enviados++
        await supabase.from('newsletter_envios').update({
          status: 'sent', sent_at: new Date().toISOString(),
        }).eq('campanha_id', campanha_id).eq('email', s.email)
      }
    }

    await supabase.from('newsletter_campanhas').update({
      status: 'enviada',
      enviada_em: new Date().toISOString(),
      total_enviados: enviados,
      total_falhas: falhas,
    }).eq('id', campanha_id)

    return new Response(JSON.stringify({ ok: true, enviados, falhas, suprimidos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('newsletter-send-campaign erro', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
