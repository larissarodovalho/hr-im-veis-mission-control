-- 1. Contas de Captação/Imóvel sem categoria viram Carteira (ficam visíveis no Kanban)
UPDATE public.contas
SET categoria = 'carteira'
WHERE etapa_funil = 'captacao_imovel' AND categoria IS NULL;

-- 2. "Oportunidade futura" (perdido legado) → Contato estabelecido com selo correspondente
UPDATE public.contas
SET etapa_funil = 'contato_estabelecido', qualificacao_status = 'oportunidade_futura'
WHERE etapa_funil = 'perdido';

-- 3. Demais etapas legadas → Contato estabelecido com qualificação pendente
UPDATE public.contas
SET etapa_funil = 'contato_estabelecido', qualificacao_status = 'pendente'
WHERE etapa_funil IN ('captacao_imovel','reuniao','visita','permuta','proposta','fechado');