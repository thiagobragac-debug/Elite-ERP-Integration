-- Adiciona colunas fiscais de serviço na tabela 'produtos'
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS codigo_servico_lc116 TEXT,
ADD COLUMN IF NOT EXISTS codigo_tributacao_nacional TEXT,
ADD COLUMN IF NOT EXISTS cnae_associado TEXT;
