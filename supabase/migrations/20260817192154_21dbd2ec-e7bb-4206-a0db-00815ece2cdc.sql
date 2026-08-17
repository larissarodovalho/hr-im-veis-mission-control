DELETE FROM public.tarefas WHERE titulo LIKE '%link HR-QA17%';
DELETE FROM public.notificacoes WHERE titulo LIKE '%HR-QA17%'
  OR link_id IN (SELECT id FROM public.imovel_links_compartilhados WHERE codigo_referencia = 'HR-QA17');
DELETE FROM public.imovel_links_compartilhados WHERE codigo_referencia = 'HR-QA17';