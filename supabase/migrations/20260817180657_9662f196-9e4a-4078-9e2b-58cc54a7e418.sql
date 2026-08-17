ALTER TABLE public.imovel_link_eventos DROP CONSTRAINT IF EXISTS imovel_link_eventos_tipo_chk;

ALTER TABLE public.imovel_link_eventos
  ADD CONSTRAINT imovel_link_eventos_tipo_chk CHECK (tipo_evento IN (
    'abertura','visualizacao_imovel','clique_whatsapp','copiar_link','compartilhamento_nativo',
    'gostei','rejeitou','solicitou_informacoes','solicitou_visita','tentativa_apos_expiracao',
    'envio_whatsapp_iniciado','envio_confirmado','copia_link_interno',
    'compartilhamento_nativo_interno','qrcode_gerado','abrir_nova_aba'
  ));

GRANT INSERT ON public.imovel_link_eventos TO authenticated;

DROP POLICY IF EXISTS "Staff insert share eventos" ON public.imovel_link_eventos;
CREATE POLICY "Staff insert share eventos" ON public.imovel_link_eventos
FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff()
  AND tipo_evento IN (
    'envio_whatsapp_iniciado','envio_confirmado','copia_link_interno',
    'compartilhamento_nativo_interno','qrcode_gerado','abrir_nova_aba'
  )
);