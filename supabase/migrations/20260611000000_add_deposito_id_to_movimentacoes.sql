-- Add deposito_id to movimentacoes_estoque if it doesn't exist
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS deposito_id UUID REFERENCES public.depositos(id);

-- Optional index for faster lookups
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_deposito_id ON public.movimentacoes_estoque(deposito_id);
