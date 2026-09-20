DO $migration$
DECLARE
  function_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname='acompanhamento_apurar_diario'
    AND pg_get_function_identity_arguments(p.oid)='_inicio timestamp with time zone, _fim timestamp with time zone, _prazo_dias integer, _origens_carteira text[]';

  function_definition := replace(
    function_definition,
    'WHERE c.exigivel AND EXISTS (SELECT 1 FROM public.user_roles ur',
    'WHERE c.exigivel AND c.historico_determinavel AND EXISTS (SELECT 1 FROM public.user_roles ur'
  );

  EXECUTE function_definition;
END;
$migration$;