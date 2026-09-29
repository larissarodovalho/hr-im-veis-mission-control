DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['contas','tarefas','interacoes','oportunidades','leads','conta_propostas','conta_fechamentos','vendas','oportunidade_visitas','oportunidade_propostas','captacoes_imovel','propostas','carteira_atribuicoes','carteira_lotes','imovel_link_eventos','imovel_links_compartilhados'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
  END IF;
END LOOP; END $$;