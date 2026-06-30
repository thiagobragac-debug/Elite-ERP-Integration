-- 1. Modificações na tabela manutencao_frota
ALTER TABLE manutencao_frota
ADD COLUMN IF NOT EXISTS data_fim timestamptz,
ADD COLUMN IF NOT EXISTS tipo_manutencao text DEFAULT 'corretiva',
ADD COLUMN IF NOT EXISTS estoque_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL;

-- 2. Modificações na tabela abastecimentos
ALTER TABLE abastecimentos
ADD COLUMN IF NOT EXISTS origem_abastecimento text DEFAULT 'externo',
ADD COLUMN IF NOT EXISTS estoque_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL;

-- 3. Modificações na tabela maquinas
ALTER TABLE maquinas
ADD COLUMN IF NOT EXISTS hodometro_virtual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vida_util_anos numeric DEFAULT 5;
