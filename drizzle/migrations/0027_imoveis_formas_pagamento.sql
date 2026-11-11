ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS formas_pagamento text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_imoveis_formas_pagamento ON public.imoveis USING gin (formas_pagamento);
UPDATE public.imoveis SET formas_pagamento = ARRAY['permuta'] WHERE 'Aceita permuta' = ANY(caracteristicas);