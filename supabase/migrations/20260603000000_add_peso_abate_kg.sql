-- Adiciona campo peso_abate_kg na tabela fazendas para configuração do tenant/fazenda
ALTER TABLE public.fazendas ADD COLUMN IF NOT EXISTS peso_abate_kg numeric DEFAULT 450;
