REVOKE EXECUTE ON FUNCTION public.carteira_editar_lote(uuid, uuid, integer, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_excluir_lote(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_cancelar_lote(uuid, text) FROM anon;