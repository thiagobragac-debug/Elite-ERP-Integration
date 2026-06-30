-- Migration to add fields for external fueling

ALTER TABLE public.abastecimentos
ADD COLUMN IF NOT EXISTS is_interno BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.parceiros(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS numero_recibo TEXT;

-- Comments
COMMENT ON COLUMN public.abastecimentos.is_interno IS 'Indicates if fueling was from an internal deposit or external gas station';
COMMENT ON COLUMN public.abastecimentos.fornecedor_id IS 'Reference to the external gas station (parceiro) if is_interno is false';
COMMENT ON COLUMN public.abastecimentos.numero_recibo IS 'Receipt or invoice number for external fueling';
