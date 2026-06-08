// Envia um e-mail de teste do template newsletter-weekly para um destinatário,
// com 3 imóveis disponíveis do catálogo e conteúdo de exemplo. Apenas admin/gestor.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { email } = await req.json().catch(() => ({}))
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'email obrigatório' }), {
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

    // Pega até 3 imóveis disponíveis com foto
    const { data: imoveis } = await supabase
      .from('imoveis')
      .select('id,titulo,cidade,bairro,valor,fotos,codigo,quartos,vagas,area_util,status')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false })
      .limit(12)

    const imoveisData = (imoveis ?? [])
      .filter((im: any) => Array.isArray(im.fotos) && im.fotos.length)
      .slice(0, 3)
      .map((im: any) => ({
        id: im.id,
        titulo: im.titulo,
        cidade: im.cidade,
        bairro: im.bairro,
        valor: im.valor,
        foto: im.fotos[0],
        codigo: im.codigo,
        quartos: im.quartos,
        vagas: im.vagas,
        area_util: im.area_util,
      }))

    const apiKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
      || Deno.env.get('SUPABASE_ANON_KEY')
      || ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        apikey: apiKey,
      },
      body: JSON.stringify({
        templateName: 'newsletter-weekly',
        recipientEmail: email,
        idempotencyKey: `newsletter-test-${Date.now()}-${email}`,
        templateData: {
          assunto: 'Novidades do mercado imobiliário — Sinop',
          manchete: 'O que está movimentando o mercado esta semana',
          corpo:
            'Este é um e-mail de teste do informativo HR Imóveis. O mercado de Sinop segue aquecido, com boa procura por imóveis prontos para morar nas regiões centrais e bairros planejados.\n\nSelecionamos abaixo alguns destaques do nosso catálogo para você conferir o visual completo do e-mail.',
          imoveis: imoveisData,
        },
      }),
    })

    if (!sendRes.ok) {
      const body = await sendRes.text()
      console.error('send-transactional-email http', sendRes.status, body)
      return new Response(JSON.stringify({ error: `send falhou: ${sendRes.status} ${body}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }


    return new Response(JSON.stringify({ ok: true, email, imoveis: imoveisData.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('newsletter-send-test erro', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
