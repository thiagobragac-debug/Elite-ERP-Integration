-- Adiciona a coluna 'tipo' para diferenciar produtos/insumos de serviços
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'produto' CHECK (tipo IN ('produto', 'servico'));

-- Atualiza itens não estocáveis como possíveis serviços (ou mantém produto por padrão)
UPDATE public.produtos
SET tipo = 'produto'
WHERE tipo IS NULL;
