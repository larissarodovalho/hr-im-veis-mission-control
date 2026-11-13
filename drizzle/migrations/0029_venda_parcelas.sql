CREATE TABLE public.venda_parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  fluxo text NOT NULL CHECK (fluxo IN ('imovel','comissao')),
  beneficiario text CHECK (beneficiario IN ('hr','vendedor','captador','parceiro')),
  numero integer NOT NULL DEFAULT 1,
  vencimento date NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  forma text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','paga')),
  pago_em date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX venda_parcelas_venda_idx ON public.venda_parcelas(venda_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venda_parcelas TO authenticated;
GRANT ALL ON public.venda_parcelas TO service_role;
ALTER TABLE public.venda_parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff gerencia parcelas" ON public.venda_parcelas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER venda_parcelas_updated BEFORE UPDATE ON public.venda_parcelas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.venda_parcelas;