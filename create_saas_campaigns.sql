CREATE TABLE IF NOT EXISTS public.saas_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  discount_percentage numeric NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT false,
  target_plan_ids text[] DEFAULT '{}', -- Array of plan names or IDs to target. Empty means ALL plans.
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.saas_campaigns ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para a Landing Page buscar campanhas ativas)
CREATE POLICY "Permitir leitura anonima de campanhas" 
ON public.saas_campaigns 
FOR SELECT 
TO public
USING (true);

-- Permitir que administradores ou autenticados editem (ajuste as roles conforme seu projeto)
CREATE POLICY "Permitir full access para autenticados" 
ON public.saas_campaigns 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
