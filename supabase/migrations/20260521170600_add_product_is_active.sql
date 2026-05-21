-- Adiciona a flag de inativação (soft delete) na tabela de produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Garante que os registros antigos estejam ativos
UPDATE public.produtos
SET is_active = true
WHERE is_active IS NULL;
