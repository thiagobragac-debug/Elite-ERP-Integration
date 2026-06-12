ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS lote text;
ALTER TABLE public.movimentacoes_estoque ADD COLUMN IF NOT EXISTS data_validade date;
