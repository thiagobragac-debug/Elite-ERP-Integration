ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS carencia_dias integer DEFAULT 0;
