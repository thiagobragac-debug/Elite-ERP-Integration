-- Adiciona coluna 'tipo_item' na tabela 'categorias_sistema'
ALTER TABLE public.categorias_sistema
ADD COLUMN IF NOT EXISTS tipo_item TEXT DEFAULT 'ambos' CHECK (tipo_item IN ('produto', 'servico', 'ambos'));

-- Garante que todas as existentes padrão de estoque sejam classificadas adequadamente
UPDATE public.categorias_sistema
SET tipo_item = 'produto'
WHERE modulo = 'estoque' AND nome IN ('Combustíveis', 'Defensivos', 'Fertilizantes', 'Peças', 'Medicamentos', 'Suplementos', 'Sementes', 'Rações', 'Vacinas', 'EPIs');
