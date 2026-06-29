ALTER TABLE public.categorias_sistema 
ADD COLUMN IF NOT EXISTS categoria_financeira_id UUID REFERENCES public.categorias_sistema(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
