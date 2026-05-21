-- Adiciona as flags de arquitetura de materiais para suporte a itens de compra, venda e serviços
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_sellable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_storable BOOLEAN DEFAULT true;

-- Atualiza registros existentes para garantir coerência 
-- (tudo que existia antes era tratado como insumo de estoque e compra)
UPDATE public.produtos
SET 
  is_purchasable = true,
  is_sellable = false,
  is_storable = true
WHERE is_purchasable IS NULL;
