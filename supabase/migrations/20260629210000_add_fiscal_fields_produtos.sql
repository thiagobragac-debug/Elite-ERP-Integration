-- Add fiscal fields to produtos table for invoicing purposes
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS cest varchar(20);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS origem_mercadoria varchar(2);
