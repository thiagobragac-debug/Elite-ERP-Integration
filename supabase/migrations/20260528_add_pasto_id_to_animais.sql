-- =================================================================
-- MIGRAÇÃO: Adicionar colunas pasto_id e campos extras em animais
-- =================================================================
-- Esta migração adiciona o campo pasto_id na tabela animais para 
-- permitir a associação e remanejamento de animais entre pastagens.
-- Também garante que campos extras utilizados no AnimalForm existam.
-- =================================================================

-- 1. Adicionar pasto_id na tabela animais
ALTER TABLE public.animais 
  ADD COLUMN IF NOT EXISTS pasto_id uuid REFERENCES public.pastos(id);

-- 2. Adicionar campos extras usados no formulário de animal (se não existem)
ALTER TABLE public.animais 
  ADD COLUMN IF NOT EXISTS peso_inicial   numeric,
  ADD COLUMN IF NOT EXISTS pelagem        text,
  ADD COLUMN IF NOT EXISTS origem         text DEFAULT 'Nascido',
  ADD COLUMN IF NOT EXISTS mae_brinco     text,
  ADD COLUMN IF NOT EXISTS pai_brinco     text,
  ADD COLUMN IF NOT EXISTS valor_compra   numeric,
  ADD COLUMN IF NOT EXISTS categoria      text,
  ADD COLUMN IF NOT EXISTS finalidade     text DEFAULT 'Corte',
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- 3. Criar índice para melhorar performance das consultas por pasto
CREATE INDEX IF NOT EXISTS idx_animais_pasto_id ON public.animais(pasto_id);
CREATE INDEX IF NOT EXISTS idx_animais_lote_id ON public.animais(lote_id);
CREATE INDEX IF NOT EXISTS idx_animais_fazenda_id ON public.animais(fazenda_id);

-- 4. Comentários para documentação
COMMENT ON COLUMN public.animais.pasto_id IS 'Pasto/Piquete atual onde o animal está alocado';
COMMENT ON COLUMN public.animais.lote_id IS 'Lote de manejo atual do animal';
COMMENT ON COLUMN public.animais.fazenda_id IS 'Fazenda à qual o animal pertence';
