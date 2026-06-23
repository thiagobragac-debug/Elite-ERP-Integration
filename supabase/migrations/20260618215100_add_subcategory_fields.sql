-- Add parent_id to categorias_sistema to support hierarchical subcategories
ALTER TABLE public.categorias_sistema
ADD COLUMN parent_id UUID REFERENCES public.categorias_sistema(id) ON DELETE SET NULL;

-- Add subcategoria_id to produtos to associate a product/insumo with a specific subcategory
ALTER TABLE public.produtos
ADD COLUMN subcategoria_id UUID REFERENCES public.categorias_sistema(id) ON DELETE SET NULL;
