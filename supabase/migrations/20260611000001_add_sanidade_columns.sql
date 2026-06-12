ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS animal_id UUID REFERENCES public.animais(id);
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS dose TEXT;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS via_aplicacao TEXT;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS local_aplicacao TEXT;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS observacao TEXT;
