-- 1. Cria a coluna is_system na tabela categorias_sistema (caso não exista)
ALTER TABLE public.categorias_sistema ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- 2. Atualiza as categorias essenciais já cadastradas para is_system = true
UPDATE public.categorias_sistema 
SET is_system = true 
WHERE modulo = 'estoque' 
AND nome IN (
  'Combustível', 
  'Defensivo', 
  'Fertilizante', 
  'Peças', 
  'Medicamento', 
  'Suplemento', 
  'Semente', 
  'Ração', 
  'Vacina', 
  'EPI'
);

-- 3. Atualiza o cache do Supabase para reconhecer a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';
